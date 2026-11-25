<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerController extends Controller
{
    public function analytics(Request $request)
    {
        $branchId = $request->query('branch_id');

        $orderQuery = Order::query();
        if ($branchId) {
            $orderQuery->where('branch_id', $branchId);
        }

        $totalRevenue = (clone $orderQuery)->sum('total');
        $totalOrders = (clone $orderQuery)->count();
        $unpaidTotal = Payment::query()
            ->whereIn('status', ['belum_lunas', 'dp'])
            ->whereHas('order', fn ($q) => $branchId ? $q->where('branch_id', $branchId) : $q)
            ->sum('remaining_amount');
        $activeCustomers = Customer::count();

        $dailyRevenue = Order::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as total'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->limit(14)
            ->get();

        $totalPayments = max(1, Payment::count());
        $paymentBreakdown = Payment::select('method', DB::raw('COUNT(*) as count'))
            ->groupBy('method')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->method,
                'count' => $row->count,
                'percentage' => round(($row->count / $totalPayments) * 100),
            ]);

        $topServices = OrderItem::join('services', 'order_items.service_id', '=', 'services.id')
            ->select('services.name', DB::raw('COUNT(*) as total_orders'))
            ->groupBy('services.id', 'services.name')
            ->orderByDesc('total_orders')
            ->limit(5)
            ->get();

        return response()->json([
            'kpi' => [
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'unpaid_total' => (float) $unpaidTotal,
                'active_customers' => $activeCustomers,
            ],
            'daily_revenue' => $dailyRevenue,
            'payment_breakdown' => $paymentBreakdown,
            'top_services' => $topServices,
            'branches' => Branch::all(),
        ]);
    }

    public function inventory()
    {
        return response()->json(InventoryItem::orderByRaw('stock <= min_stock DESC')->get());
    }

    public function updateInventory(Request $request, InventoryItem $inventoryItem)
    {
        $data = $request->validate([
            'stock' => ['required', 'numeric', 'min:0'],
        ]);

        $inventoryItem->update(['stock' => $data['stock']]);

        return response()->json($inventoryItem);
    }
}
