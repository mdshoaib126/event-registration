<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('qr_codes', function (Blueprint $table) {
            // Drop the unique constraint first (not needed since attendee_id is already unique)
            $table->dropUnique(['qr_code_data']);
        });
        
        Schema::table('qr_codes', function (Blueprint $table) {
            // Change qr_code_data from VARCHAR(255) to TEXT to handle encrypted data
            $table->text('qr_code_data')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('qr_codes', function (Blueprint $table) {
            // Revert back to string (VARCHAR 255) - note: this may cause data loss
            $table->string('qr_code_data')->unique()->change();
        });
    }
};