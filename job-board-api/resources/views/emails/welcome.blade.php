<x-emails.layout
  title="Welcome to Jobix"
  preheader="Your account has been created successfully."
>
  <p style="margin:0 0 16px;">Hello{{ !empty($user?->name) ? ' ' . $user->name : '' }},</p>

  <p style="margin:0 0 16px;">
    Welcome to Jobix. Your account has been created successfully.
  </p>

  <p style="margin:0 0 16px;">
    Please use the 6-digit verification code from our separate verification email to activate your account.
  </p>

  <p style="margin:0 0 16px; color:#334155;">
    Once your email is verified, you can sign in and complete your profile.
  </p>

  <p style="margin:20px 0 0;">Jobix Team</p>
</x-emails.layout>
