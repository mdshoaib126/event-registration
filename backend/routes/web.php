<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Event Registration System API',
        'version' => '1.0.0',
        'status' => 'active',
        'endpoints' => [
            'authentication' => '/api/auth/*',
            'events' => '/api/events',
            'attendees' => '/api/attendees',
            'qr_codes' => '/api/qr-codes',
            'client_branding' => '/api/client-branding',
            'public_registration' => '/api/public/events/{slug}/register',
        ],
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
        'documentation' => 'Please refer to the API documentation for detailed usage.',
    ], 200, [], JSON_PRETTY_PRINT);
});
