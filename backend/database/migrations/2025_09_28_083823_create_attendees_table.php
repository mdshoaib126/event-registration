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
        Schema::create('attendees', function (Blueprint $table) {
            $table->id();
            $table->string('registration_id')->unique(); // Unique registration number
            $table->foreignId('event_id')->constrained('events')->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->string('designation')->nullable();
            $table->string('ticket_type')->default('general');
            $table->json('custom_data')->nullable(); // For additional custom fields
            $table->enum('registration_source', ['web', 'admin', 'import'])->default('web');
            $table->boolean('is_checked_in')->default(false);
            $table->dateTime('checked_in_at')->nullable();
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Index for faster queries
            $table->index(['event_id', 'is_checked_in']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendees');
    }
};
