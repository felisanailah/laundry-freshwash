<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Courier;
use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Promo;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $senopati = Branch::create([
            'name' => 'Cabang Senopati, Jaksel',
            'address' => 'Jl. Senopati No. 45, Jakarta Selatan',
            'phone' => '081234567890',
        ]);

        Branch::create([
            'name' => 'Cabang Kemang, Jaksel',
            'address' => 'Jl. Kemang Raya No. 18, Jakarta Selatan',
            'phone' => '081298765432',
        ]);

        User::create([
            'name' => 'Owner FreshWash',
            'email' => 'owner@freshwash.id',
            'password' => Hash::make('password'),
            'role' => 'owner',
            'branch_id' => $senopati->id,
        ]);

        User::create([
            'name' => 'Kasir Senopati',
            'email' => 'kasir@freshwash.id',
            'password' => Hash::make('password'),
            'role' => 'kasir',
            'branch_id' => $senopati->id,
        ]);

        $kurir = Courier::create([
            'branch_id' => $senopati->id,
            'name' => 'Budi Santoso',
            'phone' => '081211112222',
            'is_active' => true,
        ]);

        Courier::create([
            'branch_id' => $senopati->id,
            'name' => 'Andi Wijaya',
            'phone' => '081233334444',
            'is_active' => true,
        ]);

        $s1 = Service::create([
            'name' => 'Cuci Komplit Kiloan',
            'category' => 'kiloan',
            'price' => 7000,
            'unit' => 'kg',
            'estimated_hours' => 48,
        ]);

        $s2 = Service::create([
            'name' => 'Cuci Setrika Ekspres 6 Jam',
            'category' => 'ekspres',
            'price' => 12000,
            'unit' => 'kg',
            'estimated_hours' => 6,
        ]);

        $s3 = Service::create([
            'name' => 'Dry Clean Jas & Gaun',
            'category' => 'satuan',
            'price' => 35000,
            'unit' => 'pcs',
            'estimated_hours' => 72,
        ]);

        $s4 = Service::create([
            'name' => 'Cuci Sepatu & Tas',
            'category' => 'sepatu_tas',
            'price' => 25000,
            'unit' => 'pasang',
            'estimated_hours' => 48,
        ]);

        Service::create([
            'name' => 'Cuci Bed Cover Besar',
            'category' => 'satuan',
            'price' => 30000,
            'unit' => 'pcs',
            'estimated_hours' => 48,
        ]);

        Service::create([
            'name' => 'Setrika Uap Saja',
            'category' => 'kiloan',
            'price' => 5000,
            'unit' => 'kg',
            'estimated_hours' => 24,
        ]);

        Promo::create([
            'code' => 'HEMAT20',
            'discount_type' => 'percent',
            'discount_value' => 20,
            'is_active' => true,
        ]);

        $c1 = Customer::create([
            'name' => 'Ibu Sarah A.',
            'whatsapp' => '081234567890',
            'address' => 'Jl. Gunawarman No. 12, Jaksel',
        ]);

        $c2 = Customer::create([
            'name' => 'Bapak Hendra',
            'whatsapp' => '081345678901',
            'address' => 'Jl. Suryo No. 8, Jaksel',
        ]);

        $c3 = Customer::create([
            'name' => 'Mba Rina',
            'whatsapp' => '081567890123',
            'address' => 'Jl. Wolter Monginsidi No. 22, Jaksel',
        ]);

        // Sample Order 1: LND-20261125-001 (Matches Prompt UI)
        $o1 = Order::create([
            'invoice_code' => 'LND-20261125-001',
            'branch_id' => $senopati->id,
            'customer_id' => $c1->id,
            'courier_id' => $kurir->id,
            'order_type' => 'pickup_delivery',
            'pickup_address' => $c1->address,
            'status' => 'disetrika',
            'subtotal' => 49500,
            'discount' => 0,
            'total' => 49500,
            'notes' => 'Pisahkan pakaian putih',
        ]);
        OrderItem::create(['order_id' => $o1->id, 'service_id' => $s1->id, 'quantity' => 3.5, 'unit_price' => 7000, 'subtotal' => 24500]);
        OrderItem::create(['order_id' => $o1->id, 'service_id' => $s4->id, 'quantity' => 1, 'unit_price' => 25000, 'subtotal' => 25000]);
        Payment::create([
            'order_id' => $o1->id,
            'method' => 'qris',
            'status' => 'lunas',
            'dp_amount' => 25000,
            'paid_amount' => 49500,
            'remaining_amount' => 0,
            'dp_paid_at' => now()->subHours(4),
            'paid_at' => now(),
        ]);

        // Sample Order 2 (DP 50% terlebih dahulu, sisa dibayar saat selesai)
        $o2 = Order::create([
            'invoice_code' => 'LND-20261125-002',
            'branch_id' => $senopati->id,
            'customer_id' => $c2->id,
            'order_type' => 'walk_in',
            'status' => 'dicuci',
            'subtotal' => 60000,
            'discount' => 0,
            'total' => 60000,
        ]);
        OrderItem::create(['order_id' => $o2->id, 'service_id' => $s2->id, 'quantity' => 5, 'unit_price' => 12000, 'subtotal' => 60000]);
        Payment::create([
            'order_id' => $o2->id,
            'method' => 'cash',
            'status' => 'dp',
            'dp_amount' => 30000,
            'paid_amount' => 30000,
            'remaining_amount' => 30000,
            'dp_paid_at' => now()->subHours(2),
        ]);

        // Sample Order 3 (Delivery saja, status siap_diantar, DP sudah masuk, menunggu pelunasan)
        $o3 = Order::create([
            'invoice_code' => 'LND-20261125-003',
            'branch_id' => $senopati->id,
            'customer_id' => $c3->id,
            'courier_id' => $kurir->id,
            'order_type' => 'delivery_only',
            'pickup_address' => $c3->address,
            'status' => 'siap_diantar',
            'subtotal' => 35000,
            'discount' => 0,
            'total' => 35000,
        ]);
        OrderItem::create(['order_id' => $o3->id, 'service_id' => $s3->id, 'quantity' => 1, 'unit_price' => 35000, 'subtotal' => 35000]);
        Payment::create([
            'order_id' => $o3->id,
            'method' => 'transfer',
            'status' => 'dp',
            'dp_amount' => 17500,
            'paid_amount' => 17500,
            'remaining_amount' => 17500,
            'dp_paid_at' => now()->subHours(6),
        ]);

        InventoryItem::create(['branch_id' => $senopati->id, 'name' => 'Deterjen Cair Premium', 'unit' => 'Liter', 'stock' => 4, 'min_stock' => 10]);
        InventoryItem::create(['branch_id' => $senopati->id, 'name' => 'Pewangi Sakura', 'unit' => 'Liter', 'stock' => 3, 'min_stock' => 8]);
        InventoryItem::create(['branch_id' => $senopati->id, 'name' => 'Plastik Packing 50x75', 'unit' => 'Roll', 'stock' => 2, 'min_stock' => 5]);
    }
}
