<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'category_id',
        'title',
        'slug',
        'description',
        'requirements',
        'location',
        'job_type',
        'work_mode',
        'experience_level',
        'salary_min',
        'salary_max',
        'is_active',
        'published_at',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%");
        });
    }

    public function scopeFilterCategory($query, ?int $categoryId)
    {
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        return $query;
    }

    public function scopeFilterLocation($query, ?string $location)
    {
        if ($location) {
            $query->where('location', 'like', "%{$location}%");
        }
        return $query;
    }

    public function scopeFilterSalary($query, $min, $max)
    {
        if ($min !== null && $min !== '') {
            $query->where(function ($q) use ($min) {
                $q->whereNull('salary_min')->orWhere('salary_min', '>=', $min);
            });
        }

        if ($max !== null && $max !== '') {
            $query->where(function ($q) use ($max) {
                $q->whereNull('salary_max')->orWhere('salary_max', '<=', $max);
            });
        }

        return $query;
    }

    public function scopeFilterWorkMode($query, ?string $workMode)
    {
        if (!$workMode) {
            return $query;
        }

        if ($workMode === 'remote') {
            // Backwards-compatible with existing data where job_type="remote"
            return $query->where(function ($q) {
                $q->where('work_mode', 'remote')->orWhere('job_type', 'remote');
            });
        }

        return $query->where('work_mode', $workMode);
    }
}
