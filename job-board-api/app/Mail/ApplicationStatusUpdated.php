<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Application $application)
    {
        $this->application->loadMissing(['job.company', 'user']);
    }

    public function build()
    {
        $jobTitle = $this->application->job?->title ?? 'your job application';
        $company = $this->application->job?->company?->name ?? 'the company';
        $status = $this->application->status ?? 'updated';
        $statusLabel = match ($status) {
            'pending' => 'Pending review',
            'reviewing' => 'In review',
            'interview' => 'Interview stage',
            'accepted' => 'Accepted',
            'rejected' => 'Not selected',
            default => ucfirst((string) $status),
        };
        $statusMessage = match ($status) {
            'pending' => 'Your application has been received and is waiting for review.',
            'reviewing' => 'The company is currently reviewing your application.',
            'interview' => 'The company would like to move forward with your application.',
            'accepted' => 'Congratulations. The company has accepted your application.',
            'rejected' => 'The company has decided not to move forward with your application at this time.',
            default => 'Your application status has been updated.',
        };
        $updatedAt = $this->application->updated_at?->format('F j, Y \\a\\t H:i') ?? 'Just now';

        return $this->subject("Application update: {$jobTitle}")
            ->view('emails.application_status_updated_html')
            ->text('emails.application_status_updated')
            ->with([
                'applicantName' => $this->application->user?->name,
                'jobTitle' => $jobTitle,
                'companyName' => $company,
                'status' => $status,
                'statusLabel' => $statusLabel,
                'statusMessage' => $statusMessage,
                'rejectionReason' => $this->application->rejection_reason,
                'updatedAt' => $updatedAt,
            ]);
    }
}
