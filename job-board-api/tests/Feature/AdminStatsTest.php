<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class AdminStatsTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_admin_stats_endpoint_returns_daily_timeseries(): void
    {
        $admin = $this->makeAdmin();
        $this->makeStatsFixture();

        $response = $this
            ->withHeaders($this->authHeaders($admin))
            ->getJson('/api/admin/stats?range=30');

        $response
            ->assertOk()
            ->assertJsonPath('users_count', 3)
            ->assertJsonPath('companies_count', 1)
            ->assertJsonPath('jobs_count', 1)
            ->assertJsonPath('applications_count', 1)
            ->assertJsonPath('range', 30)
            ->assertJsonCount(30, 'timeseries');
    }

    public function test_admin_stats_endpoint_returns_monthly_timeseries_for_year_range(): void
    {
        $admin = $this->makeAdmin();
        $this->makeStatsFixture();

        $response = $this
            ->withHeaders($this->authHeaders($admin))
            ->getJson('/api/admin/stats?range=365');

        $response
            ->assertOk()
            ->assertJsonPath('range', 365)
            ->assertJsonCount(12, 'timeseries');
    }

    private function makeAdmin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@example.com',
            'username' => 'adminuser',
        ]);
    }

    private function makeStatsFixture(): void
    {
        $company = Company::factory()->create();
        $category = Category::create([
            'name' => 'Engineering',
            'slug' => 'engineering',
            'description' => 'Engineering roles',
        ]);

        User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
            'username' => 'companymanager',
        ]);

        $jobSeeker = User::factory()->create([
            'role' => 'job_seeker',
            'company_id' => null,
            'username' => 'jobseekeruser',
        ]);

        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
            'published_at' => now()->subDays(2),
            'expires_at' => now()->addDays(30),
        ]);

        Application::create([
            'job_id' => $job->id,
            'user_id' => $jobSeeker->id,
            'cover_letter' => 'I would love to join your team.',
            'status' => 'pending',
        ]);
    }
}
