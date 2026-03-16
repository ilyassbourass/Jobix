<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationSubmittedApplicant extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Application $application)
    {
        $this->application->loadMissing(['job.company', 'user']);
    }

    public function build()
    {
        $jobTitle = $this->application->job?->title ?? 'a job';
        $company = $this->application->job?->company?->name ?? 'the company';
        $applicant = $this->application->user?->name;
        $submittedAt = $this->application->created_at?->format('F j, Y \\a\\t H:i') ?? 'Just now';

        return $this->subject("Application received: {$jobTitle}")
            ->view('emails.application_submitted_applicant_html')
            ->text('emails.application_submitted_applicant')
            ->with([
                'applicantName' => $applicant,
                'jobTitle' => $jobTitle,
                'companyName' => $company,
                'submittedAt' => $submittedAt,
            ]);
    }
}
