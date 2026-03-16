Hello{{ !empty($applicantName) ? ' ' . $applicantName : '' }},

There is an update to your application on Jobix.

Role: {{ $jobTitle }}
Company: {{ $companyName }}
Status: {{ $statusLabel }}
Updated: {{ $updatedAt }}

{{ $statusMessage }}

@if(!empty($rejectionReason))
Company note: {{ $rejectionReason }}
@endif

Jobix Team
