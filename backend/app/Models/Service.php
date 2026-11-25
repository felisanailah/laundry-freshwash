<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'category', 'price', 'unit', 'estimated_hours', 'is_active'];

    protected $casts = [
        'price' => 'float',
        'is_active' => 'boolean',
    ];
}
