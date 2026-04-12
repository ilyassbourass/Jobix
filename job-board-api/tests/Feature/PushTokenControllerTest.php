<?php

namespace Tests\Feature;

use App\Models\PushToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class PushTokenControllerTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_authenticated_user_can_register_a_push_token(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->withHeaders($this->authHeaders($user))
            ->postJson('/api/push-tokens', [
                'token' => 'ExpoPushToken[test-registration-token]',
                'platform' => 'android',
                'device_id' => 'jobix-installation-1',
                'device_name' => 'Pixel 8',
                'app_version' => '1.0.0',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Push token registered.')
            ->assertJsonPath('data.platform', 'android')
            ->assertJsonPath('data.device_name', 'Pixel 8');

        $this->assertDatabaseHas('push_tokens', [
            'user_id' => $user->id,
            'token' => 'ExpoPushToken[test-registration-token]',
            'platform' => 'android',
            'device_id' => 'jobix-installation-1',
        ]);
    }

    public function test_registering_an_existing_push_token_reassigns_it_to_the_latest_user(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();

        PushToken::create([
            'user_id' => $firstUser->id,
            'token' => 'ExpoPushToken[test-reassign-token]',
            'platform' => 'android',
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($secondUser))
            ->postJson('/api/push-tokens', [
                'token' => 'ExpoPushToken[test-reassign-token]',
                'platform' => 'ios',
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('push_tokens', [
            'user_id' => $secondUser->id,
            'token' => 'ExpoPushToken[test-reassign-token]',
            'platform' => 'ios',
        ]);
    }

    public function test_authenticated_user_can_remove_a_push_token(): void
    {
        $user = User::factory()->create();

        PushToken::create([
            'user_id' => $user->id,
            'token' => 'ExpoPushToken[test-removal-token]',
            'platform' => 'android',
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($user))
            ->deleteJson('/api/push-tokens', [
                'token' => 'ExpoPushToken[test-removal-token]',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Push token removed.');

        $this->assertDatabaseMissing('push_tokens', [
            'token' => 'ExpoPushToken[test-removal-token]',
        ]);
    }
}
