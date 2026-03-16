@props([
    'title',
    'preheader' => null,
    'eyebrow' => 'Jobix',
    'footer' => 'This is a transactional email from Jobix about your account or application activity.',
])

<!doctype html>
<html lang="en">
  <body style="margin:0; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a; line-height:1.6;">
    @if($preheader)
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
        {{ $preheader }}
      </div>
    @endif

    <div style="padding:24px 12px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden;">
        <div style="padding:22px 28px; background:#0f172a;">
          <p style="margin:0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#93c5fd;">
            {{ $eyebrow }}
          </p>
          <h1 style="margin:10px 0 0; font-size:24px; line-height:1.3; color:#ffffff;">
            {{ $title }}
          </h1>
        </div>

        <div style="padding:28px;">
          {{ $slot }}

          <div style="margin-top:28px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b;">
            {{ $footer }}
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
