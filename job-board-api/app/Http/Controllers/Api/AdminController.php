<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $range = (int) $request->get('range', 30);
        $range = in_array($range, [7, 30, 365, 180], true) ? $range : 30;

        $now = Carbon::now();

        if ($range === 365) {
            // Monthly buckets for last 12 months
            $months = collect(range(0, 11))
                ->map(fn ($i) => $now->copy()->startOfMonth()->subMonths($i))
                ->reverse()
                ->values();

            $keys = $months->map(fn ($d) => $d->format('Y-m'))->values();
            $labels = $months->map(fn ($d) => $d->format('M Y'))->values();
            $since = $months->first()->copy()->startOfMonth();

            $usersAgg = User::query()
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as k, COUNT(*) as c")
                ->where('created_at', '>=', $since)
                ->groupBy('k')
                ->pluck('c', 'k');

            $jobsAgg = Job::query()
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as k, COUNT(*) as c")
                ->where('created_at', '>=', $since)
                ->groupBy('k')
                ->pluck('c', 'k');

            $appsAgg = Application::query()
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as k, COUNT(*) as c")
                ->where('created_at', '>=', $since)
                ->groupBy('k')
                ->pluck('c', 'k');

            $series = $keys->map(function ($k, $idx) use ($labels, $usersAgg, $jobsAgg, $appsAgg) {
                return [
                    'month' => $labels[$idx],
                    'users' => (int) ($usersAgg[$k] ?? 0),
                    'jobs' => (int) ($jobsAgg[$k] ?? 0),
                    'applications' => (int) ($appsAgg[$k] ?? 0),
                ];
            });
        } else {
            // Daily buckets for last N days
            $days = collect(range(0, $range - 1))
                ->map(fn ($i) => $now->copy()->startOfDay()->subDays($i))
                ->reverse()
                ->values();

            $keys = $days->map(fn ($d) => $d->format('Y-m-d'))->values();
            $labels = $days->map(fn ($d) => $d->format('M j'))->values();
            $since = $days->first()->copy()->startOfDay();

            $usersAgg = User::query()
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m-%d') as k, COUNT(*) as c")
                ->where('created_at', '>=', $since)
                ->groupBy('k')
                ->pluck('c', 'k');

            $jobsAgg = Job::query()
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m-%d') as k, COUNT(*) as c")
                ->where('created_at', '>=', $since)
                ->groupBy('k')
                ->pluck('c', 'k');

            $appsAgg = Application::query()
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m-%d') as k, COUNT(*) as c")
                ->where('created_at', '>=', $since)
                ->groupBy('k')
                ->pluck('c', 'k');

            $series = $keys->map(function ($k, $idx) use ($labels, $usersAgg, $jobsAgg, $appsAgg) {
                return [
                    // keep key name `month` for backwards compatibility with frontend charts
                    'month' => $labels[$idx],
                    'users' => (int) ($usersAgg[$k] ?? 0),
                    'jobs' => (int) ($jobsAgg[$k] ?? 0),
                    'applications' => (int) ($appsAgg[$k] ?? 0),
                ];
            });
        }

        $stats = [
            'users_count' => User::count(),
            'companies_count' => User::where('role', 'company')->whereNotNull('company_id')->count(),
            'jobs_count' => Job::count(),
            'active_jobs_count' => Job::active()->count(),
            'applications_count' => Application::count(),
            'timeseries' => $series,
            'range' => $range,
        ];
        return response()->json($stats);
    }

    public function users(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 50);
        $users = User::with('company')
            ->when($request->get('role'), fn ($q) => $q->where('role', $request->get('role')))
            ->when($request->get('search'), fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->get('search') . '%')
                    ->orWhere('email', 'like', '%' . $request->get('search') . '%');
            }))
            ->latest()
            ->paginate($perPage);

        return response()->json($users);
    }

    public function jobs(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 50);
        $isActive = $request->get('is_active');
        $isActive = $isActive !== null
            ? filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : null;

        $jobs = Job::with(['company', 'category'])
            ->withCount('applications')
            ->when($request->get('search'), function ($q, $search) {
                $term = '%' . $search . '%';
                $q->where(function ($query) use ($term) {
                    $query->where('title', 'like', $term)
                        ->orWhereHas('company', fn ($company) => $company->where('name', 'like', $term));
                });
            })
            ->when($isActive !== null, fn ($q) => $q->where('is_active', $isActive))
            ->latest()
            ->paginate($perPage);

        return response()->json($jobs);
    }

    public function toggleJobStatus(int $id): JsonResponse
    {
        $job = Job::findOrFail($id);
        $job->update(['is_active' => !$job->is_active]);
        $job->load(['company', 'category']);
        return response()->json($job);
    }

    public function deleteUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Administrator accounts cannot be deleted.'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted successfully.']);
    }
}
