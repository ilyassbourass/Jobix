<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->text('requirements')->nullable()->after('description');
            $table->enum('work_mode', ['remote', 'on_site', 'hybrid'])->nullable()->after('job_type');
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn(['requirements', 'work_mode']);
        });
    }
};

