<?php

use App\Mail\TestEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/reset-password/{token}', function (string $token) {
    $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
    $email = request('email');
    $query = $email ? ('?email=' . urlencode((string) $email)) : '';

    return redirect()->away("{$frontendUrl}/reset-password/{$token}{$query}");
})->name('password.reset');

Route::get('/test-email', function () {
    Mail::to('ilyassbourass2005@gmail.com')->send(new TestEmail());

    return response()->json(['status' => 'sent']);
});
