<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PendaftaranEvent;

class PendaftaranEventController extends Controller
{
    private function transformPendaftaran($daftar)
    {
        $daftar->nama_peserta = optional($daftar->user)->nama_lengkap;
        $daftar->email_peserta = optional($daftar->user)->email;
        $daftar->nama_event = optional($daftar->event)->nama_event;
        return $daftar;
    }

    public function index()
    {
        $data = PendaftaranEvent::with(['user', 'event', 'pembayaran'])->get()->map(function ($daftar) {
            return $this->transformPendaftaran($daftar);
        });

        return response()->json($data, 200);
    }

    public function show($id)
    {
        $daftar = PendaftaranEvent::with(['user', 'event', 'pembayaran'])->find($id);

        if (!$daftar) {
            return response()->json([
                'message' => 'Data pendaftaran tidak ditemukan'
            ], 404);
        }

        return response()->json($this->transformPendaftaran($daftar), 200);
    }

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
            'data' => $this->transformPendaftaran($daftar->load(['user', 'event', 'pembayaran']))
        ]);
    }

    public function update(Request $request, $id)
    {
        $daftar = PendaftaranEvent::find($id);
        if (!$daftar) {
            return response()->json([
                'message' => 'Data pendaftaran tidak ditemukan'
            ], 404);
        }

        $daftar->update([
            'status_pendaftaran' => $request->status_pendaftaran ?? $daftar->status_pendaftaran
        ]);

        return response()->json([
            'message' => 'Status pendaftaran berhasil diperbarui',
            'data' => $this->transformPendaftaran($daftar->load(['user', 'event', 'pembayaran']))
        ], 200);
    }

    public function destroy($id)
    {
        $daftar = PendaftaranEvent::find($id);
        if (!$daftar) {
            return response()->json([
                'message' => 'Data pendaftaran tidak ditemukan'
            ], 404);
        }

        $daftar->delete();
        return response()->json([
            'message' => 'Data pendaftaran berhasil dihapus'
        ], 200);
    }
}
