<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Attendee extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'event_id',
        'name',
        'email',
        'phone',
        'company',
        'designation',
        'ticket_type',
        'custom_data',
        'registration_source',
        'is_checked_in',
        'checked_in_at',
        'checked_in_by',
    ];

    protected $casts = [
        'custom_data' => 'array',
        'is_checked_in' => 'boolean',
        'checked_in_at' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attendee) {
            if (empty($attendee->registration_id)) {
                $attendee->registration_id = 'REG-' . strtoupper(Str::random(8));
            }
        });
    }

    /**
     * The event this attendee is registered for
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * The user who checked in this attendee
     */
    public function checkedInBy()
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }

    /**
     * QR code for this attendee
     */
    public function qrCode()
    {
        return $this->hasOne(QrCode::class);
    }

    /**
     * Check in the attendee
     */
    public function checkIn($checkedInBy = null)
    {
        $this->update([
            'is_checked_in' => true,
            'checked_in_at' => now(),
            'checked_in_by' => $checkedInBy,
        ]);
    }

    /**
     * Get full name with company
     */
    public function getFullDisplayNameAttribute()
    {
        $name = $this->name;
        if ($this->company) {
            $name .= ' (' . $this->company . ')';
        }
        return $name;
    }
}
