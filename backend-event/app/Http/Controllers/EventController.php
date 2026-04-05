<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;

class EventController extends Controller
{

    // READ semua data
    public function index()
    {
        return response()->json(Event::all(), 200);
    }

    // READ berdasarkan id
    public function show($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Event tidak ditemukan'
            ], 404);
        }

        return response()->json($event, 200);
    }

    // CREATE
    public function store(Request $request)
    {
        $namaFile = null;

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
            'foto_event' => $namaFile
        ]);

        return response()->json([
            'message' => 'Event berhasil ditambahkan',
            'data' => $event
        ], 201);
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'message' => 'Event tidak ditemukan'
            ], 404);
        }

        $namaFile = $event->foto_event;

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
            'foto_event' => $namaFile
        ]);

        return response()->json([
            'message' => 'Event berhasil diupdate',
            'data' => $event
        ], 200);
    }

    // DELETE
    public function destroy($id)
    {
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
