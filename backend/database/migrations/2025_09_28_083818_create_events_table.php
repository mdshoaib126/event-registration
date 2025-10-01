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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('venue');
            $table->dateTime('event_date');
            $table->time('event_time');
            $table->string('banner')->nullable();
            $table->string('event_logo')->nullable();
            $table->json('custom_fields')->nullable(); // For dynamic form fields
            $table->boolean('is_active')->default(true);
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->integer('max_attendees')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
