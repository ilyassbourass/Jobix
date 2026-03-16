<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'company', 'job_seeker'])->default('job_seeker')->after('email');
            $table->unsignedBigInteger('company_id')->nullable()->after('role');
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
            $table->string('phone')->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['role', 'company_id', 'phone']);
        });
    }
};
