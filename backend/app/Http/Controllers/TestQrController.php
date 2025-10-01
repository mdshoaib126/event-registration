<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;

class TestQrController extends Controller
{
    public function testQr()
    {
        try {
            $builder = new Builder(
                writer: new PngWriter(),
                writerOptions: [],
                validateResult: false,
                data: 'Hello World Test QR Code',
                encoding: new Encoding('UTF-8'),
                errorCorrectionLevel: ErrorCorrectionLevel::High,
                size: 300,
                margin: 10,
            );

            $result = $builder->build();
            
            return response($result->getString(), 200)
                ->header('Content-Type', $result->getMimeType());
                
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'QR Code generation failed',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}