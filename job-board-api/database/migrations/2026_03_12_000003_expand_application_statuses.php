<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'reviewing', 'interview', 'accepted', 'rejected') NOT NULL DEFAULT 'pending'");
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=OFF');

            Schema::create('applications_new', function ($table) {
                $table->id();
                $table->foreignId('job_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('cover_letter')->nullable();
                $table->string('resume_path')->nullable();
                $table->enum('status', ['pending', 'reviewing', 'interview', 'accepted', 'rejected'])->default('pending');
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
                $table->unique(['job_id', 'user_id']);
            });

            DB::statement(
                'INSERT INTO applications_new (id, job_id, user_id, cover_letter, resume_path, status, rejection_reason, created_at, updated_at)
                 SELECT id, job_id, user_id, cover_letter, resume_path, status, rejection_reason, created_at, updated_at
                 FROM applications'
            );

            Schema::drop('applications');
            DB::statement('ALTER TABLE applications_new RENAME TO applications');
            DB::statement('PRAGMA foreign_keys=ON');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("UPDATE applications SET status = 'pending' WHERE status IN ('reviewing', 'interview')");
            DB::statement("ALTER TABLE applications MODIFY status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending'");
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys=OFF');

            Schema::create('applications_new', function ($table) {
                $table->id();
                $table->foreignId('job_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('cover_letter')->nullable();
                $table->string('resume_path')->nullable();
                $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
                $table->unique(['job_id', 'user_id']);
            });

            DB::statement(
                "INSERT INTO applications_new (id, job_id, user_id, cover_letter, resume_path, status, rejection_reason, created_at, updated_at)
                 SELECT id, job_id, user_id, cover_letter, resume_path,
                        CASE WHEN status IN ('reviewing', 'interview') THEN 'pending' ELSE status END,
                        rejection_reason, created_at, updated_at
                 FROM applications"
            );

            Schema::drop('applications');
            DB::statement('ALTER TABLE applications_new RENAME TO applications');
            DB::statement('PRAGMA foreign_keys=ON');
        }
    }
};
