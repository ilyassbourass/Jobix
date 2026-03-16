<?php

namespace Database\Factories;

use App\Models\Job;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Job>
 */
class JobFactory extends Factory
{
    protected $model = Job::class;

    public function definition(): array
    {
        $title = $this->faker->randomElement([
            'Full Stack Developer',
            'Laravel Developer',
            'React Developer',
            'IT Support Technician',
            'Data Analyst',
            'Digital Marketing Specialist',
            'Customer Support Agent',
            'Network Administrator',
            'Business Analyst',
            'Account Manager',
            'HR Specialist',
            'QA Engineer',
            'DevOps Engineer',
            'Product Owner',
        ]);

        $jobType = $this->faker->randomElement(['full_time', 'part_time', 'remote']);
        $experience = $this->faker->randomElement(['entry', 'mid', 'senior']);
        [$salaryMin, $salaryMax] = $this->moroccoSalaryRange($experience);

        $location = $this->faker->randomElement([
            'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Meknes', 'Fes', 'Agadir', 'Oujda', 'Kenitra', 'Tetouan',
        ]);

        return [
            // company_id/category_id are usually provided by the seeder
            'company_id' => 1,
            'category_id' => 1,
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::lower(Str::random(4)),
            'description' => $this->makeDescription($title, $location, $jobType, $experience),
            'location' => $location,
            'job_type' => $jobType,
            'experience_level' => $experience,
            'salary_min' => $salaryMin,
            'salary_max' => $salaryMax,
            'is_active' => true,
            'published_at' => now()->subDays($this->faker->numberBetween(0, 14)),
            'expires_at' => now()->addDays($this->faker->numberBetween(15, 60)),
        ];
    }

    private function moroccoSalaryRange(string $experience): array
    {
        // MAD monthly salary ranges
        // Junior: 4k-7k, Mid: 7k-12k, Senior: 12k-20k
        return match ($experience) {
            'entry' => [$this->faker->numberBetween(4000, 6000), $this->faker->numberBetween(6500, 7000)],
            'mid' => [$this->faker->numberBetween(7000, 9500), $this->faker->numberBetween(10000, 12000)],
            default => [$this->faker->numberBetween(12000, 16000), $this->faker->numberBetween(17000, 20000)],
        };
    }

    private function makeDescription(string $title, string $location, string $jobType, string $experience): string
    {
        $typeLabel = match ($jobType) {
            'remote' => 'Remote',
            'part_time' => 'Part Time',
            default => 'Full Time',
        };

        $expLabel = match ($experience) {
            'entry' => 'Junior',
            'mid' => 'Mid-level',
            default => 'Senior',
        };

        $responsibilities = [
            'Collaborate with product and business teams to deliver high-quality features.',
            'Write clean, maintainable code and participate in code reviews.',
            'Troubleshoot production issues and improve system reliability.',
            'Document technical decisions and contribute to continuous improvement.',
        ];

        $requirements = [
            'Strong communication skills in French and/or English (Arabic is a plus).',
            'Good understanding of Git, testing, and modern development practices.',
            'Ability to work autonomously and deliver on time.',
        ];

        $roleSpecific = match (true) {
            str_contains($title, 'Laravel') => [
                'Solid experience with Laravel 10, REST APIs, queues, and Eloquent.',
                'Good knowledge of MySQL optimization and API security.',
            ],
            str_contains($title, 'React') => [
                'Experience with React, hooks, state management, and component design.',
                'Comfortable consuming REST APIs and building responsive UIs.',
            ],
            str_contains($title, 'Full Stack') => [
                'Hands-on experience with Laravel and React in production environments.',
                'Comfortable designing APIs and building modern frontends.',
            ],
            str_contains($title, 'Data Analyst') => [
                'Strong Excel/SQL skills and ability to build dashboards and reports.',
                'Experience with data visualization tools (Power BI/Tableau is a plus).',
            ],
            str_contains($title, 'Marketing') => [
                'Experience with paid campaigns (Meta/Google), SEO, and analytics.',
                'Ability to create content calendars and optimize conversion funnels.',
            ],
            str_contains($title, 'Customer Support') => [
                'Strong customer empathy and ability to resolve issues quickly.',
                'Experience with ticketing tools and SLA-based support.',
            ],
            str_contains($title, 'Network') => [
                'Knowledge of LAN/WAN, firewalls, routing, and monitoring tools.',
                'Experience with Windows/Linux administration is a plus.',
            ],
            default => [
                'Relevant experience in a similar role.',
                'Strong attention to detail and problem-solving mindset.',
            ],
        };

        $benefits = [
            'Competitive salary package (MAD) plus performance bonus.',
            'Health insurance (CNSS/AMO) and paid time off.',
            'Training budget and certification support.',
            'Flexible working hours depending on the team.',
        ];

        return implode("\n", [
            "{$expLabel} {$title} - {$typeLabel} - {$location}",
            '',
            '## About the role',
            "We're hiring a {$expLabel} {$title} to join a fast-paced team serving customers across Morocco. You will work closely with cross-functional stakeholders to deliver reliable, secure, and scalable solutions.",
            '',
            '## Responsibilities',
            '- ' . implode("\n- ", $this->faker->randomElements($responsibilities, 3)),
            '',
            '## Requirements',
            '- ' . implode("\n- ", array_merge($roleSpecific, $this->faker->randomElements($requirements, 2))),
            '',
            '## Nice to have',
            '- Experience in regulated sectors (banking/telecom) or large-scale environments.',
            '- Familiarity with CI/CD and monitoring (GitHub Actions, GitLab CI, Prometheus).',
            '',
            '## Benefits',
            '- ' . implode("\n- ", $this->faker->randomElements($benefits, 3)),
        ]);
    }
}
