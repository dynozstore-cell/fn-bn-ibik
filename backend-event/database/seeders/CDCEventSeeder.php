<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\User;
use App\Models\Kategori;

class CDCEventSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'CDC@gmail.com')->first();
        if (!$user) {
            echo "User CDC@gmail.com tidak ditemukan.\n";
            return;
        }

        // Hapus data dummy lama jika ada
        Event::where('user_id', $user->id_user)->delete();

        $events = [
            [
                'nama_event' => "Career Fair IBIK 2026: Connect with Industry Leaders",
                'event_type' => 'offline',
                'kategori_id' => 3, 
                'deskripsi' => "Dapatkan peluang karir impian Anda melalui Career Fair terbesar tahun ini. Puluhan perusahaan terkemuka hadir untuk mencari talenta terbaik dari IBIK. Siapkan CV terbaik Anda dan ikuti sesi interview langsung!",
                'tanggal' => '2026-08-15',
                'lokasi' => "Gedung Serbaguna IBIK",
                'meeting_link' => null,
                'harga' => 0,
                'foto_event' => 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&q=80',
            ],
            [
                'nama_event' => "Seminar: Persiapan Memasuki Dunia Kerja & CV Clinic",
                'event_type' => 'online',
                'kategori_id' => 1, 
                'deskripsi' => "Bingung cara membuat CV yang menarik bagi recruiter? Ingin tahu tips sukses interview kerja? Seminar ini akan membedah tuntas strategi memenangkan persaingan di dunia kerja profesional.",
                'tanggal' => '2026-08-10',
                'lokasi' => null,
                'meeting_link' => "https://zoom.us/j/cdc-seminar-cv",
                'harga' => 25000,
                'foto_event' => 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
            ],
        ];

        foreach ($events as $data) {
            Event::create(array_merge($data, [
                'user_id' => $user->id_user,
                'metode_pembayaran' => ['Transfer Bank', 'Qris'],
                'detail_pembayaran' => "Transfer ke Rekening BNI 0987654321 a/n CDC IBIK.",
                'custom_form_schema' => [
                    ['label' => 'Nama Lengkap', 'type' => 'text', 'required' => true],
                    ['label' => 'NPM/NIM', 'type' => 'text', 'required' => true],
                ]
            ]));
        }

        echo "2 data dummy event CDC dengan FOTO REALISTIK berhasil dibuat.\n";
    }
}
