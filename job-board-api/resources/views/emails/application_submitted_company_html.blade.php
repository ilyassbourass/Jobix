<x-emails.layout
  title="New application received"
  preheader="A candidate has applied to one of your Jobix job postings."
>
  <p style="margin:0 0 16px;">
    A candidate has submitted a new application on Jobix.
  </p>

  <div style="margin:20px 0; border:1px solid #e2e8f0; background:#f8fafc; border-radius:14px; padding:18px 20px;">
    <p style="margin:0 0 8px;"><strong>Role:</strong> {{ $jobTitle }}</p>
    <p style="margin:0 0 8px;"><strong>Applicant:</strong> {{ $applicantName }}</p>
    @if(!empty($applicantEmail))
      <p style="margin:0 0 8px;"><strong>Email:</strong> {{ $applicantEmail }}</p>
    @endif
    <p style="margin:0;"><strong>Submitted:</strong> {{ $submittedAt }}</p>
  </div>

  <p style="margin:0 0 16px; color:#334155;">
    Review the candidate from your Jobix company dashboard when you are ready.
  </p>

  <p style="margin:20px 0 0;">Jobix Team</p>
</x-emails.layout>
