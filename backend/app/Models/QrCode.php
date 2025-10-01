<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QrCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendee_id',
        'qr_code_data',
        'qr_code_image_path',
        'is_used',
        'used_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
    ];

    /**
     * The attendee this QR code belongs to
     */
    public function attendee()
    {
        return $this->belongsTo(Attendee::class);
    }

    /**
     * Mark QR code as used
     */
    public function markAsUsed()
    {
        $this->update([
            'is_used' => true,
            'used_at' => now(),
        ]);
    }
}
