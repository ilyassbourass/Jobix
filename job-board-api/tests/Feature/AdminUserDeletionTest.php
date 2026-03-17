<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class AdminUserDeletionTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_admin_cannot_delete_another_admin(): void
    {
        $admin = $this->makeAdmin();
        $otherAdmin = User::factory()->create([
            'role' => 'admin',
            'username' => 'otheradmin',
        ]);

        $this->withHeaders($this->authHeaders($admin))
            ->deleteJson("/api/admin/users/{$otherAdmin->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $otherAdmin->id]);
    }

    public function test_deleting_job_seeker_cleans_owned_files_and_notifications(): void
    {
        Storage::fake('uploads');

        $admin = $this->makeAdmin();
        $jobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'cleanupcandidate',
            'avatar' => 'cleanup-avatar.png',
            'resume_path' => 'resumes/cleanup-cv.pdf',
        ]);

        Storage::disk('uploads')->put('avatars/cleanup-avatar.png', 'avatar');
        Storage::disk('uploads')->put('resumes/cleanup-cv.pdf', 'resume');

        [$job] = $this->makeJobFixture();

        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $jobSeeker->id,
            'resume_path' => 'application-resumes/' . $jobSeeker->id . '/copy.pdf',
            'status' => 'pending',
        ]);

        Storage::disk('uploads')->put($application->resume_path, 'application resume');

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'Tests\\Notifications\\SyntheticNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $jobSeeker->id,
            'data' => json_encode(['message' => 'hello'], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeaders($this->authHeaders($admin))
            ->deleteJson("/api/admin/users/{$jobSeeker->id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $jobSeeker->id]);
        $this->assertDatabaseMissing('applications', ['id' => $application->id]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $jobSeeker->id,
        ]);

        Storage::disk('uploads')->assertMissing('avatars/cleanup-avatar.png');
        Storage::disk('uploads')->assertMissing('resumes/cleanup-cv.pdf');
        Storage::disk('uploads')->assertMissing($application->resume_path);
    }

    public function test_deleting_last_company_user_removes_company_assets_jobs_and_application_resumes(): void
    {
        Storage::fake('uploads');

        $admin = $this->makeAdmin();
        $company = Company::factory()->create([
            'logo' => 'company-logos/admin-cleanup.png',
        ]);
        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
            'username' => 'companycleanup',
        ]);

        Storage::disk('uploads')->put($company->logo, 'logo');

        $category = $this->makeCategory();
        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
        ]);
        $candidate = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'candidatecleanup',
        ]);
        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $candidate->id,
            'resume_path' => 'application-resumes/' . $candidate->id . '/cleanup.pdf',
            'status' => 'pending',
        ]);

        Storage::disk('uploads')->put($application->resume_path, 'application resume');

        $this->withHeaders($this->authHeaders($admin))
            ->deleteJson("/api/admin/users/{$companyUser->id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $companyUser->id]);
        $this->assertDatabaseMissing('companies', ['id' => $company->id]);
        $this->assertDatabaseMissing('jobs', ['id' => $job->id]);
        $this->assertDatabaseMissing('applications', ['id' => $application->id]);

        Storage::disk('uploads')->assertMissing($company->logo);
        Storage::disk('uploads')->assertMissing($application->resume_path);
    }

    public function test_deleting_one_company_user_keeps_company_when_other_company_users_remain(): void
    {
        Storage::fake('uploads');

        $admin = $this->makeAdmin();
        $company = Company::factory()->create([
            'logo' => 'company-logos/shared-company.png',
        ]);
        $deletedUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
            'username' => 'companymember1',
            'avatar' => 'member-avatar.png',
        ]);
        $remainingUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
            'username' => 'companymember2',
        ]);

        Storage::disk('uploads')->put('avatars/member-avatar.png', 'avatar');
        Storage::disk('uploads')->put($company->logo, 'logo');

        [$job] = $this->makeJobFixture($company);

        $this->withHeaders($this->authHeaders($admin))
            ->deleteJson("/api/admin/users/{$deletedUser->id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $deletedUser->id]);
        $this->assertDatabaseHas('users', ['id' => $remainingUser->id]);
        $this->assertDatabaseHas('companies', ['id' => $company->id]);
        $this->assertDatabaseHas('jobs', ['id' => $job->id]);

        Storage::disk('uploads')->assertMissing('avatars/member-avatar.png');
        Storage::disk('uploads')->assertExists($company->logo);
    }

    private function makeAdmin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'username' => 'admincleanup',
        ]);
    }

    private function makeJobFixture(?Company $company = null): array
    {
        $company = $company ?: Company::factory()->create();
        $category = $this->makeCategory();
        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
        ]);

        return [$job, $category, $company];
    }

    private function makeCategory(): Category
    {
        return Category::query()->firstOrCreate(
            ['slug' => 'engineering'],
            ['name' => 'Engineering', 'description' => 'Engineering roles']
        );
    }
}
