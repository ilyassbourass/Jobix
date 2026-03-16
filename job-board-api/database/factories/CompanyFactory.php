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
        $name = $this->faker->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(4)),
            'logo' => null,
            'description' => $this->faker->paragraphs(asText: true),
            'website' => $this->faker->optional()->url(),
            'location' => $this->faker->randomElement([
                'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Meknes', 'Fes', 'Agadir', 'Oujda', 'Kenitra', 'Tetouan',
            ]),
            'industry' => $this->faker->randomElement([
                'Telecom', 'Banking', 'Consulting', 'IT Services', 'Industrial', 'Pharmaceutical', 'Distribution',
            ]),
            'company_size' => $this->faker->randomElement([50, 100, 200, 500, 1000, 3000]),
        ];
    }
}
