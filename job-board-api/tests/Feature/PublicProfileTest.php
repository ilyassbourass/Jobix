<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_profile_shows_resume_metadata_without_exposing_private_email(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('resumes/wxLQlHHJsntDJqe4CUDvZeBQnSGSVP2WNRYhJv68.pdf', 'resume contents');

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
}
