<x-emails.layout
  title="Application update"
  preheader="Your Jobix application status has changed."
>
  <p style="margin:0 0 16px;">Hello{{ !empty($applicantName) ? ' ' . $applicantName : '' }},</p>

  <p style="margin:0 0 16px;">
    There is an update to your application on Jobix.
  </p>

  <div style="margin:20px 0; border:1px solid #e2e8f0; background:#f8fafc; border-radius:14px; padding:18px 20px;">
    <p style="margin:0 0 8px;"><strong>Role:</strong> {{ $jobTitle }}</p>
    <p style="margin:0 0 8px;"><strong>Company:</strong> {{ $companyName }}</p>
    <p style="margin:0 0 8px;"><strong>Status:</strong> {{ $statusLabel }}</p>
    <p style="margin:0;"><strong>Updated:</strong> {{ $updatedAt }}</p>
  </div>

  <p style="margin:0 0 16px; color:#334155;">
    {{ $statusMessage }}
  </p>

  @if(!empty($rejectionReason))
    <div style="margin:20px 0; border:1px solid #fecaca; background:#fef2f2; border-radius:14px; padding:18px 20px;">
      <p style="margin:0 0 8px; font-weight:700; color:#991b1b;">Company note</p>
      <p style="margin:0; color:#7f1d1d;">{{ $rejectionReason }}</p>
    </div>
  @endif

  <p style="margin:20px 0 0;">Jobix Team</p>
</x-emails.layout>
