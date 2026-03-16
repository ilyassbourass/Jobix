<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MoroccoDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $companies = $this->seedCompanies();
            $categories = Category::pluck('id')->all();

            // 8 company accounts (useful for dashboard demos)
            $this->seedCompanyUsers($companies);

            // 15 job seekers
            $jobSeekers = $this->seedJobSeekers(15);

            // 30 jobs
            $jobs = $this->seedJobs($companies, $categories, 30);

            // 25 applications (unique job+user)
            $this->seedApplications($jobs, $jobSeekers, 25);
        });
    }

    private function seedCompanies(): array
    {
        $data = [
            [
                'name' => 'OCP Group',
                'website' => 'https://www.ocpgroup.ma',
                'location' => 'Casablanca',
                'industry' => 'Industrial',
                'company_size' => 20000,
                'description' => "OCP Group is a global leader in phosphate-based fertilizers, with major operations in Morocco. We invest in innovation, sustainability, and large-scale industrial excellence.",
            ],
            [
                'name' => 'Maroc Telecom',
                'website' => 'https://www.iam.ma',
                'location' => 'Rabat',
                'industry' => 'Telecom',
                'company_size' => 12000,
                'description' => "Maroc Telecom is Morocco’s leading telecom operator. We build reliable connectivity products and digital services for millions of customers.",
            ],
            [
                'name' => 'Attijariwafa Bank',
                'website' => 'https://www.attijariwafabank.com',
                'location' => 'Casablanca',
                'industry' => 'Banking',
                'company_size' => 18000,
                'description' => "Attijariwafa Bank is one of the largest banks in Morocco and Africa. We deliver modern banking products, secure platforms, and high-quality customer experiences.",
            ],
            [
                'name' => 'Inwi',
                'website' => 'https://www.inwi.ma',
                'location' => 'Casablanca',
                'industry' => 'Telecom',
                'company_size' => 3000,
                'description' => "Inwi is a major telecom and digital operator in Morocco. We ship mobile, fiber, and digital solutions with a strong focus on customer experience.",
            ],
            [
                'name' => 'CIH Bank',
                'website' => 'https://www.cihbank.ma',
                'location' => 'Casablanca',
                'industry' => 'Banking',
                'company_size' => 6000,
                'description' => "CIH Bank is a leading Moroccan bank known for digital innovation and customer-centric products. We build secure services and scalable platforms.",
            ],
            [
                'name' => 'HPS',
                'website' => 'https://www.hps-worldwide.com',
                'location' => 'Casablanca',
                'industry' => 'IT Services',
                'company_size' => 1500,
                'description' => "HPS provides payment solutions and services across the globe. Our teams in Morocco work on high-availability systems, security, and large-scale financial products.",
            ],
            [
                'name' => 'SQLI Maroc',
                'website' => 'https://www.sqli.com',
                'location' => 'Rabat',
                'industry' => 'Consulting',
                'company_size' => 900,
                'description' => "SQLI Maroc is a digital services company delivering web, mobile, and enterprise solutions for Moroccan and international clients.",
            ],
            [
                'name' => 'Capgemini Maroc',
                'website' => 'https://www.capgemini.com',
                'location' => 'Casablanca',
                'industry' => 'Consulting',
                'company_size' => 2500,
                'description' => "Capgemini Maroc delivers consulting, technology, and outsourcing services. Teams collaborate in agile environments and ship robust solutions at scale.",
            ],
        ];

        $companies = [];
        foreach ($data as $c) {
            $companies[] = Company::firstOrCreate(
                ['slug' => Str::slug($c['name'])],
                [
                    'name' => $c['name'],
                    'website' => $c['website'],
                    'location' => $c['location'],
                    'industry' => $c['industry'],
                    'company_size' => $c['company_size'],
                    'description' => $c['description'],
                    'logo' => null,
                ]
            );
        }

        return $companies;
    }

    private function seedCompanyUsers(array $companies): void
    {
        $accounts = [
            ['email' => 'hr@ocp.ma', 'name' => 'OCP HR'],
            ['email' => 'recrutement@iam.ma', 'name' => 'Maroc Telecom HR'],
            ['email' => 'talent@attijariwafa.com', 'name' => 'AWB Talent'],
            ['email' => 'rh@inwi.ma', 'name' => 'inwi RH'],
            ['email' => 'talent@cihbank.ma', 'name' => 'CIH Talent'],
            ['email' => 'jobs@hps.ma', 'name' => 'HPS Recruitment'],
            ['email' => 'jobs@sqli.ma', 'name' => 'SQLI Talent'],
            ['email' => 'jobs@capgemini.ma', 'name' => 'Capgemini Talent'],
        ];

        foreach ($companies as $idx => $company) {
            $account = $accounts[$idx] ?? ['email' => 'hr' . ($idx + 1) . '@company.ma', 'name' => $company->name . ' HR'];
            $user = User::firstOrNew(['email' => $account['email']]);

            $user->forceFill([
                'name' => $account['name'],
                'username' => Str::slug(Str::before($account['email'], '@'), ''),
                'password' => Hash::make('password'),
                'role' => 'company',
                'company_id' => $company->id,
                'phone' => fake()->randomElement([
                    '+212 6 12 34 56 78',
                    '+212 6 98 76 54 32',
                    '+212 5 22 33 44 55',
                    '+212 5 37 88 99 00',
                ]),
                'email_verified_at' => now(),
                'email_verification_code' => null,
                'email_verification_expires_at' => null,
                'email_verification_sent_at' => null,
            ])->save();
        }
    }

    /**
     * @return array<int, User>
     */
    private function seedJobSeekers(int $count): array
    {
        $firstNames = ['Youssef', 'Sara', 'Hajar', 'Imane', 'Achraf', 'Hamza', 'Salma', 'Mehdi', 'Oumaima', 'Aya', 'Anas', 'Khadija', 'Rania', 'Nabil', 'Siham'];
        $lastNames = ['El Amrani', 'Bennani', 'Chraibi', 'El Idrissi', 'Alaoui', 'Berrada', 'Lahlou', 'Ouazzani', 'Zerouali', 'Benjelloun', 'Tahiri', 'Skalli', 'Tazi', 'Fassi', 'Mernissi'];

        $cities = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Meknes', 'Fes', 'Agadir', 'Oujda', 'Kenitra', 'Tetouan'];

        $seekers = [];
        for ($i = 0; $i < $count; $i++) {
            $firstName = $firstNames[$i % count($firstNames)];
            $lastName = $lastNames[$i % count($lastNames)];
            $name = $firstName . ' ' . $lastName;
            $email = Str::slug($firstName . '.' . Str::before($lastName, ' '), '') . ($i + 1) . '@gmail.com';

            $user = User::firstOrNew(['email' => $email]);

            $user->forceFill([
                'name' => $name,
                'username' => Str::slug(Str::before($email, '@'), ''),
                'password' => Hash::make('password'),
                'role' => 'job_seeker',
                'company_id' => null,
                'phone' => fake()->randomElement([
                    '+212 6 11 22 33 44',
                    '+212 6 55 66 77 88',
                    '+212 6 99 88 77 66',
                ]),
                'email_verified_at' => now(),
                'email_verification_code' => null,
                'email_verification_expires_at' => null,
                'email_verification_sent_at' => null,
            ])->save();

            $seekers[] = $user;
        }

        // Slightly diversify with a few random seekers using the factory
        $extra = max(0, $count - count($seekers));
        if ($extra > 0) {
            $seekers = array_merge($seekers, User::factory()->count($extra)->create(['role' => 'job_seeker'])->all());
        }

        // Shuffle to avoid deterministic pairing later
        shuffle($seekers);

        return $seekers;
    }

    /**
     * @param array<int, Company> $companies
     * @param array<int, int> $categoryIds
     * @return array<int, Job>
     */
    private function seedJobs(array $companies, array $categoryIds, int $count): array
    {
        $titles = [
            'Full Stack Developer',
            'Laravel Developer',
            'React Developer',
            'IT Support Technician',
            'Data Analyst',
            'Digital Marketing Specialist',
            'Customer Support Agent',
            'Network Administrator',
            'Business Analyst',
            'QA Engineer',
            'DevOps Engineer',
            'Account Manager',
            'HR Specialist',
            'Finance Analyst',
            'Product Owner',
        ];

        $cities = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Meknes', 'Fes', 'Agadir', 'Oujda', 'Kenitra', 'Tetouan'];
        $jobTypes = ['full_time', 'remote', 'part_time'];
        $experienceLevels = ['entry', 'mid', 'senior'];

        $jobs = [];
        for ($i = 0; $i < $count; $i++) {
            /** @var Company $company */
            $company = $companies[array_rand($companies)];
            $title = $titles[$i % count($titles)];
            $location = $cities[array_rand($cities)];
            $jobType = $jobTypes[array_rand($jobTypes)];
            $experience = $experienceLevels[array_rand($experienceLevels)];

            // Use the factory to generate a consistent description and salary range,
            // but override company/category/title/location/type/experience for realism.
            $job = Job::factory()->create([
                'company_id' => $company->id,
                'category_id' => $categoryIds[array_rand($categoryIds)] ?? 1,
                'title' => $title,
                'slug' => Str::slug($title) . '-' . Str::lower(Str::random(4)),
                'location' => $location,
                'job_type' => $jobType,
                'experience_level' => $experience,
                'published_at' => now()->subDays(random_int(0, 20)),
                'expires_at' => now()->addDays(random_int(15, 75)),
                'is_active' => true,
            ]);

            $jobs[] = $job;
        }

        return $jobs;
    }

    /**
     * @param array<int, Job> $jobs
     * @param array<int, User> $jobSeekers
     */
    private function seedApplications(array $jobs, array $jobSeekers, int $count): void
    {
        $pairs = [];
        $attempts = 0;

        while (count($pairs) < $count && $attempts < 500) {
            $attempts++;
            $job = $jobs[array_rand($jobs)];
            $user = $jobSeekers[array_rand($jobSeekers)];
            $key = $job->id . ':' . $user->id;
            $pairs[$key] = [$job, $user];
        }

        foreach ($pairs as [$job, $user]) {
            Application::factory()->create([
                'job_id' => $job->id,
                'user_id' => $user->id,
            ]);
        }
    }
}
