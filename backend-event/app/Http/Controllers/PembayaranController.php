<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;

class PembayaranController extends Controller
{
    private function transformPembayaran($pembayaran)
    {
        $pendaftaran = $pembayaran->pendaftaran;
        $user = optional($pendaftaran)->user;
        $event = optional($pendaftaran)->event;

        $pembayaran->nama_peserta = optional($user)->nama_lengkap;
        $pembayaran->email_peserta = optional($user)->email;
        $pembayaran->nama_event = optional($event)->nama_event;
        $pembayaran->metode_pembayaran = optional($pembayaran->metodePembayaran)->nama_metode;
        if ($pembayaran->bukti_pembayaran) {
            $req = request();
            $base = rtrim($req->getSchemeAndHttpHost() . $req->getBasePath(), '/');
            $path = str_replace('\\', '/', ltrim($pembayaran->bukti_pembayaran, '/'));
            $pembayaran->bukti_pembayaran_url = $base . '/storage/' . $path;
        } else {
            $pembayaran->bukti_pembayaran_url = null;
        }

        return $pembayaran;
    }

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
            'data' => $this->transformPembayaran($pembayaran->load(['pendaftaran.user', 'pendaftaran.event', 'metodePembayaran']))
        ]);
    }

    // melihat semua pembayaran
    public function index()
    {
        $data = Pembayaran::with(['pendaftaran.user', 'pendaftaran.event', 'metodePembayaran'])->get()->map(function ($pembayaran) {
            return $this->transformPembayaran($pembayaran);
        });
        return response()->json($data);
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
            'data' => $this->transformPembayaran($pembayaran->load(['pendaftaran.user', 'pendaftaran.event', 'metodePembayaran']))
        ]);
    }

    // melihat pembayaran berdasarkan id
    public function show($id)
    {
        $pembayaran = Pembayaran::with(['pendaftaran.user', 'pendaftaran.event', 'metodePembayaran'])->find($id);

        if(!$pembayaran){
            return response()->json([
                'message' => 'Data tidak ditemukan'
            ],404);
        }

        return response()->json($this->transformPembayaran($pembayaran));
    }
}
