Hello{{ !empty($user?->name) ? ' ' . $user->name : '' }},

Use the verification code below to finish setting up your Jobix account.

Verification code: {{ $code }}

This code expires in {{ $expiration }} minutes.
@if (!empty($verifyUrl))
Open verification page: {{ $verifyUrl }}
@endif
@if (!empty($mobileVerifyUrl) && !empty($webVerifyUrl))
Web fallback: {{ $webVerifyUrl }}
@endif
If you did not create a Jobix account, you can safely ignore this email.

Jobix Team
