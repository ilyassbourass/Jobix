<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'email_verification_code')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users ALTER COLUMN email_verification_code TYPE TEXT');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY email_verification_code TEXT NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('users', 'email_verification_code')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users ALTER COLUMN email_verification_code TYPE VARCHAR(255)');
            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY email_verification_code VARCHAR(255) NULL');
        }
    }
};
