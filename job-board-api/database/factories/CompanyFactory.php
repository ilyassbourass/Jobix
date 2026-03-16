<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(4)),
            'logo' => null,
            'description' => fake()->paragraphs(asText: true),
            'website' => fake()->optional()->url(),
            'location' => fake()->randomElement([
                'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Meknes', 'Fes', 'Agadir', 'Oujda', 'Kenitra', 'Tetouan',
            ]),
            'industry' => fake()->randomElement([
                'Telecom', 'Banking', 'Consulting', 'IT Services', 'Industrial', 'Pharmaceutical', 'Distribution',
            ]),
            'company_size' => fake()->randomElement([50, 100, 200, 500, 1000, 3000]),
        ];
    }
}

