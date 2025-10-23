<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'venue',
        'event_date',
        'event_time',
        'banner',
        'event_logo',
        'custom_fields',
        'default_fields',
        'is_active',
        'status',
        'max_attendees',
        'created_by',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'custom_fields' => 'array',
        'default_fields' => 'array',
        'is_active' => 'boolean',
    ];

    // Custom accessor for proper time formatting (since event_time is a TIME field)
    public function getEventTimeAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value)->format('H:i:s') : null;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($event) {
            if (empty($event->slug)) {
                $event->slug = Str::slug($event->name . '-' . Str::random(6));
            }
        });
    }

    /**
     * The user who created this event
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Attendees for this event
     */
    public function attendees()
    {
        return $this->hasMany(Attendee::class);
    }

    /**
     * Get checked-in attendees count
     */
    public function checkedInAttendeesCount()
    {
        return $this->attendees()->where('is_checked_in', true)->count();
    }

    /**
     * Get total attendees count
     */
    public function totalAttendeesCount()
    {
        return $this->attendees()->count();
    }

    /**
     * Check if event is full
     */
    public function isFull()
    {
        if (!$this->max_attendees) {
            return false;
        }
        return $this->totalAttendeesCount() >= $this->max_attendees;
    }
}
