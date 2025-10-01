<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\ClientBranding;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin user
        User::firstOrCreate([
            'email' => 'admin@eventregistration.com'
        ], [
            'name' => 'Event Admin',
            'email' => 'admin@eventregistration.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Create default event staff user
        User::firstOrCreate([
            'email' => 'staff@eventregistration.com'
        ], [
            'name' => 'Event Staff',
            'email' => 'staff@eventregistration.com',
            'password' => Hash::make('password123'),
            'role' => 'event_staff',
        ]);

        // Create default branding
        ClientBranding::firstOrCreate([
            'is_active' => true
        ], [
            'company_name' => 'Event Registration System',
            'company_description' => 'Professional Event Management Platform',
            'primary_color' => '#007bff',
            'secondary_color' => '#6c757d',
            'accent_color' => '#28a745',
            'is_active' => true,
        ]);

        $this->command->info('Default users and branding created successfully!');
        $this->command->info('Admin: admin@eventregistration.com / password123');
        $this->command->info('Staff: staff@eventregistration.com / password123');
    }
}
