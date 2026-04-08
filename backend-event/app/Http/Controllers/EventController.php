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
        return $event;
    }

    // READ semua data
    public function index()
    {
        $events = Event::with('kategori')->get()->map(function ($event) {
            return $this->transformEvent($event);
        });
        return response()->json($events, 200);
    }

    // READ berdasarkan id
    public function show($id)
    {
        $event = Event::with('kategori')->find($id);

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
        if (!$user || $user->role !== 'admin') {
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
            'nama_event' => $request->nama_event,
            'kategori_id' => $request->kategori_id,
            'deskripsi' => $request->deskripsi,
            'tanggal' => $request->tanggal,
            'lokasi' => $request->lokasi,
            'harga' => $request->harga ?? 0,
            'foto_event' => $namaFile
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
        if (!$user || $user->role !== 'admin') {
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
            'foto_event' => $namaFile
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
        if (!$user || $user->role !== 'admin') {
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

        $event->delete();

        return response()->json([
            'message' => 'Event berhasil dihapus'
        ], 200);
    }
}
