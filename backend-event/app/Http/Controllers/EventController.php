<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
{
    private function transformEvent($event)
    {
        $event->foto_event_url = $event->foto_event ? url('event/' . $event->foto_event) : null;
        $event->category = optional($event->kategori)->nama_kategori ?? 'Tanpa Kategori';
        $event->penyelenggara_name = optional($event->penyelenggara)->nama_lengkap ?? 'Admin';
        return $event;
    }

    // READ semua data
    public function index()
    {
        $user = Auth::guard('sanctum')->user();
        $query = Event::with(['kategori', 'penyelenggara']);

        // Jika request membawa token dan rolenya penyelenggara, kembalikan hanya event miliknya
        if ($user && $user->role === 'penyelenggara') {
            $query->where('user_id', $user->id_user);
        }

        $events = $query->get()->map(function ($event) {
            return $this->transformEvent($event);
        });
        return response()->json($events, 200);
    }

    // READ berdasarkan id
    public function show($id)
    {
        $event = Event::with(['kategori', 'penyelenggara'])->find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Event tidak ditemukan'
            ], 404);
        }

        return response()->json($this->transformEvent($event), 200);
    }

    // CREATE
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'penyelenggara'])) {
            return response()->json([
                'message' => 'Akses ditolak'
            ], 403);
        }

        $namaFile = 'default-event.jpg';

        if ($request->hasFile('foto_event')) {
            $file = $request->file('foto_event');
            $namaFile = time().'.'.$file->getClientOriginalExtension();
            $file->move(public_path('event'), $namaFile);
        }

        $event = Event::create([
            'user_id' => $user->id_user,
            'nama_event' => $request->nama_event,
            'kategori_id' => $request->kategori_id,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'lokasi' => $request->lokasi,
            'harga' => $request->harga ?? 0,
            'foto_event' => $namaFile,
            'custom_form_schema' => $request->custom_form_schema
        ]);

        return response()->json([
            'message' => 'Event berhasil ditambahkan',
            'data' => $this->transformEvent($event->load('kategori'))
        ], 201);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'penyelenggara'])) {
            return response()->json([
                'message' => 'Akses ditolak'
            ], 403);
        }

        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Event tidak ditemukan'
            ], 404);
        }

        if ($user->role === 'penyelenggara' && $event->user_id !== $user->id_user) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk mengubah event ini'
            ], 403);
        }

        $namaFile = $event->foto_event ?: 'default-event.jpg';

        if ($request->hasFile('foto_event')) {
            $file = $request->file('foto_event');
            $namaFile = time().'.'.$file->getClientOriginalExtension();
            $file->move(public_path('event'), $namaFile);
        }

        $event->update([
            'nama_event' => $request->nama_event,
            'kategori_id' => $request->kategori_id,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'lokasi' => $request->lokasi,
            'harga' => $request->harga ?? $event->harga,
            'foto_event' => $namaFile,
            'custom_form_schema' => $request->custom_form_schema ?? $event->custom_form_schema
        ]);

        return response()->json([
            'message' => 'Event berhasil diupdate',
            'data' => $this->transformEvent($event->load('kategori'))
        ], 200);
    }

    // DELETE
    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'penyelenggara'])) {
            return response()->json([
                'message' => 'Akses ditolak'
            ], 403);
        }

        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Event tidak ditemukan'
            ], 404);
        }

        if ($user->role === 'penyelenggara' && $event->user_id !== $user->id_user) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses untuk menghapus event ini'
            ], 403);
        }

        $event->delete();

        return response()->json([
            'message' => 'Event berhasil dihapus'
        ], 200);
    }
}
