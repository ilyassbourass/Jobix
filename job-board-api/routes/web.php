<?php

use App\Models\Application;
use App\Models\Category;
use App\Models\Company;
use App\Models\Job;
use App\Mail\TestEmail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Jobix API',
        'status' => 'running',
        'version' => '1.0',
    ]);
});

Route::match(['GET', 'POST'], '/seed-database/{token}', function (string $token): JsonResponse {
    if (!config('app.database_setup.route_enabled')) {
        abort(404);
    }

    $expectedToken = (string) config('app.database_setup.route_token', '');
    if ($expectedToken === '' || !hash_equals($expectedToken, $token)) {
        abort(404);
    }

    $migrateOutput = '';
    $seedOutput = '';

    try {
        Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = trim(Artisan::output());

        Artisan::call('db:seed', ['--force' => true]);
        $seedOutput = trim(Artisan::output());

        return response()->json([
            'message' => 'Database setup completed successfully.',
            'migrate_output' => $migrateOutput,
            'seed_output' => $seedOutput,
            'stats' => [
                'categories' => Category::count(),
                'companies' => Company::count(),
                'jobs' => Job::count(),
                'users' => User::count(),
                'applications' => Application::count(),
            ],
        ]);
    } catch (\Throwable $exception) {
        report($exception);

        return response()->json([
            'message' => 'Database setup failed.',
            'error' => $exception->getMessage(),
            'migrate_output' => $migrateOutput,
            'seed_output' => $seedOutput,
        ], 500);
    }
});

Route::get('/reset-password/{token}', function (string $token) {
    $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
    $email = request('email');
    $query = $email ? ('?email=' . urlencode((string)$email)) : '';

    return redirect()->away("{$frontendUrl}/reset-password/{$token}{$query}");
})->name('password.reset');

Route::get('/test-email', function () {
    abort_unless(app()->environment('local'), 404);

    Mail::to('ilyassbourass2005@gmail.com')->send(new TestEmail());

    return response()->json(['status' => 'sent']);
});
