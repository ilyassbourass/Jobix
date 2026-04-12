<?php

namespace App\Notifications;

use App\Models\Application;
use App\Notifications\Channels\ExpoPushChannel;
use App\Support\AuthLink;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CompanyApplicationReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Application $application
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        $applicantName = $this->application->user?->name ?: 'A candidate';
        $jobTitle = $this->application->job?->title ?: 'your job posting';

        return [
            'type' => 'application_received',
            'title' => 'New application received',
            'message' => "{$applicantName} applied to {$jobTitle}.",
            'action_url' => '/company',
            'application_id' => $this->application->id,
            'job_id' => $this->application->job_id,
            'job_title' => $jobTitle,
            'applicant_name' => $applicantName,
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        $data = $this->toArray($notifiable);

        return [
            'title' => $data['title'],
            'body' => $data['message'],
            'sound' => 'default',
            'channelId' => 'default',
            'data' => [
                'type' => $data['type'],
                'job_id' => $data['job_id'],
                'application_id' => $data['application_id'],
                'action_url' => $data['action_url'],
                'url' => AuthLink::mobile('jobs/' . $this->application->job_id)
                    ?? AuthLink::frontend('/company'),
            ],
        ];
    }
}
