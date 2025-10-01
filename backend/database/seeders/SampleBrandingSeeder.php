<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ClientBranding;

class SampleBrandingSeeder extends Seeder
{
    public function run()
    {
        // Create default branding configuration
        ClientBranding::create([
            'company_name' => 'TechEvents Pro',
            'company_description' => 'Professional event management platform for modern businesses. We help organizations create memorable experiences through seamless event registration and management.',
            'primary_color' => '#2563EB', // Blue
            'secondary_color' => '#10B981', // Green
            'accent_color' => '#8B5CF6', // Purple
            'is_active' => true,
        ]);

        // Create alternative branding theme
        ClientBranding::create([
            'company_name' => 'EventMaster Solutions',
            'company_description' => 'Innovative event solutions for corporate conferences, workshops, and networking events.',
            'primary_color' => '#DC2626', // Red
            'secondary_color' => '#F59E0B', // Amber
            'accent_color' => '#6366F1', // Indigo
            'is_active' => false,
        ]);

        // Create modern/minimalist branding theme
        ClientBranding::create([
            'company_name' => 'Nexus Events',
            'company_description' => 'Minimalist, modern approach to event management with focus on user experience.',
            'primary_color' => '#111827', // Dark Gray
            'secondary_color' => '#6B7280', // Gray
            'accent_color' => '#EF4444', // Red accent
            'is_active' => false,
        ]);

        $this->command->info('Sample branding configurations created successfully!');
    }
}