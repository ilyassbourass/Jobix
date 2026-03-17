<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_without_username_generates_one_and_does_not_error(): void
    {
        Notification::fake();
        Mail::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ilyass Bourass',
            'email' => 'ilyass@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'job_seeker',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('verification_required', true);

        $this->assertNotEmpty($response->json('user.username'));
    }

    public function test_new_registration_can_resend_verification_code_after_cooldown(): void
    {
        Notification::fake();
        Mail::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Flow Debug',
            'username' => 'flowdebug',
            'email' => 'flowdebug@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'job_seeker',
        ]);

        $response->assertCreated();

        $this->travel(61)->seconds();

        $resendResponse = $this->postJson('/api/auth/email/verification-notification', [
            'email' => 'flowdebug@example.com',
            'user_id' => $response->json('user.id'),
        ]);

        $resendResponse
            ->assertOk()
            ->assertJsonPath('email', 'flowdebug@example.com')
            ->assertJsonPath('user_id', $response->json('user.id'));
    }
}
