<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class ProfileResumeTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_job_seeker_uploading_a_new_resume_replaces_the_previous_file(): void
    {
        Storage::fake('local');

        $user = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'resume-owner',
            'resume_path' => 'resumes/old-resume.pdf',
        ]);

        Storage::disk('local')->put('resumes/old-resume.pdf', 'old resume');

        $response = $this
            ->withHeaders($this->authHeaders($user))
            ->post('/api/user/profile', [
                '_method' => 'PUT',
                'name' => $user->name,
                'username' => $user->username,
                'resume' => UploadedFile::fake()->create('new-resume.pdf', 120, 'application/pdf'),
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('has_resume', true);

        $user->refresh();

        $this->assertNotSame('resumes/old-resume.pdf', $user->resume_path);
        $this->assertSame('resumeowner-resume.pdf', $user->resume_filename);
        Storage::disk('local')->assertMissing('resumes/old-resume.pdf');
        Storage::disk('local')->assertExists($user->resume_path);

        $downloadResponse = $this
            ->withHeaders($this->authHeaders($user))
            ->get("/api/users/{$user->username}/resume");

        $downloadResponse->assertOk();
        $this->assertStringContainsString(
            'resumeowner-resume.pdf',
            (string) $downloadResponse->headers->get('content-disposition')
        );
    }
}
