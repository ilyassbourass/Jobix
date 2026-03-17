<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\WelcomeEmail;
use App\Models\Company;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        if ($request->filled('email')) {
            $request->merge([
                'email' => strtolower(trim((string) $request->input('email'))),
            ]);
        }

        if ($request->filled('username')) {
            $normalized = preg_replace('/[^a-zA-Z0-9]/', '', (string) $request->input('username'));
            $request->merge(['username' => strtolower((string) $normalized)]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9]+$/'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'in:company,job_seeker'],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['required_if:role,company', 'nullable', 'string', 'max:255'],
            'company_description' => ['nullable', 'string'],
            'company_website' => ['nullable', 'url', 'max:255'],
            'company_location' => ['nullable', 'string', 'max:255'],
            'company_industry' => ['nullable', 'string', 'max:255'],
        ]);

        $existingUser = User::where('email', $validated['email'])->first();
        $isNewUser = !$existingUser;
        $requestedUsername = isset($validated['username'])
            ? preg_replace('/[^a-zA-Z0-9]/', '', (string) $validated['username'])
            : null;
        $requestedUsername = $requestedUsername ? strtolower($requestedUsername) : null;

        if ($requestedUsername) {
            $usernameExists = User::query()
                ->when($existingUser, fn ($query) => $query->where('id', '!=', $existingUser->id))
                ->where('username', $requestedUsername)
                ->exists();

            if ($usernameExists) {
                throw ValidationException::withMessages([
                    'username' => ['This username is already taken. Please choose another.'],
                ]);
            }
        }

        if ($existingUser && $existingUser->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'An account with this email already exists. Please log in or reset your password.',
            ], 409);
        }

        $user = DB::transaction(function () use ($validated, $existingUser, $requestedUsername) {
            $company = null;

            if ($validated['role'] === 'company' && !empty($validated['company_name'])) {
                if ($existingUser?->company) {
                    $existingUser->company->update([
                        'name' => $validated['company_name'],
                        'slug' => Company::generateSlug($validated['company_name'], $existingUser->company->id),
                        'description' => $validated['company_description'] ?? null,
                        'website' => $validated['company_website'] ?? null,
                        'location' => $validated['company_location'] ?? null,
                        'industry' => $validated['company_industry'] ?? null,
                    ]);
                    $company = $existingUser->company->fresh();
                } else {
                    $company = Company::create([
                        'name' => $validated['company_name'],
                        'slug' => Company::generateSlug($validated['company_name']),
                        'description' => $validated['company_description'] ?? null,
                        'website' => $validated['company_website'] ?? null,
                        'location' => $validated['company_location'] ?? null,
                        'industry' => $validated['company_industry'] ?? null,
                    ]);
                }
            }

            if ($existingUser) {
                $username = $requestedUsername
                    ?: ($existingUser->username ?: static::generateUsername($validated['name']));

                $existingUser->forceFill([
                    'name' => $validated['name'],
                    'username' => $username,
                    'password' => Hash::make($validated['password']),
                    'role' => $validated['role'],
                    'company_id' => $company?->id,
                    'phone' => $validated['phone'] ?? null,
                    'email_verification_code' => null,
                    'email_verification_expires_at' => null,
                    'email_verification_sent_at' => null,
                ])->save();

                return $existingUser->refresh();
            }

            $username = $requestedUsername ?: static::generateUsername($validated['name']);

            return User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'username' => $username,
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'company_id' => $company?->id,
                'phone' => $validated['phone'] ?? null,
            ]);
        });

        $verificationEmailQueued = true;

        try {
            event(new Registered($user));
        } catch (\Throwable $e) {
            report($e);
            $verificationEmailQueued = false;
        }

        if ($isNewUser) {
            try {
                Mail::to($user->email)->send(new WelcomeEmail($user));
            } catch (\Throwable $e) {
                // Registration should still succeed if the welcome email fails.
            }
        }

        return response()->json([
            'message' => $verificationEmailQueued
                ? 'Your account has been created. Enter the verification code sent to your email to continue.'
                : 'Your account has been created. We could not send the verification code right away. Use resend code on the verification page to continue.',
            'user' => $user->load('company'),
            'verification_required' => true,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        if ($request->filled('email')) {
            $request->merge([
                'email' => strtolower(trim((string) $request->input('email'))),
            ]);
        }

        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $credentials = $request->only('email', 'password');
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['We could not sign you in with those credentials.'],
            ]);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before signing in.',
                'verification_required' => true,
                'email' => $user->email,
                'user_id' => $user->id,
            ], 403);
        }

        if (!$token = auth('api')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['We could not sign you in with those credentials.'],
            ]);
        }

        $user = auth('api')->user()->load('company');

        return response()->json([
            'message' => 'Signed in successfully.',
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public function me(): JsonResponse
    {
        $user = auth('api')->user()->load('company');

        return response()->json($user);
    }

    public function refresh(): JsonResponse
    {
        $token = auth('api')->refresh();

        return response()->json([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
        ]);
    }

    public static function generateUsername(string $name): string
    {
        $base = Str::slug($name, '');
        $base = preg_replace('/[^a-z0-9]/', '', $base) ?: 'user';
        $username = $base;
        $suffix = 0;

        while (User::where('username', $username)->exists()) {
            $suffix++;
            $username = $base . $suffix;
        }

        return $username;
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json(['message' => 'Signed out successfully.']);
    }
}
