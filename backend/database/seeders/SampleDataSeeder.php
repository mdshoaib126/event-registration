<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SampleDataSeeder extends Seeder
{
    /**
     * Run all sample data seeders.
     */
    public function run()
    {
        $this->command->info('🌱 Starting sample data seeding...');
        
        // Seed branding first (independent)
        $this->command->info('📊 Seeding branding data...');
        $this->call(SampleBrandingSeeder::class);
        
        // Seed events (requires admin user)
        $this->command->info('🎯 Seeding sample events...');
        $this->call(SampleEventSeeder::class);
        
        // Seed attendees (requires events)
        $this->command->info('👥 Seeding sample attendees...');
        $this->call(SampleAttendeeSeeder::class);
        
        $this->command->info('✅ Sample data seeding completed successfully!');
        $this->command->line('');
        $this->command->info('📈 Summary:');
        $this->command->info('   • Events: ' . \App\Models\Event::count());
        $this->command->info('   • Attendees: ' . \App\Models\Attendee::count());
        $this->command->info('   • QR Codes: ' . \App\Models\QrCode::count());
        $this->command->info('   • Branding Themes: ' . \App\Models\ClientBranding::count());
        $this->command->line('');
        $this->command->info('🚀 Your Event Registration System is now ready with sample data!');
        $this->command->info('   • Login: admin@eventregistration.com / password123');
        $this->command->info('   • Staff: staff@eventregistration.com / password123');
    }
}
