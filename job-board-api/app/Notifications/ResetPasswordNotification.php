<?php

namespace App\Notifications;

use App\Support\AuthLink;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $email = $notifiable->getEmailForPasswordReset();
        $mobileResetUrl = AuthLink::mobile('reset-password/' . $this->token, [
            'email' => $email,
        ]);
        $webResetUrl = AuthLink::frontend('reset-password/' . $this->token, [
            'email' => $email,
        ]);
        $resetUrl = $mobileResetUrl ?: $webResetUrl;

        $expiration = (int) config('auth.passwords.users.expire', 60);

        return (new MailMessage())
            ->subject('Reset your Jobix password')
            ->view('emails.reset_password', [
                'user' => $notifiable,
                'resetUrl' => $resetUrl,
                'mobileResetUrl' => $mobileResetUrl,
                'webResetUrl' => $webResetUrl,
                'expiration' => $expiration,
            ])
            ->text('emails.reset_password_text', [
                'user' => $notifiable,
                'resetUrl' => $resetUrl,
                'mobileResetUrl' => $mobileResetUrl,
                'webResetUrl' => $webResetUrl,
                'expiration' => $expiration,
            ]);
    }
}
