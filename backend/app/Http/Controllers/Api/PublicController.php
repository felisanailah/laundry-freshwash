<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Promo;
use App\Models\Service;
use App\Services\OrderBuilder;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function services()
    {
        return response()->json(
            Service::where('is_active', true)->orderBy('id')->get()
        );
    }

    public function validatePromo(Request $request)
    {
        $code = strtoupper((string) $request->query('code', ''));
        $promo = Promo::where('code', $code)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$promo) {
            return response()->json(['message' => 'Kode promo tidak ditemukan atau sudah berakhir.'], 404);
        }

        return response()->json($promo);
    }

    public function trackOrder(string $invoiceCode)
    {
        $order = Order::with(['branch', 'customer', 'items.service', 'payment'])
            ->where('invoice_code', strtoupper($invoiceCode))
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Invoice tidak ditemukan.'], 404);
        }

        return response()->json($order);
    }

    public function storeOrder(Request $request)
    {
        $data = $request->validate([
            'order_type' => ['required', 'in:pickup_delivery,pickup_only,delivery_only,walk_in'],
            'customer_name' => ['required', 'string', 'max:120'],
            'whatsapp' => ['required', 'string', 'max:30'],
            'pickup_address' => ['nullable', 'string'],
            'pickup_schedule' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'payment_method' => ['required', 'in:qris,transfer,ewallet,cod,cash'],
            'payment_status' => ['nullable', 'in:dp,lunas,belum_lunas'],
            'dp_amount' => ['nullable', 'numeric', 'min:0'],
            'promo_code' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.1'],
        ]);

        $customer = Customer::firstOrCreate(
            ['whatsapp' => $data['whatsapp']],
            ['name' => $data['customer_name'], 'address' => $data['pickup_address'] ?? null]
        );

        $order = OrderBuilder::createOrder([
            'customer_id' => $customer->id,
            'order_type' => $data['order_type'],
            'pickup_address' => $data['pickup_address'] ?? null,
            'pickup_schedule' => $data['pickup_schedule'] ?? null,
            'notes' => $data['notes'] ?? null,
            'payment_method' => $data['payment_method'],
            'payment_status' => $data['payment_status'] ?? ($data['payment_method'] === 'cod' ? 'belum_lunas' : 'dp'),
            'dp_amount' => $data['dp_amount'] ?? null,
            'promo_code' => $data['promo_code'] ?? null,
            'items' => $data['items'],
        ]);

        return response()->json($order, 201);
    }
}
