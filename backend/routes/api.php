<?php

use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Api\PublicController;
use Illuminate\Support\Facades\Route;

// Public & Customer routes
Route::get('/services', [PublicController::class, 'services']);
Route::get('/promos/validate', [PublicController::class, 'validatePromo']);
Route::get('/orders/track/{invoiceCode}', [PublicController::class, 'trackOrder']);
Route::post('/orders', [PublicController::class, 'storeOrder']);

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/me', [AuthController::class, 'me']);
Route::post('/logout', [AuthController::class, 'logout']);

// Admin Kasir & Order Board routes
Route::prefix('admin')->group(function () {
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::post('/pos/orders', [AdminOrderController::class, 'storePosOrder']);
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/payment', [AdminOrderController::class, 'updatePayment']);
    Route::get('/customers', [AdminOrderController::class, 'customers']);
    Route::post('/customers', [AdminOrderController::class, 'storeCustomer']);
    Route::get('/couriers', [AdminOrderController::class, 'couriers']);
    Route::patch('/orders/{order}/courier', [AdminOrderController::class, 'assignCourier']);
});

// Owner Analytics & Inventory routes
Route::prefix('owner')->group(function () {
    Route::get('/analytics', [OwnerController::class, 'analytics']);
    Route::get('/inventory', [OwnerController::class, 'inventory']);
    Route::patch('/inventory/{inventoryItem}', [OwnerController::class, 'updateInventory']);
});
