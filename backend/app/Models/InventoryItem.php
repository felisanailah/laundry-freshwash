<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = ['branch_id', 'name', 'unit', 'stock', 'min_stock'];

    protected $casts = [
        'stock' => 'float',
        'min_stock' => 'float',
    ];
}
