<?php

namespace App\Services;

use App\Models\Attendee;
use App\Models\QrCode as QrCodeModel;
use App\Models\ClientBranding;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding; 
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QrCodeService
{
    /**
     * Generate QR code for attendee
     */
    public function generateQrCode(Attendee $attendee): QrCodeModel
    {
        // Create encrypted data for QR code
        $qrData = $this->createQrData($attendee);
        
        // Generate QR code image
        $imagePath = $this->generateQrImage($attendee, $qrData);
        
        // Save QR code record
        $qrCode = QrCodeModel::create([
            'attendee_id' => $attendee->id,
            'qr_code_data' => encrypt($qrData),
            'qr_code_image_path' => $imagePath,
        ]);
        
        return $qrCode;
    }
    
    /**
     * Create QR code data structure
     */
    private function createQrData(Attendee $attendee): array
    {
        return [
            'attendee_id' => $attendee->id,
            'registration_id' => $attendee->registration_id,
            'event_id' => $attendee->event_id,
            'name' => $attendee->name,
            'email' => $attendee->email,
            'company' => $attendee->company,
            'ticket_type' => $attendee->ticket_type,
            'timestamp' => now()->timestamp,
            'hash' => hash('sha256', $attendee->id . $attendee->registration_id . config('app.key')),
        ];
    }
    
    /**
     * Generate QR code image with branding
     */
    private function generateQrImage(Attendee $attendee, array $qrData): string
    {
        $branding = ClientBranding::getActive();
        
        try {
            // Encrypt the QR data for the QR code image (same as what's stored in database)
            $qrCodeData = encrypt($qrData);
            
            // Create QR code using Endroid QR Code v6.0 Builder constructor
            $builder = new Builder(
                writer: new PngWriter(),
                writerOptions: [],
                validateResult: false,
                data: $qrCodeData,
                encoding: new Encoding('UTF-8'),
                errorCorrectionLevel: ErrorCorrectionLevel::High,
                size: 300,
                margin: 10,
            );

            $result = $builder->build();
            
            // Save to storage
            $fileName = 'qr-codes/' . $attendee->registration_id . '-' . Str::random(8) . '.png';
            Storage::disk('public')->put($fileName, $result->getString());
            
            return $fileName;
            
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('QR Code generation failed for attendee ' . $attendee->id . ': ' . $e->getMessage());
            
            // Create a simple text-based placeholder as fallback
            $placeholderContent = "QR Code for: {$attendee->name}\nRegistration: {$attendee->registration_id}\nEvent ID: {$attendee->event_id}";
            $fileName = 'qr-codes/placeholder-' . $attendee->registration_id . '.txt';
            Storage::disk('public')->put($fileName, $placeholderContent);
            
            return $fileName;
        }
    }
    
    /**
     * Validate and decode QR code data
     */
    public function validateQrCode(string $qrCodeData): ?array
    {
        try {
            // First try to decrypt (for new encrypted QR codes)
            try {
                $qrData = decrypt($qrCodeData);
            } catch (\Exception $e) {
                // If decryption fails, try to parse as JSON (for old plain JSON QR codes)
                $qrData = json_decode($qrCodeData, true);
                if (!$qrData || !is_array($qrData)) {
                    return null;
                }
            }
            
            // Validate required fields
            if (!isset($qrData['attendee_id']) || !isset($qrData['registration_id']) || !isset($qrData['hash'])) {
                return null;
            }
            
            // Validate hash
            $expectedHash = hash('sha256', $qrData['attendee_id'] . $qrData['registration_id'] . config('app.key'));
            
            if ($qrData['hash'] !== $expectedHash) {
                return null;
            }
            
            return $qrData;
        } catch (\Exception $e) {
            return null;
        }
    }
    
    /**
     * Regenerate QR code for attendee
     */
    public function regenerateQrCode(Attendee $attendee): QrCodeModel
    {
        // Delete existing QR code
        if ($attendee->qrCode) {
            if (Storage::disk('public')->exists($attendee->qrCode->qr_code_image_path)) {
                Storage::disk('public')->delete($attendee->qrCode->qr_code_image_path);
            }
            $attendee->qrCode->delete();
        }
        
        // Generate new QR code
        return $this->generateQrCode($attendee);
    }
}