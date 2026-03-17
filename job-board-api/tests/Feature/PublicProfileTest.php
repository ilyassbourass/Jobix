<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class PublicProfileTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_public_profile_shows_resume_metadata_without_exposing_private_email(): void
    {
        Storage::fake('uploads');
        Storage::disk('uploads')->put('resumes/wxLQlHHJsntDJqe4CUDvZeBQnSGSVP2WNRYhJv68.pdf', 'resume contents');

        $user = User::factory()->create([
            'role' => 'job_seeker',
            'name' => 'Portfolio User',
            'username' => 'portfolio-user',
            'email' => 'private@example.com',
            'resume_path' => 'resumes/wxLQlHHJsntDJqe4CUDvZeBQnSGSVP2WNRYhJv68.pdf',
            'skills' => 'Laravel, React',
        ]);
        $company = Company::factory()->create();
        $category = Category::create([
            'name' => 'Engineering',
            'slug' => 'engineering',
            'description' => 'Engineering roles',
        ]);
        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
        ]);
        Application::create([
            'job_id' => $job->id,
            'user_id' => $user->id,
            'status' => 'accepted',
        ]);

        $response = $this->getJson("/api/users/{$user->username}");

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Portfolio User')
            ->assertJsonPath('username', 'portfolio-user')
            ->assertJsonPath('has_resume', true)
            ->assertJsonPath('resume_filename', 'portfolio-user-resume.pdf')
            ->assertJsonMissingPath('email')
            ->assertJsonMissingPath('applications_count')
            ->assertJsonMissingPath('recent_applications');
    }

    public function test_resume_access_endpoint_allows_the_profile_owner(): void
    {
        [$user] = $this->makeResumeAccessFixture();

        $this
            ->withHeaders($this->authHeaders($user))
            ->getJson("/api/users/{$user->username}/resume-access")
            ->assertOk()
            ->assertJsonPath('can_download', true);
    }

    public function test_resume_access_endpoint_allows_an_authorized_company(): void
    {
        [$user, $companyUser] = $this->makeResumeAccessFixture();

        $this
            ->withHeaders($this->authHeaders($companyUser))
            ->getJson("/api/users/{$user->username}/resume-access")
            ->assertOk()
            ->assertJsonPath('can_download', true);
    }

    public function test_resume_access_endpoint_blocks_unrelated_signed_in_users(): void
    {
        [$user] = $this->makeResumeAccessFixture();
        $otherJobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'other-job-seeker',
        ]);

        $this
            ->withHeaders($this->authHeaders($otherJobSeeker))
            ->getJson("/api/users/{$user->username}/resume-access")
            ->assertOk()
            ->assertJsonPath('can_download', false);
    }

    public function test_public_profile_does_not_treat_partially_numeric_username_as_user_id(): void
    {
        User::factory()->count(4)->create();
        User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'actual-user',
        ]);

        $this->getJson('/api/users/5abc')
            ->assertNotFound();
    }

    private function makeResumeAccessFixture(): array
    {
        Storage::fake('uploads');
        Storage::disk('uploads')->put('resumes/portfolio-user.pdf', 'resume contents');

        $user = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'portfolio-user',
            'resume_path' => 'resumes/portfolio-user.pdf',
        ]);

        $company = Company::factory()->create();
        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
            'username' => 'authorized-company',
        ]);

        $category = Category::create([
            'name' => 'Design',
            'slug' => 'design',
            'description' => 'Design roles',
        ]);

        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
        ]);

        Application::create([
            'job_id' => $job->id,
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        return [$user, $companyUser];
    }
}
