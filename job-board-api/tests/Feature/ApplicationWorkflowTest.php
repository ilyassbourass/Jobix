<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class ApplicationWorkflowTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_company_can_move_an_application_to_interview_and_save_notes(): void
    {
        Mail::fake();

        [$companyUser, $application] = $this->makeCompanyApplicationFixture();

        $response = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->putJson("/api/applications/{$application->id}/status", [
                'status' => 'interview',
                'company_notes' => 'Strong portfolio. Schedule a technical interview next.',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'interview')
            ->assertJsonPath('company_notes', 'Strong portfolio. Schedule a technical interview next.');

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'interview',
            'company_notes' => 'Strong portfolio. Schedule a technical interview next.',
            'rejection_reason' => null,
        ]);
    }

    public function test_company_cannot_update_another_companys_application(): void
    {
        Mail::fake();

        [, $application] = $this->makeCompanyApplicationFixture();
        $otherCompany = Company::factory()->create();
        $otherCompanyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $otherCompany->id,
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($otherCompanyUser))
            ->putJson("/api/applications/{$application->id}/status", [
                'status' => 'rejected',
                'rejection_reason' => 'This should not be allowed.',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'pending',
        ]);
    }

    public function test_job_application_uses_the_saved_profile_resume_when_no_new_file_is_uploaded(): void
    {
        Mail::fake();
        Storage::fake('uploads');

        $company = Company::factory()->create();
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
        $jobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'resume-candidate',
            'resume_path' => 'resumes/profile-resume.pdf',
        ]);

        Storage::disk('uploads')->put('resumes/profile-resume.pdf', 'profile resume');

        $response = $this
            ->withHeaders($this->authHeaders($jobSeeker))
            ->postJson('/api/applications', [
                'job_id' => $job->id,
                'cover_letter' => 'I would love to join this team.',
            ]);

        $response->assertCreated();

        $resumePath = $response->json('resume_path');

        $this->assertNotNull($resumePath);
        $this->assertNotSame('resumes/profile-resume.pdf', $resumePath);
        $this->assertStringStartsWith('application-resumes/' . $jobSeeker->id . '/', $resumePath);
        Storage::disk('uploads')->assertExists('resumes/profile-resume.pdf');
        Storage::disk('uploads')->assertExists($resumePath);
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
            'username' => 'candidate-user',
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

        return [$companyUser, $application];
    }
}
