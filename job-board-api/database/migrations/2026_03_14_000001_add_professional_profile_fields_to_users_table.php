<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('headline', 160)->nullable()->after('bio');
            $table->string('seniority', 50)->nullable()->after('headline');
            $table->string('availability', 50)->nullable()->after('seniority');
            $table->string('preferred_work_mode', 50)->nullable()->after('availability');
            $table->text('experience')->nullable()->after('preferred_work_mode');
            $table->text('projects')->nullable()->after('experience');
            $table->text('skills_with_level')->nullable()->after('projects');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'headline',
                'seniority',
                'availability',
                'preferred_work_mode',
                'experience',
                'projects',
                'skills_with_level',
            ]);
        });
    }
};
