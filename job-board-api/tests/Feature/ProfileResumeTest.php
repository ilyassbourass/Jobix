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
        Storage::fake('uploads');

        $user = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'resume-owner',
            'resume_path' => 'resumes/old-resume.pdf',
        ]);

        Storage::disk('uploads')->put('resumes/old-resume.pdf', 'old resume');

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
        Storage::disk('uploads')->assertMissing('resumes/old-resume.pdf');
        Storage::disk('uploads')->assertExists($user->resume_path);

        $downloadResponse = $this
            ->withHeaders($this->authHeaders($user))
            ->get("/api/users/{$user->username}/resume");

        $downloadResponse->assertOk();
        $this->assertStringContainsString(
            'resumeowner-resume.pdf',
            (string) $downloadResponse->headers->get('content-disposition')
        );
    }

    public function test_company_logo_upload_uses_the_configured_uploads_disk(): void
    {
        Storage::fake('uploads');

        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => \App\Models\Company::factory()->create()->id,
            'username' => 'company-logo-owner',
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($companyUser))
            ->post('/api/profile/upload-avatar', [
                'avatar' => UploadedFile::fake()->image('logo.png'),
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('company.logo_url', url('api/companies/' . $companyUser->company_id . '/logo?v=' . rawurlencode((string) $companyUser->fresh()->company->logo)));

        Storage::disk('uploads')->assertExists($companyUser->fresh()->company->logo);

        $logoResponse = $this->get('/api/companies/' . $companyUser->company_id . '/logo');

        $logoResponse->assertOk();
    }

    public function test_profile_password_change_allows_blank_portfolio_url(): void
    {
        $user = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'portfolio-owner',
            'password' => bcrypt('OldPassword123!'),
            'portfolio_url' => null,
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($user))
            ->post('/api/user/profile', [
                '_method' => 'PUT',
                'name' => $user->name,
                'username' => $user->username,
                'portfolio_url' => '',
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $response->assertOk();

        $user->refresh();

        $this->assertNull($user->portfolio_url);
        $this->assertTrue(password_verify('NewPassword123!', $user->password));
    }

    public function test_profile_password_change_normalizes_portfolio_url_without_scheme(): void
    {
        $user = User::factory()->create([
            'role' => 'job_seeker',
            'username' => 'portfolio-owner-2',
            'password' => bcrypt('OldPassword123!'),
            'portfolio_url' => null,
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($user))
            ->post('/api/user/profile', [
                '_method' => 'PUT',
                'name' => $user->name,
                'username' => $user->username,
                'portfolio_url' => 'portfolio.example.com/me',
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $response->assertOk();

        $user->refresh();

        $this->assertSame('https://portfolio.example.com/me', $user->portfolio_url);
        $this->assertTrue(password_verify('NewPassword123!', $user->password));
    }
}
