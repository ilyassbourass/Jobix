<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    private function normalizeProfileUrl(?string $value): ?string
    {
        $value = is_string($value) ? trim($value) : null;
        if (!$value) {
            return null;
        }

        // Common placeholder values from UI inputs should not block profile saving.
        if (in_array(strtolower($value), ['https://...', 'http://...', 'https://', 'http://', '...'], true)) {
            return null;
        }

        return $value;
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('company');
        return response()->json($user);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->merge([
            'linkedin_url' => $this->normalizeProfileUrl($request->input('linkedin_url')),
            'github_url' => $this->normalizeProfileUrl($request->input('github_url')),
            'portfolio_url' => $this->normalizeProfileUrl($request->input('portfolio_url')),
        ]);
        if ($request->filled('username')) {
            $normalized = preg_replace('/[^a-zA-Z0-9]/', '', (string) $request->input('username'));
            $request->merge(['username' => strtolower((string) $normalized)]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9]+$/', 'unique:users,username,' . $user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'current_password' => ['required_with:password', 'current_password:api'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'bio' => ['nullable', 'string', 'max:1000'],
            'headline' => ['nullable', 'string', 'max:160'],
            'seniority' => ['nullable', 'string', 'max:50'],
            'availability' => ['nullable', 'string', 'max:50'],
            'preferred_work_mode' => ['nullable', 'string', 'max:50'],
            'experience' => ['nullable', 'string', 'max:5000'],
            'projects' => ['nullable', 'string', 'max:8000'],
            'skills_with_level' => ['nullable', 'string', 'max:2000'],
            'skills' => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'remove_avatar' => ['nullable', 'boolean'],
            'company_name' => ['sometimes', 'string', 'max:255'],
            'company_description' => ['nullable', 'string'],
            'company_website' => ['nullable', 'url', 'max:255'],
            'company_location' => ['nullable', 'string', 'max:255'],
            'company_industry' => ['nullable', 'string', 'max:255'],
            'company_logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $user->name = $request->input('name', $user->name);
        $user->phone = $request->input('phone', $user->phone);
        if ($request->filled('username')) {
            $user->username = $request->input('username');
        } elseif (empty($user->username)) {
            $user->username = AuthController::generateUsername($user->name);
        }
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        if ($user->role === 'job_seeker') {
            $user->bio = $request->input('bio', $user->bio);
            $user->headline = $request->input('headline', $user->headline);
            $user->seniority = $request->input('seniority', $user->seniority);
            $user->availability = $request->input('availability', $user->availability);
            $user->preferred_work_mode = $request->input('preferred_work_mode', $user->preferred_work_mode);
            $user->experience = $request->input('experience', $user->experience);
            $user->projects = $request->input('projects', $user->projects);
            $user->skills_with_level = $request->input('skills_with_level', $user->skills_with_level);
            $user->skills = $request->input('skills', $user->skills);
            $user->location = $request->input('location', $user->location);
            $user->linkedin_url = $request->input('linkedin_url', $user->linkedin_url);
            $user->github_url = $request->input('github_url', $user->github_url);
            $user->portfolio_url = $request->input('portfolio_url', $user->portfolio_url);
            if ($request->boolean('remove_avatar')) {
                $this->deleteUserAvatarFile($user);
                $user->avatar = null;
            }
            if ($request->hasFile('avatar')) {
                $this->deleteUserAvatarFile($user);
                $user->avatar = $this->storeUserAvatar($request->file('avatar'));
            }
            if ($request->hasFile('resume')) {
                if ($user->resume_path && Storage::disk('local')->exists($user->resume_path)) {
                    Storage::disk('local')->delete($user->resume_path);
                }
                $user->resume_path = $request->file('resume')->store('resumes', 'local');
            }
        }
        $user->save();

        if ($user->role === 'company') {
            $company = $user->company;
            if ($company) {
                $company->name = $request->input('company_name', $company->name);
                $company->slug = Company::generateSlug($company->name, $company->id);
                $company->description = $request->input('company_description', $company->description);
                $company->website = $request->input('company_website', $company->website);
                $company->location = $request->input('company_location', $company->location);
                $company->industry = $request->input('company_industry', $company->industry);
                if ($request->boolean('remove_avatar')) {
                    $this->deleteCompanyLogoFile($company);
                    $company->logo = null;
                }
                if ($request->hasFile('avatar')) {
                    $this->deleteCompanyLogoFile($company);
                    $company->logo = $this->storeCompanyLogo($request->file('avatar'));
                }
                if ($request->hasFile('company_logo')) {
                    $this->deleteCompanyLogoFile($company);
                    $company->logo = $request->file('company_logo')->store('company-logos', 'public');
                }
                $company->save();
            }
        }

        return response()->json($user->fresh()->load('company'));
    }

    /**
     * Unified profile photo upload.
     * - Job seeker: saves to users.avatar (storage/avatars)
     * - Company: saves to company.logo (storage/company-logos)
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $user = $request->user();
        $file = $request->file('avatar');

        if ($user->role === 'company' && $user->company) {
            $company = $user->company;
            $this->deleteCompanyLogoFile($company);
            $company->logo = $this->storeCompanyLogo($file);
            $company->save();
        } else {
            $this->deleteUserAvatarFile($user);
            $user->avatar = $this->storeUserAvatar($file);
            $user->save();
        }

        return response()->json($user->fresh()->load('company'));
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($user->role === 'company' && $user->company) {
            $company = $user->company;
            $this->deleteCompanyLogoFile($company);
            $company->logo = null;
            $company->save();
        } else {
            $this->deleteUserAvatarFile($user);
            $user->avatar = null;
            $user->save();
        }

        return response()->json($user->fresh()->load('company'));
    }

    public function showPublic(string $username): JsonResponse
    {
        $user = User::where('username', $username)
            ->orWhere('id', (int) $username)
            ->with('company')
            ->firstOrFail();

        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar_url' => $user->avatar_url,
            'bio' => $user->bio,
            'headline' => $user->headline,
            'seniority' => $user->seniority,
            'availability' => $user->availability,
            'preferred_work_mode' => $user->preferred_work_mode,
            'experience' => $user->experience,
            'projects' => $user->projects,
            'skills_with_level' => $user->skills_with_level,
            'skills' => $user->skills,
            'location' => $user->location,
            'linkedin_url' => $user->linkedin_url,
            'github_url' => $user->github_url,
            'portfolio_url' => $user->portfolio_url,
            'created_at' => $user->created_at,
            'role' => $user->role,
            'has_resume' => $user->has_resume,
            'resume_filename' => $user->resume_filename,
            'company' => $user->company,
        ];

        return response()->json($data);
    }

    public function avatar(int $id)
    {
        $user = User::findOrFail($id);
        if (empty($user->avatar)) {
            return response()->json(['message' => 'Avatar not found.'], 404);
        }

        $path = str_contains($user->avatar, '/')
            ? ltrim($user->avatar, '/')
            : 'avatars/' . ltrim($user->avatar, '/');

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'Avatar not found.'], 404);
        }

        $mime = Storage::disk('public')->mimeType($path) ?? 'application/octet-stream';
        $contents = Storage::disk('public')->get($path);

        return response($contents, 200)
            ->header('Content-Type', $mime)
            ->header('Cache-Control', 'public, max-age=31536000, immutable');
    }

    public function deleteResume(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role !== 'job_seeker') {
            return response()->json(['message' => 'Only job seekers can remove saved resumes.'], 403);
        }

        if (!empty($user->resume_path) && Storage::disk('local')->exists($user->resume_path)) {
            Storage::disk('local')->delete($user->resume_path);
        }

        $user->resume_path = null;
        $user->save();

        return response()->json([
            'message' => 'Resume removed successfully.',
            'user' => $user->fresh()->load('company'),
        ]);
    }

    public function downloadResume(Request $request, string $username)
    {
        $userModel = User::where('username', $username)->orWhere('id', (int) $username)->firstOrFail();
        if (empty($userModel->resume_path) || !Storage::disk('local')->exists($userModel->resume_path)) {
            abort(404, 'Resume not found.');
        }

        $authUser = $request->user();
        if (!$authUser) {
            abort(401, 'Unauthorized.');
        }
        $isOwner = $authUser->id === $userModel->id;
        $isAdmin = $authUser->role === 'admin';
        
        $isCompanyOwner = false;
        if ($authUser->role === 'company') {
            // Check if this job seeker applied to any job owned by the authenticated company
            $hasApplied = \App\Models\Application::where('user_id', $userModel->id)
                ->whereHas('job', function ($query) use ($authUser) {
                    $query->where('company_id', $authUser->company_id);
                })->exists();
            $isCompanyOwner = $hasApplied;
        }

        if (!$isOwner && !$isAdmin && !$isCompanyOwner) {
            abort(403, 'Unauthorized.');
        }

        $name = $userModel->resume_filename
            ?: (($userModel->name ?? 'resume') . '-resume.' . pathinfo($userModel->resume_path, PATHINFO_EXTENSION));

        return Storage::disk('local')->download($userModel->resume_path, $name);
    }

    private function storeUserAvatar($file): string
    {
        $filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
        $file->storeAs('avatars', $filename, 'public');

        return $filename;
    }

    private function storeCompanyLogo($file): string
    {
        $filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());

        return $file->storeAs('company-logos', $filename, 'public');
    }

    private function deleteUserAvatarFile(User $user): void
    {
        if (empty($user->avatar)) {
            return;
        }

        $path = str_contains($user->avatar, '/')
            ? ltrim($user->avatar, '/')
            : 'avatars/' . ltrim($user->avatar, '/');

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function deleteCompanyLogoFile($company): void
    {
        if (empty($company?->logo)) {
            return;
        }

        if (Storage::disk('public')->exists($company->logo)) {
            Storage::disk('public')->delete($company->logo);
        }
    }
}
