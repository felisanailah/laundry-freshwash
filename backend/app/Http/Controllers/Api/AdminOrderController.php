<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Courier;
use App\Models\Customer;
use App\Models\Order;
use App\Services\OrderBuilder;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'items.service', 'payment', 'courier'])
            ->latest();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($orderType = $request->query('order_type')) {
            $query->where('order_type', $orderType);
        }

        $orders = $query->limit(100)->get();

        $kpi = [
            'dijemput' => Order::where('status', 'dijemput')->count(),
            'dicuci' => Order::where('status', 'dicuci')->count(),
            'disetrika' => Order::where('status', 'disetrika')->count(),
            'siap_diantar' => Order::where('status', 'siap_diantar')->count(),
        ];

        return response()->json([
            'orders' => $orders,
            'kpi' => $kpi,
        ]);
    }

    public function storePosOrder(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'courier_id' => ['nullable', 'integer', 'exists:couriers,id'],
            'order_type' => ['required', 'in:pickup_delivery,pickup_only,delivery_only,walk_in'],
            'notes' => ['nullable', 'string'],
            'promo_code' => ['nullable', 'string'],
            'payment_status' => ['required', 'in:lunas,dp,belum_lunas'],
            'dp_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,qris,transfer,ewallet,cod'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'integer', 'exists:services,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.1'],
        ]);

        $order = OrderBuilder::createOrder($data);

        return response()->json($order, 201);
    }

    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', 'in:dijemput,dicuci,disetrika,siap_diantar,selesai'],
        ]);

        $order->update(['status' => $data['status']]);

        return response()->json($order->fresh(['customer', 'items.service', 'payment']));
    }

    public function updatePayment(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', 'in:lunas,dp,belum_lunas'],
            'dp_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $total = (float) $order->total;

        if ($data['status'] === 'lunas') {
            $order->payment()->update([
                'status' => 'lunas',
                'paid_amount' => $total,
                'remaining_amount' => 0,
                'paid_at' => now(),
            ]);
        } elseif ($data['status'] === 'dp') {
            $dpAmount = min($total, max(0, (float) ($data['dp_amount'] ?? round($total * 0.5))));
            $order->payment()->update([
                'status' => 'dp',
                'dp_amount' => $dpAmount,
                'paid_amount' => $dpAmount,
                'remaining_amount' => max(0, $total - $dpAmount),
                'dp_paid_at' => now(),
                'paid_at' => null,
            ]);
        } else {
            $order->payment()->update([
                'status' => 'belum_lunas',
                'dp_amount' => 0,
                'paid_amount' => 0,
                'remaining_amount' => $total,
                'dp_paid_at' => null,
                'paid_at' => null,
            ]);
        }

        return response()->json($order->fresh(['payment']));
    }

    public function customers()
    {
        return response()->json(Customer::orderBy('name')->get());
    }

    public function storeCustomer(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'whatsapp' => ['required', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
        ]);

        $customer = Customer::create($data);

        return response()->json($customer, 201);
    }

    public function couriers()
    {
        return response()->json(Courier::where('is_active', true)->orderBy('name')->get());
    }

    public function assignCourier(Request $request, Order $order)
    {
        $data = $request->validate([
            'courier_id' => ['nullable', 'integer', 'exists:couriers,id'],
        ]);

        $order->update(['courier_id' => $data['courier_id']]);

        return response()->json($order->fresh(['courier']));
    }
}
