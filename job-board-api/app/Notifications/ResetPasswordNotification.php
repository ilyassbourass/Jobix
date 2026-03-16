<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $resetUrl = $frontendUrl . '/reset-password/' . $this->token . '?email=' . urlencode($notifiable->getEmailForPasswordReset());

        $expiration = (int) config('auth.passwords.users.expire', 60);

        return (new MailMessage())
            ->subject('Reset your Jobix password')
            ->view('emails.reset_password', [
                'user' => $notifiable,
                'resetUrl' => $resetUrl,
                'expiration' => $expiration,
            ])
            ->text('emails.reset_password_text', [
                'user' => $notifiable,
                'resetUrl' => $resetUrl,
                'expiration' => $expiration,
            ]);
    }
}
