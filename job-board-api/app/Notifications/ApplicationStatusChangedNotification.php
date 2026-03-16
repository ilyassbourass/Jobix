<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApplicationStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Application $application
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $jobTitle = $this->application->job?->title ?: 'this role';
        $companyName = $this->application->job?->company?->name ?: 'the hiring team';
        $status = (string) $this->application->status;

        return [
            'type' => 'application_status_changed',
            'title' => $this->titleForStatus($status),
            'message' => $this->messageForStatus($status, $jobTitle, $companyName),
            'action_url' => '/jobs/' . $this->application->job_id,
            'application_id' => $this->application->id,
            'job_id' => $this->application->job_id,
            'job_title' => $jobTitle,
            'company_name' => $companyName,
            'status' => $status,
            'rejection_reason' => $this->application->rejection_reason,
        ];
    }

    private function titleForStatus(string $status): string
    {
        return match ($status) {
            'reviewing' => 'Application under review',
            'interview' => 'Interview stage reached',
            'accepted' => 'Application accepted',
            'rejected' => 'Application rejected',
            default => 'Application updated',
        };
    }

    private function messageForStatus(string $status, string $jobTitle, string $companyName): string
    {
        $reasonSuffix = $status === 'rejected' && $this->application->rejection_reason
            ? ' Reason: ' . $this->application->rejection_reason
            : '';

        return match ($status) {
            'reviewing' => "{$companyName} is now reviewing your application for {$jobTitle}.",
            'interview' => "{$companyName} moved your {$jobTitle} application to the interview stage.",
            'accepted' => "Great news. {$companyName} accepted your application for {$jobTitle}.",
            'rejected' => "Unfortunately, {$companyName} rejected your application for {$jobTitle}.{$reasonSuffix}",
            default => "{$companyName} updated your application for {$jobTitle}.{$reasonSuffix}",
        };
    }
}
