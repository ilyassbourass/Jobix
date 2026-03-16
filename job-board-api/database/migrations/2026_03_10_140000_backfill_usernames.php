<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $users = User::whereNull('username')->get();
        foreach ($users as $user) {
            $base = Str::slug($user->name, '-');
            $base = preg_replace('/[^a-z0-9-]/', '', $base) ?: 'user';
            $username = $base;
            $suffix = 0;
            while (User::where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $suffix++;
                $username = $base . '-' . $suffix;
            }
            $user->username = $username;
            $user->save();
        }
    }

    public function down(): void
    {
        // No down - we don't clear usernames
    }
};
