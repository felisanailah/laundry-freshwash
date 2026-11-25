<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    protected $fillable = ['code', 'discount_type', 'discount_value', 'is_active', 'expires_at'];

    protected $casts = [
        'discount_value' => 'float',
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];
}
