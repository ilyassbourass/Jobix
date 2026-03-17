<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use App\Models\User;
use App\Support\Uploads;
use App\Notifications\ApplicationStatusChangedNotification;
use App\Notifications\CompanyApplicationReceivedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if ($request->user()?->role !== 'job_seeker') {
            return response()->json(['message' => 'Only job seekers can apply to jobs.'], 403);
        }

        $validated = $request->validate([
            'job_id' => ['required', 'exists:jobs,id'],
            'cover_letter' => ['nullable', 'string', 'max:2000'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
        ]);

        $job = Job::active()->findOrFail($validated['job_id']);
        $user = $request->user();

        if (Application::where('job_id', $job->id)->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'You have already applied to this job.'], 422);
        }

        $resumePath = null;
        if ($request->hasFile('resume')) {
            $resumePath = Uploads::disk()->putFile('resumes', $request->file('resume'));
        } elseif (!empty($user->resume_path) && Uploads::disk()->exists($user->resume_path)) {
            $extension = pathinfo((string) $user->resume_path, PATHINFO_EXTENSION);
            $filename = 'resume-' . $user->id . '-' . Str::random(12) . ($extension ? '.' . $extension : '');
            $resumePath = 'application-resumes/' . $user->id . '/' . $filename;
            Uploads::disk()->copy($user->resume_path, $resumePath);
        }

        $application = Application::create([
            'job_id' => $job->id,
            'user_id' => $user->id,
            'cover_letter' => $validated['cover_letter'] ?? null,
            'resume_path' => $resumePath,
        ]);

        $application->load(['job.company', 'job.category', 'user']);

        try {
            $companyUsers = User::where('company_id', $job->company_id)
                ->where('role', 'company')
                ->get();

            if ($companyUsers->isNotEmpty()) {
                Notification::send($companyUsers, new CompanyApplicationReceivedNotification($application));
            }
        } catch (\Throwable $e) {
            // Non-blocking: application still succeeds if in-app notifications fail.
        }

        // Email notifications
        try {
            $companyEmails = User::where('company_id', $job->company_id)
                ->where('role', 'company')
                ->pluck('email')
                ->filter()
                ->values()
                ->all();

            if (!empty($companyEmails)) {
                Mail::to($companyEmails)->send(new \App\Mail\ApplicationSubmittedCompany($application));
            }
            Mail::to($user->email)->send(new \App\Mail\ApplicationSubmittedApplicant($application));
        } catch (\Throwable $e) {
            // Non-blocking: application still succeeds even if mail fails.
        }

        return response()->json($application, 201);
    }

    public function myApplications(Request $request): JsonResponse
    {
        if ($request->user()?->role !== 'job_seeker') {
            return response()->json(['message' => 'Only job seekers can view their applications.'], 403);
        }

        $perPage = min((int) $request->get('per_page', 15), 50);
        $applications = Application::with(['job.company', 'job.category'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate($perPage);

        return response()->json($applications);
    }

    public function jobApplications(Request $request, int $jobId): JsonResponse
    {
        $job = Job::findOrFail($jobId);
        if ($job->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'You do not have permission to review applications for this job.'], 403);
        }

        $applications = Application::with(['user', 'job'])
            ->where('job_id', $jobId)
            ->latest()
            ->get();

        return response()->json($applications);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $application = Application::with('job')->findOrFail($id);
        if ($application->job->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'You do not have permission to update this application.'], 403);
        }

        $hasCompanyNotesColumn = Schema::hasColumn('applications', 'company_notes');

        $rules = [
            'status' => ['required', 'in:pending,reviewing,interview,accepted,rejected'],
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ];

        if ($hasCompanyNotesColumn) {
            $rules['company_notes'] = ['nullable', 'string', 'max:2000'];
        }

        $validated = $request->validate($rules);
        $statusChanged = $application->status !== $validated['status'];

        $attributes = [
            'status' => $validated['status'],
            'rejection_reason' => $validated['status'] === 'rejected'
                ? ($validated['rejection_reason'] ?? null)
                : null,
        ];

        if ($hasCompanyNotesColumn) {
            $attributes['company_notes'] = $request->exists('company_notes')
                ? ($validated['company_notes'] ?? null)
                : $application->company_notes;
        }

        $application->update($attributes);

        $application->load(['user', 'job.company']);

        if ($statusChanged) {
            try {
                $application->user->notify(new ApplicationStatusChangedNotification($application));
            } catch (\Throwable $e) {
                // Non-blocking
            }
        }

        if ($statusChanged) {
            try {
                Mail::to($application->user->email)->send(new \App\Mail\ApplicationStatusUpdated($application));
            } catch (\Throwable $e) {
                // Non-blocking
            }
        }

        return response()->json($application);
    }

    public function downloadResume(Request $request, int $id)
    {
        $application = Application::with(['job', 'user'])->findOrFail($id);

        $user = $request->user();
        $isOwner = $user->id === $application->user_id;
        $isAdmin = $user->role === 'admin';
        $isCompanyOwner = $user->role === 'company' && $application->job->company_id === $user->company_id;

        if (!$isOwner && !$isAdmin && !$isCompanyOwner) {
            return response()->json(['message' => 'You do not have permission to download this resume.'], 403);
        }

        if (empty($application->resume_path) || !Uploads::disk()->exists($application->resume_path)) {
            return response()->json(['message' => 'Resume not found.'], 404);
        }

        return Uploads::disk()->download($application->resume_path);
    }

    public function recentCompanyApplications(Request $request): JsonResponse
    {
        if ($request->user()?->role !== 'company') {
            return response()->json(['message' => 'Only company accounts can view recent applications.'], 403);
        }

        $companyId = $request->user()->company_id;
        $apps = Application::with(['user', 'job.category'])
            ->whereHas('job', fn ($q) => $q->where('company_id', $companyId))
            ->latest()
            ->take(10)
            ->get();

        return response()->json($apps);
    }
}
