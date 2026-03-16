<?php

namespace Tests\Feature;

use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyPublicSlugTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_public_endpoint_accepts_slug_and_keeps_id_fallback(): void
    {
        $company = Company::factory()->create([
            'name' => 'SQLI Maroc',
            'slug' => 'sqli-maroc',
        ]);

        $slugResponse = $this->getJson("/api/companies/{$company->slug}");
        $slugResponse
            ->assertOk()
            ->assertJsonPath('company.id', $company->id)
            ->assertJsonPath('company.slug', 'sqli-maroc');

        $idResponse = $this->getJson("/api/companies/{$company->id}");
        $idResponse
            ->assertOk()
            ->assertJsonPath('company.id', $company->id)
            ->assertJsonPath('company.slug', 'sqli-maroc');
    }
}
