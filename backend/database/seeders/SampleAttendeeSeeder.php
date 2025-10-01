<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use App\Models\Event;
use App\Models\Attendee;
use App\Models\QrCode;
use App\Services\QrCodeService;
use Faker\Factory as Faker;
use Carbon\Carbon;

class SampleAttendeeSeeder extends Seeder
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    public function run()
    {
        $faker = Faker::create();
        
        // Ensure QR codes storage directory exists
        if (!Storage::disk('public')->exists('qr-codes')) {
            Storage::disk('public')->makeDirectory('qr-codes');
            $this->command->info('Created qr-codes storage directory');
        }
        
        // Get all events
        $events = Event::all();
        
        if ($events->isEmpty()) {
            $this->command->error('No events found. Please run SampleEventSeeder first.');
            return;
        }

        foreach ($events as $event) {
            // Generate random number of attendees for each event
            $attendeeCount = rand(10, min(30, $event->max_attendees ?? 30));
            
            $this->command->info("Creating {$attendeeCount} attendees with QR codes for event: {$event->name}");
            
            for ($i = 0; $i < $attendeeCount; $i++) {
                $isCheckedIn = $faker->boolean(40); // 40% chance of being checked in
                $customData = $this->generateCustomData($event, $faker);
                
                $attendee = Attendee::create([
                    'registration_id' => 'REG-' . strtoupper($faker->unique()->bothify('##??##')),
                    'event_id' => $event->id,
                    'name' => $faker->name,
                    'email' => $faker->unique()->safeEmail,
                    'phone' => $faker->optional(0.8)->phoneNumber,
                    'company' => $faker->optional(0.7)->company,
                    'designation' => $faker->optional(0.6)->jobTitle,
                    'ticket_type' => $faker->randomElement(['General', 'VIP', 'Student', 'Speaker']),
                    'custom_data' => $customData,
                    'registration_source' => $faker->randomElement(['web', 'admin', 'import']),
                    'is_checked_in' => $isCheckedIn,
                    'checked_in_at' => $isCheckedIn ? $faker->dateTimeBetween('-7 days', 'now') : null,
                    'checked_in_by' => $isCheckedIn ? 1 : null, // Admin user ID
                    'created_at' => $faker->dateTimeBetween('-30 days', 'now'),
                    'updated_at' => now(),
                ]);

                // Generate actual QR code using QrCodeService
                try {
                    $qrCode = $this->qrCodeService->generateQrCode($attendee);
                    $this->command->line("  ✓ Generated QR code for {$attendee->name} ({$attendee->registration_id})");
                } catch (\Exception $e) {
                    $this->command->warn("Failed to generate QR code for attendee {$attendee->id} ({$attendee->registration_id}): " . $e->getMessage());
                    
                    // Fallback to basic QR code record if generation fails
                    try {
                        // Use simpler data to avoid column length issues
                        $simpleData = [
                            'attendee_id' => $attendee->id,
                            'registration_id' => $attendee->registration_id,
                            'event_id' => $attendee->event_id,
                        ];
                        
                        \App\Models\QrCode::create([
                            'attendee_id' => $attendee->id,
                            'qr_code_data' => base64_encode(json_encode($simpleData)),
                            'qr_code_image_path' => 'qr-codes/placeholder-' . $attendee->registration_id . '.txt',
                        ]);
                        $this->command->line("  → Created placeholder QR record for {$attendee->registration_id}");
                    } catch (\Exception $fallbackException) {
                        $this->command->error("Failed to create fallback QR code for attendee {$attendee->id}: " . $fallbackException->getMessage());
                    }
                }
            }
        }

        $totalAttendees = Attendee::count();
        $totalQrCodes = QrCode::count();
        $this->command->info("Sample attendees created successfully! Total: {$totalAttendees}");
        $this->command->info("QR codes generated: {$totalQrCodes}");
    }

    private function generateCustomData(Event $event, $faker)
    {
        $customFields = json_decode($event->custom_fields, true) ?? [];
        $customData = [];

        foreach ($customFields as $field) {
            $value = null;
            
            switch ($field['type']) {
                case 'text':
                case 'email':
                    if ($field['name'] === 'company') {
                        $value = $faker->optional(0.8)->company;
                    } elseif ($field['name'] === 'job_title' || $field['name'] === 'position') {
                        $value = $faker->optional(0.7)->jobTitle;
                    } elseif ($field['name'] === 'linkedin_profile') {
                        $value = $faker->optional(0.5)->url;
                    } elseif ($field['name'] === 'preferred_languages') {
                        $languages = ['JavaScript', 'Python', 'Java', 'C#', 'PHP', 'React', 'Node.js'];
                        $value = $faker->optional(0.8)->randomElements($languages, rand(1, 3));
                        $value = is_array($value) ? implode(', ', $value) : $value;
                    } else {
                        $value = $faker->optional(0.6)->sentence(3);
                    }
                    break;
                    
                case 'number':
                    $value = $faker->optional(0.7)->numberBetween(1, 100);
                    break;
                    
                case 'select':
                    if (!empty($field['options'])) {
                        $value = $faker->optional(0.8)->randomElement($field['options']);
                    }
                    break;
                    
                case 'textarea':
                    if ($field['name'] === 'dietary_requirements') {
                        $requirements = ['Vegetarian', 'Vegan', 'Gluten-free', 'Lactose intolerant', 'No nuts'];
                        $value = $faker->optional(0.3)->randomElement($requirements);
                    } elseif ($field['name'] === 'interests') {
                        $interests = ['AI/ML', 'Blockchain', 'Mobile Development', 'Cloud Computing', 'Cybersecurity'];
                        $selectedInterests = $faker->optional(0.7)->randomElements($interests, rand(1, 3));
                        $value = is_array($selectedInterests) ? implode(', ', $selectedInterests) : $selectedInterests;
                    } elseif ($field['name'] === 'laptop_specs') {
                        $specs = [
                            'MacBook Pro M2, 16GB RAM',
                            'Dell XPS 13, Intel i7, 8GB RAM',
                            'Lenovo ThinkPad, AMD Ryzen 7, 16GB RAM',
                            'ASUS ROG, Intel i9, 32GB RAM'
                        ];
                        $value = $faker->optional(0.9)->randomElement($specs);
                    } else {
                        $value = $faker->optional(0.5)->paragraph(2);
                    }
                    break;
            }

            if ($value !== null) {
                $customData[$field['name']] = $value;
            }
        }

        return $customData;
    }
}