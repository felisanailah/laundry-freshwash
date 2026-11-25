<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Promo;
use App\Models\Service;
use Illuminate\Support\Facades\DB;

class OrderBuilder
{
    public static function createOrder(array $params): Order
    {
        return DB::transaction(function () use ($params) {
            $subtotal = 0;
            $preparedItems = [];

            foreach ($params['items'] as $row) {
                $service = Service::findOrFail($row['service_id']);
                $qty = (float) $row['quantity'];
                $lineTotal = round($service->price * $qty);
                $subtotal += $lineTotal;

                $preparedItems[] = [
                    'service_id' => $service->id,
                    'quantity' => $qty,
                    'unit_price' => $service->price,
                    'subtotal' => $lineTotal,
                ];
            }

            $discount = 0;
            if (!empty($params['promo_code'])) {
                $promo = Promo::where('code', strtoupper($params['promo_code']))
                    ->where('is_active', true)
                    ->first();
                if ($promo) {
                    $discount = $promo->discount_type === 'percent'
                        ? round(($subtotal * $promo->discount_value) / 100)
                        : min($subtotal, $promo->discount_value);
                }
            }

            $total = max(0, $subtotal - $discount);
            $datePrefix = now()->format('Ymd');
            $seq = str_pad((string) (Order::whereDate('created_at', today())->count() + 1), 3, '0', STR_PAD_LEFT);
            $invoiceCode = "LND-{$datePrefix}-{$seq}";
            while (Order::where('invoice_code', $invoiceCode)->exists()) {
                $seq = str_pad((string) ((int) $seq + 1), 3, '0', STR_PAD_LEFT);
                $invoiceCode = "LND-{$datePrefix}-{$seq}";
            }

            $orderType = $params['order_type'] ?? 'walk_in';
            $defaultStatus = in_array($orderType, ['pickup_delivery', 'pickup_only'], true)
                ? 'dijemput'
                : 'dicuci';

            $order = Order::create([
                'invoice_code' => $invoiceCode,
                'branch_id' => $params['branch_id'] ?? 1,
                'customer_id' => $params['customer_id'],
                'order_type' => $orderType,
                'pickup_schedule' => $params['pickup_schedule'] ?? null,
                'pickup_address' => $params['pickup_address'] ?? null,
                'status' => $params['status'] ?? $defaultStatus,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'notes' => $params['notes'] ?? null,
            ]);

            foreach ($preparedItems as $item) {
                OrderItem::create(array_merge($item, ['order_id' => $order->id]));
            }

            $paymentStatus = $params['payment_status'] ?? 'dp';
            $dpAmount = 0;
            $paidAmount = 0;
            $remainingAmount = $total;
            $dpPaidAt = null;
            $paidAt = null;

            if ($paymentStatus === 'lunas') {
                $paidAmount = $total;
                $remainingAmount = 0;
                $paidAt = now();
            } elseif ($paymentStatus === 'dp') {
                $requestedDp = isset($params['dp_amount']) && (float) $params['dp_amount'] > 0
                    ? (float) $params['dp_amount']
                    : round($total * 0.5);
                $dpAmount = min($total, max(0, $requestedDp));
                $paidAmount = $dpAmount;
                $remainingAmount = max(0, $total - $dpAmount);
                $dpPaidAt = now();
                if ($remainingAmount <= 0) {
                    $paymentStatus = 'lunas';
                    $paidAt = now();
                }
            }

            Payment::create([
                'order_id' => $order->id,
                'method' => $params['payment_method'] ?? 'cash',
                'status' => $paymentStatus,
                'dp_amount' => $dpAmount,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'dp_paid_at' => $dpPaidAt,
                'paid_at' => $paidAt,
            ]);

            return $order->load(['branch', 'customer', 'items.service', 'payment']);
        });
    }
}
