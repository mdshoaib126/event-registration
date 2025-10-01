<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AttendeeController;
use App\Http\Controllers\QrCodeController;
use App\Http\Controllers\ClientBrandingController;
use App\Http\Controllers\TestQrController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Authentication routes
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    
    // Protected auth routes
    Route::group(['middleware' => 'auth:api'], function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('user-profile', [AuthController::class, 'userProfile']);
    });
});

// Protected routes
Route::group(['middleware' => ['auth:api']], function () {
    
    // Admin only routes
    Route::group(['middleware' => ['role:admin']], function () {
        // Event management
        Route::apiResource('events', EventController::class);
        Route::post('events/{event}/toggle-status', [EventController::class, 'toggleStatus']);
        
        // Attendee management
        Route::post('events/{event}/attendees/bulk-import', [AttendeeController::class, 'bulkImport']);
        Route::post('events/{event}/attendees', [AttendeeController::class, 'store']);
        Route::put('attendees/{attendee}', [AttendeeController::class, 'update']);
        Route::delete('attendees/{attendee}', [AttendeeController::class, 'destroy']);
        
        // QR Code management
        Route::post('attendees/{attendee}/generate-qr', [QrCodeController::class, 'generateForAttendee']);
        Route::post('attendees/{attendee}/regenerate-qr', [QrCodeController::class, 'regenerate']);
        
        // Reporting
        Route::get('events/{event}/report', [EventController::class, 'generateReport']);
        Route::get('events/{event}/export/{format}', [EventController::class, 'exportData']);
        Route::get('attendees/export', [AttendeeController::class, 'export']);
        
        // Client branding
        Route::apiResource('client-branding', ClientBrandingController::class);
    });
    
    // Admin and Event Staff routes
    Route::group(['middleware' => ['role:admin,event_staff']], function () {
        // Check-in system
        Route::post('qr-codes/scan', [QrCodeController::class, 'scan']);
        Route::get('events/{event}/attendees', [AttendeeController::class, 'index']);
        Route::get('attendees/{attendee}', [AttendeeController::class, 'show']);
        Route::post('attendees/{attendee}/checkin', [AttendeeController::class, 'checkIn']);
    });
});



// Public routes
Route::group(['prefix' => 'public'], function () {
    // Event registration
    Route::get('events/{slug}', [EventController::class, 'showPublic']);
    Route::post('events/{slug}/register', [AttendeeController::class, 'register']);
    
    // QR code download
    Route::get('qr-codes/{qrCode}/download', [QrCodeController::class, 'download']);
    
    // Client branding
    Route::get('branding', [ClientBrandingController::class, 'getPublicBranding']);
    
    // Test QR code generation
    Route::get('test-qr', [TestQrController::class, 'testQr']);
});

// Dummy login route to satisfy Laravel's authentication middleware
Route::get('login', function() {
    return response()->json(['message' => 'Please login through the auth/login endpoint'], 401);
})->name('login');