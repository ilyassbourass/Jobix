<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 50);
        $jobs = Job::with(['company.users', 'category'])
            ->active()
            ->search($request->get('search'))
            ->filterCategory($request->get('category_id'))
            ->when($request->get('company_id'), fn ($q) => $q->where('company_id', $request->get('company_id')))
            ->filterLocation($request->get('location'))
            ->when($request->get('job_type'), fn ($q) => $q->where('job_type', $request->get('job_type')))
            ->when($request->get('experience_level'), fn ($q) => $q->where('experience_level', $request->get('experience_level')))
            ->filterWorkMode($request->get('work_mode'))
            ->filterSalary($request->get('salary_min'), $request->get('salary_max'))
            ->latest('published_at')
            ->paginate($perPage);

        return response()->json($jobs);
    }

    public function show(int $id): JsonResponse
    {
        $job = Job::with(['company.users', 'category'])->active()->findOrFail($id);
        return response()->json($job);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'description' => ['required', 'string'],
            'requirements' => ['nullable', 'string'],
            'location' => ['required', 'string', 'max:255'],
            'job_type' => ['required', 'in:full_time,part_time,contract,internship,remote'],
            'work_mode' => ['nullable', 'in:remote,on_site,hybrid'],
            'experience_level' => ['nullable', 'in:entry,mid,senior,lead'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_min'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ]);

        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['message' => 'A company profile is required to manage job postings.'], 403);
        }

        $validated['company_id'] = $company->id;
        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(4);
        $validated['published_at'] = now();

        $job = Job::create($validated);
        $job->load(['company.users', 'category']);

        return response()->json($job, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        if ($job->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'You do not have permission to manage this job posting.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'description' => ['sometimes', 'string'],
            'requirements' => ['nullable', 'string'],
            'location' => ['sometimes', 'string', 'max:255'],
            'job_type' => ['sometimes', 'in:full_time,part_time,contract,internship,remote'],
            'work_mode' => ['nullable', 'in:remote,on_site,hybrid'],
            'experience_level' => ['nullable', 'in:entry,mid,senior,lead'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_min'],
            'is_active' => ['sometimes', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $job->update($validated);
        $job->load(['company.users', 'category']);

        return response()->json($job);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        if ($job->company_id !== $request->user()->company_id) {
            return response()->json(['message' => 'You do not have permission to manage this job posting.'], 403);
        }
        $job->delete();
        return response()->json(['message' => 'Job posting deleted successfully.']);
    }

    public function companyJobs(Request $request): JsonResponse
    {
        $company = $request->user()->company;
        if (!$company) {
            return response()->json(['message' => 'A company profile is required to manage job postings.'], 403);
        }

        $perPage = min((int) $request->get('per_page', 15), 50);
        $jobs = Job::with(['company.users', 'category'])
            ->withCount('applications')
            ->where('company_id', $company->id)
            ->latest()
            ->paginate($perPage);

        return response()->json($jobs);
    }
}
