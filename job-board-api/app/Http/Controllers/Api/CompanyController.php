<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    public function show(string $companyKey): JsonResponse
    {
        $company = Company::with('users')
            ->when(
                ctype_digit($companyKey),
                fn ($query) => $query->where('id', (int) $companyKey),
                fn ($query) => $query->where('slug', $companyKey)
            )
            ->firstOrFail();

        $jobs = Job::with(['company.users', 'category'])
            ->active()
            ->where('company_id', $company->id)
            ->latest('published_at')
            ->get();

        return response()->json([
            'company' => $company,
            'jobs' => $jobs,
        ]);
    }

    public function logo(int $id)
    {
        $company = Company::findOrFail($id);
        if (empty($company->logo) || !Storage::disk('public')->exists($company->logo)) {
            return response()->json(['message' => 'Logo not found.'], 404);
        }

        $path = $company->logo;
        $mime = Storage::disk('public')->mimeType($path) ?? 'application/octet-stream';
        $contents = Storage::disk('public')->get($path);

        return (new Response($contents, 200))
            ->header('Content-Type', $mime)
            ->header('Cache-Control', 'public, max-age=31536000, immutable');
    }
}
