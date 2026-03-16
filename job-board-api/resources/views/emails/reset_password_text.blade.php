Hello{{ !empty($user?->name) ? ' ' . $user->name : '' }},

We received a request to reset the password for your Jobix account.

Reset your password: {{ $resetUrl }}

This link expires in {{ $expiration }} minutes.
If you did not request a password reset, you can ignore this email.

Jobix Team
