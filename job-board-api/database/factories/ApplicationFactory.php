<?php

namespace Database\Factories;

use App\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Application>
 */
class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        $status = fake()->randomElement(['pending', 'pending', 'reviewing', 'interview', 'accepted', 'rejected']);

        return [
            // job_id and user_id are usually set by the seeder (unique constraint)
            'job_id' => 1,
            'user_id' => 1,
            'cover_letter' => fake()->boolean(70)
                ? implode("\n\n", [
                    'Bonjour,',
                    "Je suis tres interesse(e) par ce poste. J'ai une experience solide et je suis motive(e) pour contribuer a vos projets au Maroc.",
                    'Merci pour votre consideration.',
                ])
                : null,
            'resume_path' => null,
            'status' => $status,
            'rejection_reason' => $status === 'rejected'
                ? fake()->randomElement([
                    'Profile not aligned with the role requirements.',
                    'Experience level is not strong enough for this opening.',
                    'The role has already been filled.',
                ])
                : null,
            'company_notes' => in_array($status, ['reviewing', 'interview'], true)
                ? fake()->sentence()
                : null,
        ];
    }
}
