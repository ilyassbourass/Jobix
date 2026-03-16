<x-emails.layout
  title="Application received"
  preheader="Your Jobix application has been recorded successfully."
>
  <p style="margin:0 0 16px;">Hello{{ !empty($applicantName) ? ' ' . $applicantName : '' }},</p>

  <p style="margin:0 0 16px;">
    We have successfully recorded your application on Jobix.
  </p>

  <div style="margin:20px 0; border:1px solid #e2e8f0; background:#f8fafc; border-radius:14px; padding:18px 20px;">
    <p style="margin:0 0 8px;"><strong>Role:</strong> {{ $jobTitle }}</p>
    <p style="margin:0 0 8px;"><strong>Company:</strong> {{ $companyName }}</p>
    <p style="margin:0;"><strong>Submitted:</strong> {{ $submittedAt }}</p>
  </div>

  <p style="margin:0 0 16px; color:#334155;">
    No further action is needed right now. We will notify you if the company updates your application status.
  </p>

  <p style="margin:20px 0 0;">Jobix Team</p>
</x-emails.layout>
