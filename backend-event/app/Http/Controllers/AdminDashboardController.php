<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\User;
use App\Models\PendaftaranEvent;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Total Event
        $totalEvent = Event::count();

        // 2. Total User
        $totalUser = User::count();

        // 3. Total Penyelenggara
        $totalPenyelenggara = User::where('role', 'penyelenggara')->count();

        // 4. Total Peserta
        $totalPeserta = User::where('role', 'peserta')->count();

        // 5. Grafik Kegiatan per Bulan
        $eventsPerMonth = Event::select(
            DB::raw('DATE_FORMAT(tanggal, "%Y-%m") as periode'),
            DB::raw('COUNT(*) as total_kegiatan')
        )
        ->groupBy('periode')
        ->orderBy('periode', 'asc')
        ->get();

        $formattedEvents = $eventsPerMonth->map(function ($item) {
            return [
                'name' => Carbon::parse($item->periode . '-01')->format('M Y'),
                'total' => $item->total_kegiatan
            ];
        });

        // 6. Grafik Peserta per Bulan
        $participantsPerMonth = PendaftaranEvent::select(
            DB::raw('DATE_FORMAT(tanggal_daftar, "%Y-%m") as periode'),
            DB::raw('COUNT(*) as total_peserta')
        )
        ->groupBy('periode')
        ->orderBy('periode', 'asc')
        ->get();

        $formattedParticipants = $participantsPerMonth->map(function ($item) {
            return [
                'name' => Carbon::parse($item->periode . '-01')->format('M Y'),
                'total' => $item->total_peserta
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_event' => $totalEvent,
                'total_user' => $totalUser,
                'total_penyelenggara' => $totalPenyelenggara,
                'total_peserta' => $totalPeserta,
                'events_per_month' => $formattedEvents,
                'participants_per_month' => $formattedParticipants
            ]
        ], 200);
    }
}
