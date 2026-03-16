<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeededJobsEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_jobs_are_available_on_the_public_jobs_endpoint(): void
    {
        $this->seed(DatabaseSeeder::class);

        $response = $this->getJson('/api/jobs');

        $response->assertOk();
        $this->assertGreaterThan(0, (int) $response->json('total'));
        $this->assertNotEmpty($response->json('data'));
    }
}
