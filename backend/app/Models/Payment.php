<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'method',
        'status',
        'dp_amount',
        'paid_amount',
        'remaining_amount',
        'dp_paid_at',
        'paid_at',
    ];

    protected $casts = [
        'dp_amount' => 'float',
        'paid_amount' => 'float',
        'remaining_amount' => 'float',
        'dp_paid_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
