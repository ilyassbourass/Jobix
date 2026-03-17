<?php

namespace App\Support;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class Uploads
{
    public static function diskName(): string
    {
        return (string) config('filesystems.uploads_disk', 'uploads');
    }

    public static function disk(): FilesystemAdapter
    {
        return Storage::disk(self::diskName());
    }
}
