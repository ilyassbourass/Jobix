<x-emails.layout
  title="Verify your email address"
  preheader="Use this code to activate your Jobix account."
>
  <p style="margin:0 0 16px;">Hello{{ !empty($user?->name) ? ' ' . $user->name : '' }},</p>

  <p style="margin:0 0 16px;">
    Use the verification code below to finish setting up your Jobix account.
  </p>

  <div style="margin:24px 0; border:1px solid #dbeafe; background:#eff6ff; border-radius:16px; padding:20px; text-align:center;">
    <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#2563eb;">
      Verification code
    </p>
    <p style="margin:0; font-size:32px; font-weight:700; letter-spacing:8px; color:#0f172a;">
      {{ $code }}
    </p>
  </div>

  <p style="margin:0 0 12px;">
    This code will expire in {{ $expiration }} minutes.
  </p>
  @if (!empty($verifyUrl))
    <p style="margin:24px 0;">
      <a href="{{ $verifyUrl }}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700;">
        {{ !empty($mobileVerifyUrl) ? 'Open in Jobix app' : 'Open verification page' }}
      </a>
    </p>
  @endif
  @if (!empty($mobileVerifyUrl) && !empty($webVerifyUrl))
    <p style="margin:0 0 12px; color:#475569;">
      Prefer web instead? Use this link:
    </p>
    <p style="margin:0 0 16px; word-break:break-all; color:#2563eb;">
      {{ $webVerifyUrl }}
    </p>
  @elseif (!empty($verifyUrl))
    <p style="margin:0 0 12px; color:#475569;">
      If the button does not work, copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 16px; word-break:break-all; color:#2563eb;">
      {{ $verifyUrl }}
    </p>
  @endif
  <p style="margin:0 0 16px; color:#475569;">
    If you did not create a Jobix account, you can safely ignore this email.
  </p>

  <p style="margin:20px 0 0;">Jobix Team</p>
</x-emails.layout>
