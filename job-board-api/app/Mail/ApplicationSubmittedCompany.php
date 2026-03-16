<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationSubmittedCompany extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Application $application)
    {
        $this->application->loadMissing(['user', 'job.company']);
    }

    public function build()
    {
        $jobTitle = $this->application->job?->title ?? 'a job';
        $applicant = $this->application->user?->name ?? 'An applicant';
        $submittedAt = $this->application->created_at?->format('F j, Y \\a\\t H:i') ?? 'Just now';

        return $this->subject("New application: {$jobTitle}")
            ->view('emails.application_submitted_company_html')
            ->text('emails.application_submitted_company')
            ->with([
                'jobTitle' => $jobTitle,
                'applicantName' => $applicant,
                'applicantEmail' => $this->application->user?->email,
                'submittedAt' => $submittedAt,
            ]);
    }
}
