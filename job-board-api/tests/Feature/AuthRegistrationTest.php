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
}
