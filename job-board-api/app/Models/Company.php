<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory;

    protected $appends = ['logo_url', 'owner_avatar_url', 'owner_avatar'];

    protected $hidden = ['users'];

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'website',
        'location',
        'industry',
        'company_size',
    ];

    public static function generateSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name, '-');
        $base = $base !== '' ? $base : 'company';
        $slug = $base;
        $suffix = 2;

        while (static::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (empty($this->logo)) {
            return null;
        }

        return url('api/companies/' . $this->id . '/logo?v=' . rawurlencode((string) $this->logo));
    }

    public function getOwnerAvatarAttribute(): ?string
    {
        $owner = $this->relationLoaded('users') ? $this->users->first() : $this->users()->first();
        return $owner?->avatar;
    }

    public function getOwnerAvatarUrlAttribute(): ?string
    {
        $owner = $this->relationLoaded('users') ? $this->users->first() : $this->users()->first();
        return $owner?->avatar_url;
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }
}
