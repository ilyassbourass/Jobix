<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build()
    {
        return $this->subject('Welcome to Jobix')
            ->view('emails.welcome', [
                'user' => $this->user,
            ])
            ->text('emails.welcome_text', [
                'user' => $this->user,
            ]);
    }
}
