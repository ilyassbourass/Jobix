<?php

namespace App\Notifications;

use App\Support\AuthLink;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    public function __construct(private string $code)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $expiration = (int) config('auth.verification.expire', 10);
        $mobileVerifyUrl = AuthLink::mobile('verify-email', [
            'email' => $notifiable->email,
            'code' => $this->code,
        ]);
        $webVerifyUrl = AuthLink::frontend('verify-email', [
            'email' => $notifiable->email,
            'code' => $this->code,
        ]);
        $verifyUrl = $mobileVerifyUrl ?: $webVerifyUrl;

        return (new MailMessage())
            ->subject('Your Jobix verification code')
            ->view('emails.verify_email', [
                'user' => $notifiable,
                'code' => $this->code,
                'verifyUrl' => $verifyUrl,
                'mobileVerifyUrl' => $mobileVerifyUrl,
                'webVerifyUrl' => $webVerifyUrl,
                'expiration' => $expiration,
            ])
            ->text('emails.verify_email_text', [
                'user' => $notifiable,
                'code' => $this->code,
                'verifyUrl' => $verifyUrl,
                'mobileVerifyUrl' => $mobileVerifyUrl,
                'webVerifyUrl' => $webVerifyUrl,
                'expiration' => $expiration,
            ]);
    }
}
