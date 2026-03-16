<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DatabaseSetupRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_setup_route_returns_not_found_when_disabled(): void
    {
        config([
            'app.database_setup.route_enabled' => false,
            'app.database_setup.route_token' => 'secret-token',
        ]);

        $this->get('/seed-database/secret-token')->assertNotFound();
    }

    public function test_database_setup_route_runs_migrations_and_seeding_when_token_matches(): void
    {
        config([
            'app.database_setup.route_enabled' => true,
            'app.database_setup.route_token' => 'secret-token',
        ]);

        Artisan::shouldReceive('call')
            ->once()
            ->with('migrate', ['--force' => true])
            ->andReturn(0);

        Artisan::shouldReceive('call')
            ->once()
            ->with('db:seed', ['--force' => true])
            ->andReturn(0);

        Artisan::shouldReceive('output')
            ->twice()
            ->andReturn('Done');

        $response = $this->get('/seed-database/secret-token');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Database setup completed successfully.')
            ->assertJsonPath('migrate_output', 'Done')
            ->assertJsonPath('seed_output', 'Done');
    }
}
