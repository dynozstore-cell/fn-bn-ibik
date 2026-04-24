<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;
use App\Models\User;
use App\Models\Kategori;

class DummyEventSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'gisnawina8@gmail.com')->first();
        if (!$user) {
            echo "User gisnawina8@gmail.com tidak ditemukan.\n";
            return;
        }

        // Hapus data dummy lama jika ada
        Event::where('user_id', $user->id_user)->delete();

        $events = [
            [
                'nama_event' => "Seminar Nasional: Masa Depan AI di Industri 5.0",
                'event_type' => 'online',
                'kategori_id' => 1, 
                'deskripsi' => "Bergabunglah dengan para ahli teknologi untuk membahas bagaimana AI akan mengubah lanskap industri di masa depan. Kita akan membahas etika AI, otomasi, dan kolaborasi manusia-mesin.",
                'tanggal' => '2026-05-10',
                'lokasi' => null,
                'meeting_link' => "https://zoom.us/j/ai-seminar-2026",
                'harga' => 50000,
                'foto_event' => 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
            ],
            [
                'nama_event' => "IBIK UI/UX Design Challenge 2026",
                'event_type' => 'offline',
                'kategori_id' => 2, 
                'deskripsi' => "Tunjukkan kreativitas Anda dalam mendesain solusi digital yang inovatif. Kompetisi ini terbuka untuk seluruh mahasiswa Indonesia dengan total hadiah jutaan rupiah.",
                'tanggal' => '2026-06-15',
                'lokasi' => "Auditorium IBIK, Lantai 3",
                'meeting_link' => null,
                'harga' => 75000,
                'foto_event' => 'https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=800&q=80',
            ],
            [
                'nama_event' => "Festival Budaya Nusantara: Dies Natalis IBIK",
                'event_type' => 'offline',
                'kategori_id' => 3, 
                'deskripsi' => "Merayakan keberagaman budaya Indonesia dalam rangka hari jadi IBIK yang ke-20. Menampilkan pertunjukan seni, pameran kuliner, dan parade kostum daerah.",
                'tanggal' => '2026-07-20',
                'lokasi' => "Lapangan Utama Kampus IBIK",
                'meeting_link' => null,
                'harga' => 0,
                'foto_event' => 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
            ],
            [
                'nama_event' => "Workshop: Membangun Aplikasi Enterprise dengan Laravel",
                'event_type' => 'offline',
                'kategori_id' => 4, 
                'deskripsi' => "Pelajari praktik terbaik dalam membangun aplikasi skala besar menggunakan framework Laravel. Topik mencakup arsitektur, testing, dan optimasi database.",
                'tanggal' => '2026-05-25',
                'lokasi' => "Lab Komputer B, Gedung Teknik",
                'meeting_link' => null,
                'harga' => 150000,
                'foto_event' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
            ],
            [
                'nama_event' => "Webinar: Keamanan Siber untuk Pemula",
                'event_type' => 'online',
                'kategori_id' => 1, 
                'deskripsi' => "Lindungi data pribadi Anda di dunia digital. Webinar ini akan membahas langkah-langkah dasar untuk menjaga keamanan akun dan menghindari penipuan online.",
                'tanggal' => '2026-05-05',
                'lokasi' => null,
                'meeting_link' => "https://meet.google.com/cyb-sec-webinar",
                'harga' => 0,
                'foto_event' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
            ],
            [
                'nama_event' => "Workshop: Riset UI/UX dan Pembuatan Persona",
                'event_type' => 'online',
                'kategori_id' => 4, 
                'deskripsi' => "Langkah pertama dalam desain yang baik adalah memahami pengguna. Pelajari teknik riset kualitatif dan cara membuat user persona yang efektif untuk produk Anda.",
                'tanggal' => '2026-06-02',
                'lokasi' => null,
                'meeting_link' => "https://zoom.us/j/ux-research-workshop",
                'harga' => 100000,
                'foto_event' => 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
            ],
            [
                'nama_event' => "Talkshow: Sukses Berkarir di Startup Unicorn",
                'event_type' => 'online',
                'kategori_id' => 1, 
                'deskripsi' => "Mendengarkan pengalaman langsung dari para profesional di startup ternama Indonesia.",
                'tanggal' => '2026-03-15',
                'lokasi' => null,
                'meeting_link' => "https://meet.google.com/startup-talk",
                'harga' => 0,
                'foto_event' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
            ],
            [
                'nama_event' => "Seminar: Literasi Keuangan di Era Digital",
                'event_type' => 'offline',
                'kategori_id' => 2, 
                'deskripsi' => "Mengelola keuangan pribadi dengan bijak menggunakan instrumen investasi modern.",
                'tanggal' => '2026-04-05',
                'lokasi' => "Gedung Aula IBIK",
                'meeting_link' => null,
                'harga' => 25000,
                'foto_event' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
            ],
        ];

        foreach ($events as $data) {
            Event::create(array_merge($data, [
                'user_id' => $user->id_user,
                'metode_pembayaran' => ['Transfer Bank', 'Qris'],
                'detail_pembayaran' => "Transfer ke Rekening Mandiri 1330022334455 a/n Yayasan IBIK.",
                'custom_form_schema' => [
                    ['label' => 'Nama Lengkap', 'type' => 'text', 'required' => true],
                    ['label' => 'Instansi/Jurusan', 'type' => 'text', 'required' => true],
                ]
            ]));
        }

        echo "6 data dummy event dengan FOTO REALISTIK berhasil dibuat untuk gisnawina8@gmail.com.\n";
    }
}
