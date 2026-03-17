<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class EmailVerificationFlowTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_unverified_user_cannot_sign_in(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Please verify your email address before signing in.',
                'verification_required' => true,
            ]);
    }

    public function test_unverified_user_cannot_access_verified_route(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this
            ->withHeaders($this->authHeaders($user))
            ->getJson('/api/user/profile');

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Please verify your email address before continuing.',
                'verification_required' => true,
            ]);
    }

    public function test_resend_verification_code_enforces_cooldown(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email_verification_sent_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/email/verification-notification', [
            'email' => $user->email,
        ]);

        $response
            ->assertStatus(429)
            ->assertJsonPath('message', 'Please wait before requesting another verification code.');

        Notification::assertNothingSent();
    }

    public function test_verification_code_can_be_resent_after_cooldown(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email_verification_sent_at' => now()->subMinutes(2),
        ]);

        $response = $this->postJson('/api/auth/email/verification-notification', [
            'email' => $user->email,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'A new verification code has been sent to your email.');

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_user_can_verify_with_a_fresh_email_code(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();
        $user->sendEmailVerificationNotification();

        $code = $user->fresh()->currentEmailVerificationCode();

        $response = $this->postJson('/api/auth/verify-email', [
            'email' => $user->email,
            'code' => $code,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Your email has been verified successfully. You can now sign in.');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_resend_keeps_the_current_code_valid_until_it_expires(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create();
        $user->sendEmailVerificationNotification();
        $user->forceFill([
            'email_verification_sent_at' => now()->subMinutes(2),
        ])->save();

        $originalCode = $user->fresh()->currentEmailVerificationCode();

        $response = $this->postJson('/api/auth/email/verification-notification', [
            'email' => $user->email,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'A new verification code has been sent to your email.');

        $user = $user->fresh();
        $resentCode = $user->currentEmailVerificationCode();

        $this->assertNotSame($originalCode, $resentCode);
        $this->assertTrue($user->hasMatchingEmailVerificationCode($originalCode));
        $this->assertTrue($user->hasMatchingEmailVerificationCode($resentCode));

        $verifyResponse = $this->postJson('/api/auth/verify-email', [
            'email' => $user->email,
            'code' => $originalCode,
        ]);

        $verifyResponse->assertOk();
    }

    public function test_resend_can_target_the_pending_user_by_id(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email_verification_sent_at' => now()->subMinutes(2),
        ]);

        $response = $this->postJson('/api/auth/email/verification-notification', [
            'email' => $user->email,
            'user_id' => $user->id,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'A new verification code has been sent to your email.');

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_resend_prefers_pending_user_id_even_if_email_is_stale(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email_verification_sent_at' => now()->subMinutes(2),
        ]);

        $response = $this->postJson('/api/auth/email/verification-notification', [
            'email' => 'stale@example.com',
            'user_id' => $user->id,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'A new verification code has been sent to your email.')
            ->assertJsonPath('email', $user->email)
            ->assertJsonPath('user_id', $user->id);

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_resend_finds_pending_user_case_insensitively_by_email(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email' => 'MixedCaseUser@example.com',
            'email_verification_sent_at' => now()->subMinutes(2),
        ]);

        $response = $this->postJson('/api/auth/email/verification-notification', [
            'email' => 'mixedcaseuser@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'A new verification code has been sent to your email.');

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }
}
