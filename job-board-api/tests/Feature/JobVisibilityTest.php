<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\AuthenticatesWithJwt;
use Tests\TestCase;

class JobVisibilityTest extends TestCase
{
    use AuthenticatesWithJwt;
    use RefreshDatabase;

    public function test_public_users_cannot_view_inactive_jobs(): void
    {
        $job = $this->makeInactiveJob();

        $this->getJson("/api/jobs/{$job->id}")
            ->assertNotFound();
    }

    public function test_company_owner_can_view_their_inactive_job(): void
    {
        [$companyUser, $job] = $this->makeInactiveJobWithOwner();

        $this->withHeaders($this->authHeaders($companyUser))
            ->getJson("/api/jobs/{$job->id}")
            ->assertOk()
            ->assertJsonPath('id', $job->id);
    }

    private function makeInactiveJob(): Job
    {
        [, $job] = $this->makeInactiveJobWithOwner();

        return $job;
    }

    private function makeInactiveJobWithOwner(): array
    {
        $company = Company::factory()->create();
        $companyUser = User::factory()->create([
            'role' => 'company',
            'company_id' => $company->id,
        ]);
        $category = Category::create([
            'name' => 'Engineering',
            'slug' => 'engineering',
            'description' => 'Engineering roles',
        ]);

        $job = Job::factory()->create([
            'company_id' => $company->id,
            'category_id' => $category->id,
            'is_active' => false,
            'published_at' => now()->subDay(),
            'expires_at' => now()->addDays(14),
        ]);

        return [$companyUser, $job];
    }
}
