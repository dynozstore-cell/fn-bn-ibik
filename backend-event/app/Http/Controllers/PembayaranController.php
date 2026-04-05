<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
class PembayaranController extends Controller
{

public function verifikasi(Request $request, $id)
{
    $pembayaran = Pembayaran::find($id);

    if(!$pembayaran){
        return response()->json([
            'message' => 'Data pembayaran tidak ditemukan'
        ],404);
    }

    $pembayaran->status_pembayaran = $request->status_pembayaran;
    $pembayaran->save();

    return response()->json([
        'message' => 'Status pembayaran berhasil diperbarui',
        'data' => $pembayaran
    ]);
}
    // melihat semua pembayaran
    public function index()
    {
        return response()->json(Pembayaran::all());
    }

    // membuat pembayaran
    public function store(Request $request)
    {
        $buktiPath = null;

        // cek apakah ada file bukti pembayaran
        if ($request->hasFile('bukti_pembayaran')) {

            $file = $request->file('bukti_pembayaran');

            $filename = time().'_'.$file->getClientOriginalName();

            // simpan ke storage
            $buktiPath = $file->storeAs('bukti_pembayaran', $filename, 'public');
        }


        $pembayaran = Pembayaran::create([
            'pendaftaran_id' => $request->pendaftaran_id,
            'jumlah_bayar' => $request->jumlah_bayar,
            'metode_pembayaran_id' => $request->metode_pembayaran_id,
            'bukti_pembayaran' => $buktiPath,
            'status_pembayaran' => 'pending'
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil dibuat',
            'data' => $pembayaran
        ]);
    }

    // melihat pembayaran berdasarkan id
    public function show($id)
    {
        $pembayaran = Pembayaran::find($id);

        if(!$pembayaran){
            return response()->json([
                'message' => 'Data tidak ditemukan'
            ],404);
        }

        return response()->json($pembayaran);
    }
}
