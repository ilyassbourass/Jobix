<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
