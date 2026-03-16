<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedJobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 50);
        $user = $request->user();

        $jobs = $user->savedJobs()
            ->with(['company.users', 'category'])
            ->latest('saved_jobs.created_at')
            ->paginate($perPage);

        return response()->json($jobs);
    }

    public function store(Request $request, int $jobId): JsonResponse
    {
        $job = Job::active()->findOrFail($jobId);
        $request->user()->savedJobs()->syncWithoutDetaching([$job->id]);
        return response()->json(['message' => 'Job saved.'], 201);
    }

    public function destroy(Request $request, int $jobId): JsonResponse
    {
        $request->user()->savedJobs()->detach([$jobId]);
        return response()->json(['message' => 'Job removed from saved.']);
    }
}

