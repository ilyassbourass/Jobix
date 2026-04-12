<?php

namespace App\Support;

class AuthLink
{
    public static function frontend(string $path, array $query = []): string
    {
        return self::build(
            (string) config('app.frontend_url', 'http://localhost:5173'),
            $path,
            $query
        ) ?? 'http://localhost:5173';
    }

    public static function mobile(string $path, array $query = []): ?string
    {
        return self::build(
            (string) config('app.mobile_url', ''),
            $path,
            $query
        );
    }

    private static function build(string $base, string $path, array $query = []): ?string
    {
        $base = trim($base);

        if ($base === '') {
            return null;
        }

        $url = $base . (str_ends_with($base, '/') ? '' : '/') . ltrim($path, '/');

        $query = array_filter($query, static fn ($value) => $value !== null && $value !== '');

        if ($query !== []) {
            $url .= (str_contains($url, '?') ? '&' : '?') . http_build_query($query);
        }

        return $url;
    }
}
