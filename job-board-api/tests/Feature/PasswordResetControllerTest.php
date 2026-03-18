<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_returns_generic_response_when_reset_link_sending_throws(): void
    {
        Password::shouldReceive('sendResetLink')
            ->once()
            ->andThrow(new \RuntimeException('Mail transport failed.'));

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'missing@example.com',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'If an account exists for this email, a reset link has been sent.');
    }

    public function test_reset_password_updates_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-user@example.com',
            'password' => Hash::make('OldPassword123!'),
        ]);

        $token = Password::broker()->createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'RESET-USER@EXAMPLE.COM',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Password reset successfully.');

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
    }

    public function test_reset_password_token_cannot_be_used_for_a_different_email(): void
    {
        $owner = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => Hash::make('OwnerPassword123!'),
        ]);

        $otherUser = User::factory()->create([
            'email' => 'other@example.com',
            'password' => Hash::make('OtherPassword123!'),
        ]);

        $token = Password::broker()->createToken($owner);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $otherUser->email,
            'password' => 'HijackedPassword123!',
            'password_confirmation' => 'HijackedPassword123!',
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'The password reset token is invalid or has expired.');

        $this->assertTrue(Hash::check('OwnerPassword123!', $owner->fresh()->password));
        $this->assertTrue(Hash::check('OtherPassword123!', $otherUser->fresh()->password));
    }
}
