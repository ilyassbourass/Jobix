<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PushTokenController;
use App\Http\Controllers\Api\SavedJobController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [PasswordResetController::class, 'sendResetLink']);
Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/auth/verify-email', [EmailVerificationController::class, 'verify'])
    ->middleware('throttle:6,1')
    ->name('verification.verify');
Route::post('/auth/email/verification-notification', [EmailVerificationController::class, 'send'])
    ->middleware('throttle:6,1')
    ->name('verification.send');
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{id}', [JobController::class, 'show']);
Route::get('/companies/{id}', [CompanyController::class, 'show']);
Route::get('/companies/{id}/logo', [CompanyController::class, 'logo']);
Route::get('/users/{id}/avatar', [UserController::class, 'avatar'])->whereNumber('id');
Route::get('/users/{username}', [UserController::class, 'showPublic']);

// Authenticated
Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/push-tokens', [PushTokenController::class, 'store']);
    Route::delete('/push-tokens', [PushTokenController::class, 'destroy']);
});

Route::middleware(['auth:api', 'verified'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);

    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    // Support multipart/form-data updates (PHP reliably parses multipart on POST)
    Route::post('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/profile/upload-avatar', [UserController::class, 'uploadAvatar']);
    Route::delete('/profile/avatar', [UserController::class, 'deleteAvatar']);
    Route::delete('/user/resume', [UserController::class, 'deleteResume'])->middleware('role:job_seeker');
    Route::get('/users/{username}/resume-access', [UserController::class, 'resumeAccess']);
    Route::get('/users/{username}/resume', [UserController::class, 'downloadResume']);

    // Job seeker / company jobs
    Route::get('/my/jobs', [JobController::class, 'companyJobs'])->middleware('role:company');
    Route::post('/jobs', [JobController::class, 'store'])->middleware('role:company');
    Route::put('/jobs/{id}', [JobController::class, 'update'])->middleware('role:company');
    Route::delete('/jobs/{id}', [JobController::class, 'destroy'])->middleware('role:company');

    // Applications
    Route::post('/applications', [ApplicationController::class, 'store'])->middleware('role:job_seeker');
    Route::get('/my/applications', [ApplicationController::class, 'myApplications'])->middleware('role:job_seeker');
    Route::get('/jobs/{jobId}/applications', [ApplicationController::class, 'jobApplications'])->middleware('role:company');
    Route::put('/applications/{id}/status', [ApplicationController::class, 'updateStatus'])->middleware('role:company');
    Route::get('/applications/{id}/resume', [ApplicationController::class, 'downloadResume']);
    Route::get('/company/recent-applications', [ApplicationController::class, 'recentCompanyApplications'])->middleware('role:company');

    // Saved jobs
    Route::get('/saved-jobs', [SavedJobController::class, 'index'])->middleware('role:job_seeker');
    Route::post('/jobs/{jobId}/save', [SavedJobController::class, 'store'])->middleware('role:job_seeker');
    Route::delete('/jobs/{jobId}/save', [SavedJobController::class, 'destroy'])->middleware('role:job_seeker');
});

// Admin
Route::middleware(['auth:api', 'verified', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/jobs', [AdminController::class, 'jobs']);
    Route::put('/jobs/{id}/toggle-status', [AdminController::class, 'toggleJobStatus']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
});
