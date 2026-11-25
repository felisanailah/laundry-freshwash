<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PromoController extends Controller
{
    // List semua promo untuk manajemen Owner
    public function index()
    {
        $promos = Promo::orderBy('id', 'desc')->get();
        return response()->json($promos);
    }

    // List promo aktif untuk ditampilkan ke customer / kasir
    public function active()
    {
        $promos = Promo::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($promos);
    }

    // Owner membuat promo baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:promos,code'],
            'discount_type' => ['required', Rule::in(['percent', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $promo = Promo::create([
            'code' => strtoupper(trim($validated['code'])),
            'discount_type' => $validated['discount_type'],
            'discount_value' => $validated['discount_value'],
            'expires_at' => $validated['expires_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => "Kode promo {$promo->code} berhasil dibuat!",
            'promo' => $promo,
        ], 201);
    }

    // Owner toggle status aktif/nonaktif promo
    public function toggle(Promo $promo)
    {
        $promo->is_active = !$promo->is_active;
        $promo->save();

        return response()->json([
            'message' => "Status promo {$promo->code} berhasil diubah.",
            'promo' => $promo,
        ]);
    }

    // Owner menghapus promo
    public function destroy(Promo $promo)
    {
        $code = $promo->code;
        $promo->delete();

        return response()->json([
            'message' => "Kode promo {$code} berhasil dihapus.",
        ]);
    }
}
