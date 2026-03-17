<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // No-op: verification codes are stored in a compact format that fits the existing column.
    }

    public function down(): void
    {
        // No-op.
    }
};
