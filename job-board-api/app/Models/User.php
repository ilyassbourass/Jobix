<?php

namespace App\Models;

use App\Support\Uploads;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'company_id',
        'phone',
        'avatar',
        'bio',
        'headline',
        'seniority',
        'availability',
        'preferred_work_mode',
        'experience',
        'projects',
        'skills_with_level',
        'skills',
        'location',
        'resume_path',
        'linkedin_url',
        'github_url',
        'portfolio_url',
    ];

    protected $appends = ['avatar_url', 'has_resume', 'resume_filename'];

    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_code',
        'email_verification_expires_at',
        'email_verification_sent_at',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'email_verification_expires_at' => 'datetime',
        'email_verification_sent_at' => 'datetime',
    ];

    public function getAvatarUrlAttribute(): ?string
    {
        if (empty($this->avatar)) {
            return null;
        }
        return url('api/users/' . $this->id . '/avatar?v=' . rawurlencode((string) $this->avatar));
    }

    public function getHasResumeAttribute(): bool
    {
        if (empty($this->resume_path)) {
            return false;
        }

        return Uploads::disk()->exists($this->resume_path);
    }

    public function getResumeFilenameAttribute(): ?string
    {
        if (!$this->has_resume) {
            return null;
        }

        $extension = pathinfo((string) $this->resume_path, PATHINFO_EXTENSION);
        $baseName = $this->username ?: Str::slug((string) $this->name);
        $baseName = trim((string) $baseName, '-');
        $baseName = $baseName !== '' ? $baseName : 'resume';

        return $extension
            ? "{$baseName}-resume.{$extension}"
            : "{$baseName}-resume";
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
            'email' => $this->email,
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $code = $this->generateEmailVerificationCode();
        $this->notify(new VerifyEmailNotification($code));
    }

    public function generateEmailVerificationCode(): string
    {
        $existingCode = $this->currentEmailVerificationCode();

        if ($existingCode !== null) {
            $this->forceFill([
                'email_verification_sent_at' => now(),
            ])->save();

            return $existingCode;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes((int) config('auth.verification.expire', 10));

        $this->forceFill([
            'email_verification_code' => Crypt::encryptString($code),
            'email_verification_expires_at' => $expiresAt,
            'email_verification_sent_at' => now(),
        ])->save();

        return $code;
    }

    public function currentEmailVerificationCode(): ?string
    {
        if (
            empty($this->email_verification_code)
            || !$this->email_verification_expires_at
            || now()->greaterThan($this->email_verification_expires_at)
        ) {
            return null;
        }

        try {
            return Crypt::decryptString($this->email_verification_code);
        } catch (DecryptException) {
            return null;
        }
    }

    public function hasMatchingEmailVerificationCode(string $code): bool
    {
        if (empty($this->email_verification_code)) {
            return false;
        }

        try {
            return hash_equals($code, Crypt::decryptString($this->email_verification_code));
        } catch (DecryptException) {
            return Hash::check($code, $this->email_verification_code);
        }
    }

    public function clearEmailVerificationCode(): void
    {
        $this->forceFill([
            'email_verification_code' => null,
            'email_verification_expires_at' => null,
            'email_verification_sent_at' => null,
        ])->save();
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function savedJobs()
    {
        return $this->belongsToMany(Job::class, 'saved_jobs')->withTimestamps();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isCompany(): bool
    {
        return $this->role === 'company';
    }

    public function isJobSeeker(): bool
    {
        return $this->role === 'job_seeker';
    }
}
