<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PendaftaranEvent;

class PendaftaranEventController extends Controller
{
    public function store(Request $request)
{
    $daftar = PendaftaranEvent::create([
        'user_id' => $request->user_id,
        'event_id' => $request->event_id,
        'tanggal_daftar' => now(),
        'status_pendaftaran' => 'pending'
    ]);

    return response()->json([
        'message' => 'Berhasil daftar event',
        'data' => $daftar
    ]);
}
}
