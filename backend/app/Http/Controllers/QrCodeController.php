<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\QrCode;
use App\Models\Attendee;
use App\Services\QrCodeService;

class QrCodeController extends Controller
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Scan QR code for check-in
     */
    public function scan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'qr_data' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Log the QR data for debugging
        \Log::info('QR Scan attempt', [
            'qr_data_length' => strlen($request->qr_data),
            'qr_data_preview' => substr($request->qr_data, 0, 100) . '...'
        ]);

        // Validate and decode QR code data
        $qrData = $this->qrCodeService->validateQrCode($request->qr_data);

        if (!$qrData) {
            \Log::warning('QR validation failed', ['qr_data' => $request->qr_data]);
            return response()->json(['error' => 'Invalid QR code'], 422);
        }

        \Log::info('QR validation successful', $qrData);

        // Find attendee
        $attendee = Attendee::with(['event', 'qrCode'])
            ->where('id', $qrData['attendee_id'])
            ->where('registration_id', $qrData['registration_id'])
            ->first();

        if (!$attendee) {
            return response()->json(['error' => 'Attendee not found'], 404);
        }

        // Check if already checked in
        if ($attendee->is_checked_in) {
            return response()->json([
                'error' => 'Attendee already checked in',
                'attendee' => $attendee,
                'checked_in_at' => $attendee->checked_in_at,
                'checked_in_by' => $attendee->checkedInBy->name ?? 'Unknown'
            ], 422);
        }

        // Check in the attendee
        $attendee->checkIn(auth()->id());

        // Mark QR code as used
        if ($attendee->qrCode) {
            $attendee->qrCode->markAsUsed();
        }

        return response()->json([
            'message' => 'Check-in successful',
            'attendee' => $attendee->load(['event', 'checkedInBy']),
            'checked_in_at' => $attendee->fresh()->checked_in_at
        ]);
    }

    /**
     * Download QR code image
     */
    public function download(QrCode $qrCode)
    {
        if (!Storage::disk('public')->exists($qrCode->qr_code_image_path)) {
            return response()->json(['error' => 'QR code image not found'], 404);
        }

        $attendee = $qrCode->attendee;
        $fileName = $attendee->registration_id . '-qr-code.png';

        return Storage::disk('public')->download(
            $qrCode->qr_code_image_path,
            $fileName
        );
    }

    /**
     * Generate QR code for attendee (if they don't have one)
     */
    public function generateForAttendee(Attendee $attendee)
    {
        // Check if attendee already has a QR code
        if ($attendee->qrCode) {
            return response()->json([
                'message' => 'Attendee already has a QR code',
                'qr_code' => $attendee->qrCode
            ]);
        }

        $qrCode = $this->qrCodeService->generateQrCode($attendee);

        return response()->json([
            'message' => 'QR code generated successfully',
            'qr_code' => $qrCode
        ]);
    }

    /**
     * Regenerate QR code for attendee (admin only)
     */
    public function regenerate(Attendee $attendee)
    {
        $qrCode = $this->qrCodeService->regenerateQrCode($attendee);

        return response()->json([
            'message' => 'QR code regenerated successfully',
            'qr_code' => $qrCode
        ]);
    }

    /**
     * Get QR code information
     */
    public function show(QrCode $qrCode)
    {
        return response()->json([
            'qr_code' => $qrCode,
            'attendee' => $qrCode->attendee->load('event'),
            'qr_code_url' => url('storage/' . $qrCode->qr_code_image_path)
        ]);
    }
}
