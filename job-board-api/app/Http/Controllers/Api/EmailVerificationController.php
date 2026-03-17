<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class EmailVerificationController extends Controller
{
    private const RESEND_COOLDOWN_SECONDS = 60;

    public function send(Request $request): JsonResponse
    {
        $email = $request->user()?->email;

        if (!$email) {
            $validated = $request->validate([
                'email' => ['required', 'email'],
            ]);
            $email = $validated['email'];
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'If an account exists for this email, a verification code has been sent.',
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'This email address is already verified.',
            ]);
        }

        $secondsRemaining = $this->secondsUntilNextSend($user);

        if ($secondsRemaining > 0) {
            return response()->json([
                'message' => 'Please wait before requesting another verification code.',
                'retry_after_seconds' => $secondsRemaining,
            ], 429);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'A new verification code has been sent to your email.',
            'retry_after_seconds' => self::RESEND_COOLDOWN_SECONDS,
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid verification code.',
            ], 422);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'This email address is already verified.',
            ]);
        }

        if (!$user->email_verification_code || !$user->email_verification_expires_at) {
            return response()->json([
                'message' => 'No active verification code was found. Please request a new code.',
            ], 422);
        }

        if (now()->greaterThan($user->email_verification_expires_at)) {
            $user->clearEmailVerificationCode();

            return response()->json([
                'message' => 'This verification code has expired. Please request a new code.',
            ], 422);
        }

        if (!$user->hasMatchingEmailVerificationCode($validated['code'])) {
            return response()->json([
                'message' => 'The verification code is incorrect. Please try again.',
            ], 422);
        }

        $user->markEmailAsVerified();
        $user->clearEmailVerificationCode();

        event(new Verified($user));

        return response()->json([
            'message' => 'Your email has been verified successfully. You can now sign in.',
        ]);
    }

    private function secondsUntilNextSend(User $user): int
    {
        if (!$user->email_verification_sent_at) {
            return 0;
        }

        $availableAt = $user->email_verification_sent_at
            ->copy()
            ->addSeconds(self::RESEND_COOLDOWN_SECONDS);

        if ($availableAt->isPast()) {
            return 0;
        }

        return max(1, $availableAt->timestamp - now()->timestamp);
    }
}
