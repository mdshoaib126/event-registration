<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;

class SampleEventSeeder extends Seeder
{
    public function run()
    {
        // Get the admin user
        $adminUser = User::where('email', 'admin@eventregistration.com')->first();
        
        if (!$adminUser) {
            $this->command->error('Admin user not found. Please run AdminUserSeeder first.');
            return;
        }

        $events = [
            [
                'name' => 'Tech Conference 2025',
                'slug' => 'tech-conference-2025',
                'description' => 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing. Join industry leaders and tech enthusiasts for two days of inspiring talks, networking, and hands-on workshops.',
                'venue' => 'San Francisco Convention Center, Hall A',
                'event_date' => Carbon::now()->addDays(30)->format('Y-m-d'),
                'event_time' => '09:00:00',
                'max_attendees' => 500,
                'is_active' => true,
                'status' => 'published',
                'created_by' => $adminUser->id,
                'custom_fields' => json_encode([
                    [
                        'name' => 'company',
                        'label' => 'Company Name',
                        'type' => 'text',
                        'required' => true,
                        'options' => []
                    ],
                    [
                        'name' => 'job_title',
                        'label' => 'Job Title',
                        'type' => 'text',
                        'required' => false,
                        'options' => []
                    ],
                    [
                        'name' => 'experience_level',
                        'label' => 'Experience Level',
                        'type' => 'select',
                        'required' => true,
                        'options' => ['Beginner', 'Intermediate', 'Advanced', 'Expert']
                    ],
                    [
                        'name' => 'dietary_requirements',
                        'label' => 'Dietary Requirements',
                        'type' => 'textarea',
                        'required' => false,
                        'options' => []
                    ]
                ])
            ],
            [
                'name' => 'Digital Marketing Summit',
                'slug' => 'digital-marketing-summit',
                'description' => 'Learn the latest digital marketing strategies from industry experts. Sessions cover SEO, social media marketing, content strategy, and analytics. Perfect for marketers, entrepreneurs, and business owners.',
                'venue' => 'New York Business Center, Room 301',
                'event_date' => Carbon::now()->addDays(45)->format('Y-m-d'),
                'event_time' => '10:30:00',
                'max_attendees' => 200,
                'is_active' => true,
                'status' => 'published',
                'created_by' => $adminUser->id,
                'custom_fields' => json_encode([
                    [
                        'name' => 'business_type',
                        'label' => 'Business Type',
                        'type' => 'select',
                        'required' => true,
                        'options' => ['Startup', 'Small Business', 'Enterprise', 'Agency', 'Freelancer']
                    ],
                    [
                        'name' => 'marketing_budget',
                        'label' => 'Annual Marketing Budget',
                        'type' => 'select',
                        'required' => false,
                        'options' => ['Under $10K', '$10K-$50K', '$50K-$100K', 'Over $100K']
                    ],
                    [
                        'name' => 'linkedin_profile',
                        'label' => 'LinkedIn Profile URL',
                        'type' => 'text',
                        'required' => false,
                        'options' => []
                    ]
                ])
            ],
            [
                'name' => 'Startup Networking Night',
                'slug' => 'startup-networking-night',
                'description' => 'Connect with fellow entrepreneurs, investors, and startup enthusiasts. Casual networking event with drinks, food, and plenty of opportunities to make valuable connections in the startup ecosystem.',
                'venue' => 'Innovation Hub, Level 5 Rooftop',
                'event_date' => Carbon::now()->addDays(15)->format('Y-m-d'),
                'event_time' => '18:00:00',
                'max_attendees' => 150,
                'is_active' => true,
                'status' => 'published',
                'created_by' => $adminUser->id,
                'custom_fields' => json_encode([
                    [
                        'name' => 'role',
                        'label' => 'Your Role',
                        'type' => 'select',
                        'required' => true,
                        'options' => ['Founder', 'Co-founder', 'Investor', 'Employee', 'Advisor', 'Other']
                    ],
                    [
                        'name' => 'startup_stage',
                        'label' => 'Startup Stage',
                        'type' => 'select',
                        'required' => false,
                        'options' => ['Idea Stage', 'MVP', 'Early Stage', 'Growth Stage', 'Scale Stage']
                    ],
                    [
                        'name' => 'interests',
                        'label' => 'Areas of Interest',
                        'type' => 'textarea',
                        'required' => false,
                        'options' => []
                    ]
                ])
            ],
            [
                'name' => 'Web Development Workshop',
                'slug' => 'web-development-workshop',
                'description' => 'Hands-on workshop covering modern web development technologies including React, Node.js, and database integration. Suitable for beginners and intermediate developers looking to enhance their skills.',
                'venue' => 'Code Academy, Lab 1 & 2',
                'event_date' => Carbon::now()->addDays(60)->format('Y-m-d'),
                'event_time' => '09:30:00',
                'max_attendees' => 50,
                'is_active' => true,
                'status' => 'draft',
                'created_by' => $adminUser->id,
                'custom_fields' => json_encode([
                    [
                        'name' => 'programming_experience',
                        'label' => 'Programming Experience (Years)',
                        'type' => 'select',
                        'required' => true,
                        'options' => ['0-1', '1-3', '3-5', '5-10', '10+']
                    ],
                    [
                        'name' => 'preferred_languages',
                        'label' => 'Preferred Programming Languages',
                        'type' => 'text',
                        'required' => false,
                        'options' => []
                    ],
                    [
                        'name' => 'laptop_specs',
                        'label' => 'Laptop Specifications',
                        'type' => 'textarea',
                        'required' => true,
                        'options' => []
                    ]
                ])
            ],
            [
                'name' => 'Business Leadership Forum',
                'slug' => 'business-leadership-forum',
                'description' => 'Executive leadership forum discussing modern management practices, team building, and strategic planning. Featuring panel discussions with successful CEOs and business leaders.',
                'venue' => 'Grand Hotel, Executive Boardroom',
                'event_date' => Carbon::now()->addDays(90)->format('Y-m-d'),
                'event_time' => '14:00:00',
                'max_attendees' => 75,
                'is_active' => false,
                'status' => 'published',
                'created_by' => $adminUser->id,
                'custom_fields' => json_encode([
                    [
                        'name' => 'position',
                        'label' => 'Current Position',
                        'type' => 'text',
                        'required' => true,
                        'options' => []
                    ],
                    [
                        'name' => 'team_size',
                        'label' => 'Team Size',
                        'type' => 'select',
                        'required' => false,
                        'options' => ['1-5', '6-20', '21-50', '51-100', '100+']
                    ],
                    [
                        'name' => 'leadership_challenges',
                        'label' => 'Current Leadership Challenges',
                        'type' => 'textarea',
                        'required' => false,
                        'options' => []
                    ]
                ])
            ]
        ];

        foreach ($events as $eventData) {
            Event::create($eventData);
        }

        $this->command->info('Sample events created successfully!');
    }
}