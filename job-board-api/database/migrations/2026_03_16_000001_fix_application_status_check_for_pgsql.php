<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("UPDATE applications SET status = 'pending' WHERE status NOT IN ('pending', 'reviewing', 'interview', 'accepted', 'rejected')");
        DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        DB::statement("
            ALTER TABLE applications
            ADD CONSTRAINT applications_status_check
            CHECK (status IN ('pending', 'reviewing', 'interview', 'accepted', 'rejected'))
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("UPDATE applications SET status = 'pending' WHERE status IN ('reviewing', 'interview')");
        DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
        DB::statement("
            ALTER TABLE applications
            ADD CONSTRAINT applications_status_check
            CHECK (status IN ('pending', 'accepted', 'rejected'))
        ");
    }
};
