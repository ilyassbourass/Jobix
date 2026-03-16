<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use App\Notifications\ApplicationStatusChangedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class NotificationCenterTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_company_receives_database_notification_when_a_candidate_applies(): void
    {
        Mail::fake();

        [$companyUser, $job, $jobSeeker] = $this->makeJobFixture();

        $response = $this
            ->withHeaders($this->authHeaders($jobSeeker))
            ->postJson('/api/applications', [
                'job_id' => $job->id,
                'cover_letter' => 'I would love to contribute to this team.',
            ]);

        $response->assertCreated();

        $notification = $companyUser->fresh()->notifications()->latest()->first();

        $this->assertNotNull($notification);
        $this->assertSame('application_received', $notification->data['type']);
        $this->assertSame('New application received', $notification->data['title']);
        $this->assertSame('/company', $notification->data['action_url']);
    }

    public function test_candidate_receives_database_notification_when_status_changes(): void
    {
        Mail::fake();

        [$companyUser, $application] = $this->makeCompanyApplicationFixture();

        $response = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->putJson("/api/applications/{$application->id}/status", [
                'status' => 'interview',
                'company_notes' => 'We would like to schedule a call.',
            ]);

        $response->assertOk();

        $notification = $application->user->fresh()->notifications()->latest()->first();

        $this->assertNotNull($notification);
        $this->assertSame('application_status_changed', $notification->data['type']);
        $this->assertSame('Interview stage reached', $notification->data['title']);
        $this->assertSame('/jobs/' . $application->job_id, $notification->data['action_url']);
    }

    public function test_user_can_list_and_mark_notifications_as_read(): void
    {
        [$companyUser, $application] = $this->makeCompanyApplicationFixture();
        $application->load(['job.company', 'user']);

        $companyUser->notify(new ApplicationStatusChangedNotification($application));
        $notification = $companyUser->fresh()->notifications()->latest()->first();

        $listResponse = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->getJson('/api/notifications');

        $listResponse
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonPath('data.0.id', $notification->id)
            ->assertJsonPath('data.0.read_at', null);

        $readResponse = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->postJson("/api/notifications/{$notification->id}/read");

        $readResponse
            ->assertOk()
            ->assertJsonPath('id', $notification->id);

        $this->assertNotNull($companyUser->fresh()->notifications()->first()->read_at);

        $markAllResponse = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->postJson('/api/notifications/read-all');

        $markAllResponse
            ->assertOk()
            ->assertJsonPath('message', 'Notifications marked as read.');
    }

    public function test_user_can_delete_single_notification_and_clear_all(): void
    {
        [$companyUser, $application] = $this->makeCompanyApplicationFixture();
        $application->load(['job.company', 'user']);

        $companyUser->notify(new ApplicationStatusChangedNotification($application));
        $companyUser->notify(new ApplicationStatusChangedNotification($application));

        $notification = $companyUser->fresh()->notifications()->latest()->first();

        $deleteResponse = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->deleteJson("/api/notifications/{$notification->id}");

        $deleteResponse
            ->assertOk()
            ->assertJsonPath('message', 'Notification deleted.');

        $this->assertCount(1, $companyUser->fresh()->notifications()->get());

        $clearResponse = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->deleteJson('/api/notifications');

        $clearResponse
            ->assertOk()
            ->assertJsonPath('message', 'Notifications cleared.');

        $this->assertCount(0, $companyUser->fresh()->notifications()->get());
    }

    private function makeJobFixture(): array
    {
        $company = Company::factory()->create();
        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
        ]);
        $jobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'notification-candidate',
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

        return [$companyUser, $job, $jobSeeker];
    }

    private function makeCompanyApplicationFixture(): array
    {
        [$companyUser, $job, $jobSeeker] = $this->makeJobFixture();

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
