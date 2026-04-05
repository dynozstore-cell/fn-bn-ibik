<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KontakEvent;

class KontakEventController extends Controller
{
     // kirim pengajuan event (tanpa login)
    public function store(Request $request)
    {
        $kontak = KontakEvent::create([
            'nama' => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
            'judul_event' => $request->judul_event,
            'deskripsi_event' => $request->deskripsi_event,
            'pesan' => $request->pesan,
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Pengajuan event berhasil dikirim',
            'data' => $kontak
        ],201);
    }

    // admin melihat semua pengajuan
    public function index()
    {
        return response()->json(KontakEvent::all(),200);
    }

    // admin update status
    public function update(Request $request, $id)
    {
       $kontak = KontakEvent::find($id);

    if(!$kontak){
        return response()->json([
            'message' => 'Data tidak ditemukan'
        ],404);
    }

    $kontak->update([
        'nama' => $request->nama,
        'email' => $request->email,
        'no_hp' => $request->no_hp,
        'judul_event' => $request->judul_event,
        'deskripsi_event' => $request->deskripsi_event,
        'pesan' => $request->pesan,
        'status' => $request->status
    ]);

    return response()->json([
        'message' => 'Data berhasil diupdate',
        'data' => $kontak
    ],200);
}
}
