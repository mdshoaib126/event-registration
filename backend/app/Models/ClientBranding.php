<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ClientBranding extends Model
{
    use HasFactory;

    protected $table = 'client_branding';

    protected $fillable = [
        'organizer_logo',
        'primary_color',
        'secondary_color',
        'accent_color',
        'company_name',
        'company_description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the active branding configuration
     */
    public static function getActive()
    {
        return static::where('is_active', true)->first() ?? static::getDefault();
    }

    /**
     * Get default branding configuration
     */
    public static function getDefault()
    {
        return new static([
            'primary_color' => '#007bff',
            'secondary_color' => '#6c757d',
            'accent_color' => '#28a745',
            'company_name' => 'Event Registration System',
            'company_description' => 'Professional Event Management',
        ]);
    }
}
