<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $companies = DB::table('companies')
            ->select('id', 'name')
            ->orderBy('id')
            ->get();

        if ($companies->isEmpty()) {
            return;
        }

        foreach ($companies as $company) {
            DB::table('companies')
                ->where('id', $company->id)
                ->update(['slug' => '__tmp_company_' . $company->id]);
        }

        $usedSlugs = [];

        foreach ($companies as $company) {
            $base = Str::slug((string) $company->name, '-');
            $base = $base !== '' ? $base : 'company';
            $slug = $base;
            $suffix = 2;

            while (in_array($slug, $usedSlugs, true)) {
                $slug = $base . '-' . $suffix;
                $suffix++;
            }

            DB::table('companies')
                ->where('id', $company->id)
                ->update(['slug' => $slug]);

            $usedSlugs[] = $slug;
        }
    }

    public function down(): void
    {
        // Intentionally left blank: previous random slugs cannot be reconstructed safely.
    }
};
