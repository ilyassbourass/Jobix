<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JobSeeder extends Seeder
{
    public function run(): void
    {
        $categoryMap = Category::pluck('id', 'slug')->all();
        $templates = $this->jobTemplates();
        $locations = $this->locations();

        $jobs = Job::with('company')->get();
        if ($jobs->isEmpty()) {
            $this->seedJobsFromTemplates($templates, $categoryMap, $locations);
            return;
        }

        foreach ($jobs as $index => $job) {
            $template = $templates[$index % count($templates)];
            $companyName = $job->company?->name ?? 'Jobix';
            $title = $template['title'];
            $location = $template['location'] ?? $locations[$index % count($locations)];
            $experience = $template['level'] ?? ($job->experience_level ?: 'mid');
            $jobType = $template['job_type'] ?? ($job->job_type ?: 'full_time');
            $workMode = $template['work_mode'] ?? ($job->work_mode ?: ($jobType === 'remote' ? 'remote' : 'on_site'));
            $categoryId = $this->resolveCategoryId($template['category'] ?? null, $categoryMap, $job->category_id);
            [$salaryMin, $salaryMax] = $this->salaryRange($experience);

            $description = $this->buildDescription(
                $title,
                $companyName,
                $location,
                $jobType,
                $workMode,
                $experience,
                $template['responsibilities'],
                $template['requirements'],
                $template['benefits']
            );

            $requirements = $this->formatBullets($template['requirements']);

            $job->update([
                'title' => $title,
                'slug' => Str::slug($title) . '-' . Str::lower(Str::random(4)),
                'category_id' => $categoryId,
                'location' => $location,
                'job_type' => $jobType,
                'work_mode' => $workMode,
                'experience_level' => $experience,
                'salary_min' => $salaryMin,
                'salary_max' => $salaryMax,
                'description' => $description,
                'requirements' => $requirements,
            ]);
        }
    }

    private function seedJobsFromTemplates(array $templates, array $categoryMap, array $locations): void
    {
        $companies = Company::all();
        if ($companies->isEmpty()) {
            return;
        }

        $templateIndex = 0;
        foreach ($companies as $company) {
            $template = $templates[$templateIndex % count($templates)];
            $templateIndex++;
            $title = $template['title'];
            $location = $template['location'] ?? $locations[$templateIndex % count($locations)];
            $experience = $template['level'];
            $jobType = $template['job_type'];
            $workMode = $template['work_mode'];
            $categoryId = $this->resolveCategoryId($template['category'], $categoryMap, null);
            [$salaryMin, $salaryMax] = $this->salaryRange($experience);

            Job::create([
                'company_id' => $company->id,
                'category_id' => $categoryId,
                'title' => $title,
                'slug' => Str::slug($title) . '-' . Str::lower(Str::random(4)),
                'description' => $this->buildDescription(
                    $title,
                    $company->name,
                    $location,
                    $jobType,
                    $workMode,
                    $experience,
                    $template['responsibilities'],
                    $template['requirements'],
                    $template['benefits']
                ),
                'requirements' => $this->formatBullets($template['requirements']),
                'location' => $location,
                'job_type' => $jobType,
                'work_mode' => $workMode,
                'experience_level' => $experience,
                'salary_min' => $salaryMin,
                'salary_max' => $salaryMax,
                'is_active' => true,
                'published_at' => now()->subDays(random_int(0, 12)),
                'expires_at' => now()->addDays(random_int(20, 70)),
            ]);
        }
    }

    private function buildDescription(
        string $title,
        string $companyName,
        string $location,
        string $jobType,
        string $workMode,
        string $experience,
        array $responsibilities,
        array $requirements,
        array $benefits
    ): string {
        $levelLabel = $this->experienceLabel($experience);
        $typeLabel = $this->jobTypeLabel($jobType);
        $modeLabel = $this->workModeLabel($workMode);

        $summary = [
            "{$companyName} is hiring a {$levelLabel} {$title} to strengthen our product delivery team in {$location}.",
            "You will partner with product, design, and engineering to deliver features from discovery to release.",
            "This role focuses on building reliable, scalable solutions that improve the candidate and recruiter experience.",
            "You will contribute to planning, estimation, and technical decisions across the development lifecycle.",
            "We value clear communication, ownership, and a customer-first mindset in everything we ship.",
            "The role is {$modeLabel} with a {$typeLabel} schedule and flexibility when possible.",
        ];

        return implode("\n", [
            "{$levelLabel} {$title} - {$typeLabel} - {$location}",
            '',
            implode(' ', $summary),
            '',
            'Responsibilities',
            $this->formatBullets($responsibilities),
            '',
            'Requirements',
            $this->formatBullets($requirements),
            '',
            'Benefits',
            $this->formatBullets($benefits),
        ]);
    }

    private function salaryRange(string $experience): array
    {
        return match ($experience) {
            'entry' => [random_int(300, 420), random_int(450, 500)],
            'mid' => [random_int(520, 700), random_int(750, 900)],
            default => [random_int(900, 1150), random_int(1200, 1500)],
        };
    }

    private function experienceLabel(string $experience): string
    {
        return match ($experience) {
            'entry' => 'Junior',
            'mid' => 'Mid-level',
            'senior' => 'Senior',
            'lead' => 'Lead',
            default => 'Mid-level',
        };
    }

    private function jobTypeLabel(string $jobType): string
    {
        return match ($jobType) {
            'part_time' => 'Part Time',
            'contract' => 'Contract',
            'internship' => 'Internship',
            'remote' => 'Full Time',
            default => 'Full Time',
        };
    }

    private function workModeLabel(string $workMode): string
    {
        return match ($workMode) {
            'remote' => 'remote',
            'hybrid' => 'hybrid',
            default => 'on-site',
        };
    }

    private function resolveCategoryId(?string $categorySlug, array $categoryMap, ?int $fallbackId): int
    {
        if ($categorySlug && isset($categoryMap[$categorySlug])) {
            return $categoryMap[$categorySlug];
        }

        if ($fallbackId) {
            return $fallbackId;
        }

        return $categoryMap[array_key_first($categoryMap)] ?? 1;
    }

    private function formatBullets(array $items): string
    {
        return '- ' . implode("\n- ", $items);
    }

    private function locations(): array
    {
        return [
            'Casablanca',
            'Rabat',
            'Marrakech',
            'Tanger',
            'Agadir',
            'Fes',
            'Kenitra',
            'Tetouan',
            'Meknes',
            'Oujda',
        ];
    }

    private function jobTemplates(): array
    {
        return [
            [
                'title' => 'React Frontend Developer',
                'category' => 'software-development',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'responsibilities' => [
                    'Build reusable UI components and maintain design system consistency.',
                    'Translate product requirements into responsive, accessible interfaces.',
                    'Integrate REST APIs and manage client-side state effectively.',
                    'Improve performance, bundle size, and page load experience.',
                    'Participate in code reviews and front-end best practices.',
                ],
                'requirements' => [
                    '2+ years of React experience with hooks and component patterns.',
                    'Strong HTML, CSS, and modern JavaScript knowledge.',
                    'Experience consuming REST APIs and handling async data.',
                    'Familiarity with testing tools such as Jest or React Testing Library.',
                    'Ability to collaborate with designers and product managers.',
                ],
                'benefits' => [
                    'Performance-based bonus and annual salary review.',
                    'Health insurance and paid time off.',
                    'Learning budget for courses or certifications.',
                ],
            ],
            [
                'title' => 'Laravel Backend Developer',
                'category' => 'software-development',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'on_site',
                'responsibilities' => [
                    'Design and build secure REST APIs with Laravel.',
                    'Optimize database queries and improve system performance.',
                    'Implement background jobs, queues, and scheduled tasks.',
                    'Collaborate with frontend teams to deliver end-to-end features.',
                    'Maintain clean architecture and documentation.',
                ],
                'requirements' => [
                    'Solid Laravel experience including Eloquent and validation.',
                    'Strong SQL skills and familiarity with MySQL optimization.',
                    'Knowledge of authentication, authorization, and API security.',
                    'Experience with Git and CI/CD workflows.',
                    'Ability to debug production issues methodically.',
                ],
                'benefits' => [
                    'Flexible hours with occasional remote days.',
                    'Private health coverage and paid leave.',
                    'Modern tooling and high-impact projects.',
                ],
            ],
            [
                'title' => 'Full Stack Engineer',
                'category' => 'software-development',
                'level' => 'senior',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'responsibilities' => [
                    'Lead delivery of full-stack features from backend to UI.',
                    'Define API contracts and coordinate across teams.',
                    'Review code and mentor mid-level engineers.',
                    'Ensure reliability, observability, and quality standards.',
                    'Drive technical improvements and refactoring initiatives.',
                ],
                'requirements' => [
                    '5+ years of full-stack experience with Laravel and React.',
                    'Strong system design skills and architectural judgment.',
                    'Comfortable owning features from discovery to release.',
                    'Experience with testing, monitoring, and performance tuning.',
                    'Excellent communication and leadership skills.',
                ],
                'benefits' => [
                    'Senior compensation with bonus and equity options.',
                    'Health insurance and wellness stipend.',
                    'Career growth plan with training support.',
                ],
            ],
            [
                'title' => 'UI/UX Designer',
                'category' => 'design',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'responsibilities' => [
                    'Translate product goals into wireframes and high-fidelity designs.',
                    'Design user flows that reduce friction for job seekers and recruiters.',
                    'Collaborate with engineers to ensure feasibility and quality.',
                    'Maintain a consistent visual system and component library.',
                    'Run usability checks and incorporate feedback quickly.',
                ],
                'requirements' => [
                    '3+ years of UI/UX design experience for web products.',
                    'Strong portfolio with case studies and process detail.',
                    'Experience with Figma and design systems.',
                    'Understanding of accessibility and responsive design.',
                    'Ability to communicate design rationale clearly.',
                ],
                'benefits' => [
                    'Creative freedom with clear product direction.',
                    'Design budget for tools and subscriptions.',
                    'Hybrid work with flexible hours.',
                ],
            ],
            [
                'title' => 'DevOps Engineer',
                'category' => 'engineering',
                'level' => 'senior',
                'job_type' => 'full_time',
                'work_mode' => 'remote',
                'responsibilities' => [
                    'Automate CI/CD pipelines and release processes.',
                    'Manage cloud infrastructure and container deployments.',
                    'Monitor systems and improve reliability and uptime.',
                    'Implement security best practices and incident response.',
                    'Partner with developers on performance optimization.',
                ],
                'requirements' => [
                    'Strong experience with Linux, Docker, and cloud platforms.',
                    'Hands-on knowledge of CI/CD tools and infrastructure as code.',
                    'Ability to troubleshoot production issues quickly.',
                    'Experience with monitoring stacks (Prometheus, Grafana).',
                    'Solid scripting skills with Bash or Python.',
                ],
                'benefits' => [
                    'Remote-first setup with home office support.',
                    'Training budget and certification reimbursement.',
                    'Competitive salary with performance bonus.',
                ],
            ],
            [
                'title' => 'Data Analyst',
                'category' => 'data-science',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'on_site',
                'responsibilities' => [
                    'Build dashboards to track funnel and hiring performance.',
                    'Analyze user behavior and provide actionable insights.',
                    'Maintain data quality and documentation.',
                    'Partner with product teams to define metrics.',
                    'Automate recurring reporting workflows.',
                ],
                'requirements' => [
                    'Strong SQL skills and experience with BI tools.',
                    'Ability to translate data into business recommendations.',
                    'Experience cleaning, validating, and modeling datasets.',
                    'Proficiency in Excel and data visualization.',
                    'Comfortable presenting findings to stakeholders.',
                ],
                'benefits' => [
                    'Modern analytics stack and tooling.',
                    'Clear career path and mentorship.',
                    'Health insurance and paid leave.',
                ],
            ],
            [
                'title' => 'QA Engineer',
                'category' => 'engineering',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'responsibilities' => [
                    'Create test plans and execute manual and automated tests.',
                    'Collaborate with engineers to define acceptance criteria.',
                    'Report defects clearly and track them to resolution.',
                    'Improve automation coverage and regression suites.',
                    'Promote quality practices across the team.',
                ],
                'requirements' => [
                    'Experience with QA methodologies and bug tracking tools.',
                    'Basic automation knowledge (Cypress, Selenium, or Playwright).',
                    'Strong attention to detail and communication skills.',
                    'Ability to write clear test cases.',
                    'Comfortable working in agile sprints.',
                ],
                'benefits' => [
                    'QA tooling budget and certification support.',
                    'Hybrid work model with flexibility.',
                    'Performance-based bonus.',
                ],
            ],
            [
                'title' => 'Product Owner',
                'category' => 'product-management',
                'level' => 'senior',
                'job_type' => 'full_time',
                'work_mode' => 'hybrid',
                'responsibilities' => [
                    'Own the roadmap and prioritize backlog items.',
                    'Translate business goals into clear user stories.',
                    'Coordinate releases with engineering and design teams.',
                    'Analyze product metrics to guide decisions.',
                    'Communicate progress to stakeholders.',
                ],
                'requirements' => [
                    '5+ years in product management or product ownership.',
                    'Strong understanding of agile methodologies.',
                    'Experience defining KPIs and product metrics.',
                    'Excellent communication and stakeholder management.',
                    'Ability to balance user needs and business goals.',
                ],
                'benefits' => [
                    'Strategic role with high impact on product direction.',
                    'Leadership development budget.',
                    'Hybrid work with flexible hours.',
                ],
            ],
            [
                'title' => 'Digital Marketing Specialist',
                'category' => 'marketing',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'on_site',
                'responsibilities' => [
                    'Plan and execute paid campaigns across Meta and Google.',
                    'Optimize landing pages and conversion funnels.',
                    'Manage content calendars and channel performance.',
                    'Track KPI performance and report weekly insights.',
                    'Coordinate with design for ad creatives.',
                ],
                'requirements' => [
                    '2+ years in performance marketing or growth.',
                    'Hands-on experience with Google Ads and Meta Ads.',
                    'Strong analytical skills and reporting ability.',
                    'Knowledge of SEO and email marketing basics.',
                    'Ability to work with designers and copywriters.',
                ],
                'benefits' => [
                    'Marketing budget and experimentation freedom.',
                    'Paid certifications and training support.',
                    'Bonus tied to campaign performance.',
                ],
            ],
            [
                'title' => 'Customer Support Specialist',
                'category' => 'customer-support',
                'level' => 'entry',
                'job_type' => 'full_time',
                'work_mode' => 'on_site',
                'responsibilities' => [
                    'Respond to customer tickets and resolve issues promptly.',
                    'Document common issues and update help articles.',
                    'Escalate complex problems to engineering teams.',
                    'Track customer satisfaction metrics.',
                    'Provide product feedback to internal teams.',
                ],
                'requirements' => [
                    'Excellent written communication skills.',
                    'Empathy and patience when handling customer issues.',
                    'Basic understanding of SaaS products.',
                    'Ability to manage multiple tickets efficiently.',
                    'Comfortable working in shifts when needed.',
                ],
                'benefits' => [
                    'Structured onboarding and mentorship.',
                    'Performance-based bonus.',
                    'Health insurance and paid leave.',
                ],
            ],
            [
                'title' => 'Business Analyst',
                'category' => 'finance',
                'level' => 'mid',
                'job_type' => 'full_time',
                'work_mode' => 'on_site',
                'responsibilities' => [
                    'Gather requirements and map business processes.',
                    'Translate stakeholder needs into clear specifications.',
                    'Analyze performance data and identify opportunities.',
                    'Support project planning and risk assessment.',
                    'Facilitate workshops and alignment sessions.',
                ],
                'requirements' => [
                    '3+ years of business analysis experience.',
                    'Strong documentation and process mapping skills.',
                    'Comfortable with data analysis and reporting.',
                    'Ability to manage multiple stakeholders.',
                    'Clear communication and presentation skills.',
                ],
                'benefits' => [
                    'Stable team with growth opportunities.',
                    'Training support and certifications.',
                    'Competitive salary and bonus.',
                ],
            ],
            [
                'title' => 'Mobile App Developer',
                'category' => 'software-development',
                'level' => 'mid',
                'job_type' => 'contract',
                'work_mode' => 'remote',
                'responsibilities' => [
                    'Build and maintain mobile features for candidate workflows.',
                    'Integrate APIs and manage offline-first scenarios.',
                    'Collaborate with designers to ensure UI consistency.',
                    'Deliver high-quality releases with testing and QA.',
                    'Optimize performance across Android and iOS devices.',
                ],
                'requirements' => [
                    '2+ years of mobile development experience (React Native or Flutter).',
                    'Experience integrating REST APIs and authentication.',
                    'Knowledge of mobile performance optimization.',
                    'Comfortable with CI/CD for mobile releases.',
                    'Strong debugging and troubleshooting skills.',
                ],
                'benefits' => [
                    'Remote contract with flexible schedule.',
                    'Opportunity to extend to full-time.',
                    'Work with a senior mobile team.',
                ],
            ],
        ];
    }
}
