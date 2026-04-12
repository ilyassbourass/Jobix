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

class ApplicationResumeDownloadTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_company_owner_can_download_application_resume_with_a_human_filename(): void
    {
        Storage::fake('uploads');

        $company = Company::factory()->create();
        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
        ]);
        $jobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'resume-owner',
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
            'cover_letter' => 'Resume attached for review.',
            'resume_path' => 'application-resumes/resume-owner-cv.pdf',
            'status' => 'pending',
        ]);

        Storage::disk('uploads')->put($application->resume_path, 'resume contents');

        $response = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->get("/api/applications/{$application->id}/resume");

        $response->assertOk();
        $this->assertStringContainsString(
            "resume-owner-application-{$application->id}.pdf",
            (string) $response->headers->get('content-disposition')
        );
    }
}
