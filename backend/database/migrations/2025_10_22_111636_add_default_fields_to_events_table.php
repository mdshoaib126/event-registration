<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->json('default_fields')->nullable()->after('custom_fields');
        });
        
        // Update existing events with default field configuration
        DB::table('events')->update([
            'default_fields' => json_encode([
                'name' => ['required' => true, 'label' => 'Full Name'],
                'email' => ['required' => true, 'label' => 'Email Address'], 
                'phone' => ['required' => false, 'label' => 'Phone Number']
            ])
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('default_fields');
        });
    }
};
