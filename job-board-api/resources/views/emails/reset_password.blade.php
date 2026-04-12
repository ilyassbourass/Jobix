<x-emails.layout
  title="Reset your password"
  preheader="Use this secure link to choose a new Jobix password."
>
  <p style="margin:0 0 16px;">Hello{{ !empty($user?->name) ? ' ' . $user->name : '' }},</p>

  <p style="margin:0 0 16px;">
    We received a request to reset the password for your Jobix account.
  </p>

  <p style="margin:24px 0;">
    <a href="{{ $resetUrl }}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700;">
      {{ !empty($mobileResetUrl) ? 'Reset in Jobix app' : 'Reset your password' }}
    </a>
  </p>

  <p style="margin:0 0 12px;">
    This link expires in {{ $expiration }} minutes.
  </p>

  @if (!empty($mobileResetUrl) && !empty($webResetUrl))
    <p style="margin:0 0 12px; color:#475569;">
      Prefer web instead? Use this link:
    </p>
    <p style="margin:0 0 16px; word-break:break-all; color:#2563eb;">
      {{ $webResetUrl }}
    </p>
  @else
    <p style="margin:0 0 16px; color:#475569;">
      If the button does not work, copy and paste this link into your browser:
    </p>

    <p style="margin:0 0 16px; word-break:break-all; color:#2563eb;">
      {{ $resetUrl }}
    </p>
  @endif

  <p style="margin:0 0 16px; color:#475569;">
    If you did not request a password reset, you can safely ignore this email.
  </p>

  <p style="margin:20px 0 0;">Jobix Team</p>
</x-emails.layout>
