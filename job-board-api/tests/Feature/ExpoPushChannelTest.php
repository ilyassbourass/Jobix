<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\PushToken;
use App\Models\User;
use App\Notifications\ApplicationStatusChangedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExpoPushChannelTest extends TestCase
{
    use RefreshDatabase;

    public function test_application_status_notification_is_sent_to_registered_expo_devices(): void
    {
        config(['app.mobile_url' => 'jobix://']);
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    ['status' => 'ok', 'id' => 'ticket-1'],
                ],
            ]),
        ]);

        [, $application] = $this->makeCompanyApplicationFixture();

        PushToken::create([
            'user_id' => $application->user_id,
            'token' => 'ExpoPushToken[test-status-token]',
            'platform' => 'android',
        ]);

        $application->user->notify(new ApplicationStatusChangedNotification($application));

        Http::assertSent(function ($request) use ($application) {
            $payload = $request->data()[0] ?? null;

            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $payload['to'] === 'ExpoPushToken[test-status-token]'
                && $payload['title'] === 'Application updated'
                && $payload['data']['url'] === 'jobix://jobs/' . $application->job_id;
        });
    }

    public function test_device_not_registered_errors_revoke_the_push_token(): void
    {
        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    [
                        'status' => 'error',
                        'details' => [
                            'error' => 'DeviceNotRegistered',
                        ],
                    ],
                ],
            ]),
        ]);

        [, $application] = $this->makeCompanyApplicationFixture();

        $pushToken = PushToken::create([
            'user_id' => $application->user_id,
            'token' => 'ExpoPushToken[test-revocation-token]',
            'platform' => 'android',
        ]);

        $application->user->notify(new ApplicationStatusChangedNotification($application));

        $this->assertNotNull($pushToken->fresh()->revoked_at);
    }

    private function makeCompanyApplicationFixture(): array
    {
        $company = Company::factory()->create();
        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
        ]);
        $jobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'expo-push-candidate',
        ]);
        $category = Category::create([
            'name' => 'Engineering',
            'slug' => 'engineering',
            'description' => 'Engineering roles',
        ]);
        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
            'is_active' => true,
            'published_at' => now()->subDay(),
            'expires_at' => now()->addDays(30),
        ]);

        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $jobSeeker->id,
            'cover_letter' => 'I would love to join your team.',
            'status' => 'pending',
        ]);

        $application->load(['job.company', 'user']);

        return [$companyUser, $application];
    }
}
