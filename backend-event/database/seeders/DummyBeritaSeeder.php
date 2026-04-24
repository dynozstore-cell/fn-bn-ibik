<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Berita;
use App\Models\KategoriBerita;

class DummyBeritaSeeder extends Seeder
{
    public function run(): void
    {
        // Hapus berita lama jika ada
        Berita::truncate();

        $news = [
            [
                'judul' => "Tren AI 2026: Apa yang Harus Dipersiapkan Penyelenggara Event?",
                'kategori_id' => 1, // Technology
                'sumber' => 'KESAVENT Insights',
                'ringkasan' => "Kecerdasan buatan (AI) terus mengubah cara kita menyelenggarakan event. Dari chatbot hingga analisis data peserta.",
                'konten' => "Di tahun 2026, AI bukan lagi sekadar tren, melainkan kebutuhan. Penyelenggara event yang cerdas mulai menggunakan AI untuk mempersonalisasi pengalaman peserta, mengotomatiskan pendaftaran, hingga memberikan rekomendasi sesi yang relevan berdasarkan minat masing-masing individu. Artikel ini membahas langkah-langkah praktis untuk mulai mengadopsi AI dalam operasional event Anda.",
                'gambar' => 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
                'tanggal' => now()->subDays(2)->format('Y-m-d'),
            ],
            [
                'judul' => "Tips Mengelola Budget Event Agar Tetap Hemat namun Berkelas",
                'kategori_id' => 2, // Tips & Tricks
                'sumber' => 'KESAVENT Tips',
                'ringkasan' => "Mengelola anggaran adalah tantangan terbesar bagi setiap event organizer. Simak tips jitu dari para profesional.",
                'konten' => "Banyak yang beranggapan bahwa event yang bagus harus mahal. Padahal, dengan perencanaan yang matang dan negosiasi yang tepat dengan vendor, Anda bisa menyelenggarakan event berkualitas tanpa harus menguras kantong. Pelajari cara melakukan prioritas pengeluaran, mencari sponsor yang tepat, dan memanfaatkan platform digital seperti KESAVENT untuk menekan biaya promosi.",
                'gambar' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
                'tanggal' => now()->subDays(5)->format('Y-m-d'),
            ],
            [
                'judul' => "Kisah Sukses: Bagaimana KESAVENT Membantu UMKM Go Digital",
                'kategori_id' => 3, // Inspirasi
                'sumber' => 'KESAVENT Stories',
                'ringkasan' => "Cerita inspiratif dari pemilik UMKM yang berhasil memperluas jangkauan pasarnya melalui event-event digital.",
                'konten' => "Ibu Sari, seorang pengrajin batik, awalnya kesulitan memasarkan produknya di luar kota. Namun, setelah rutin mengikuti dan menyelenggarakan workshop membatik online melalui platform KESAVENT, kini produknya dikenal hingga ke mancanegara. Keberhasilan ini membuktikan bahwa teknologi jika digunakan dengan benar dapat menjadi pengungkit ekonomi yang luar biasa bagi pelaku UMKM.",
                'gambar' => 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
                'tanggal' => now()->subDays(10)->format('Y-m-d'),
            ],
            [
                'judul' => "Analisis Pasar Event di Indonesia Pasca Pandemi",
                'kategori_id' => 4, // Analysis
                'sumber' => 'Market Reports',
                'ringkasan' => "Laporan mendalam mengenai perubahan perilaku konsumen dan permintaan pasar event di Indonesia.",
                'konten' => "Pasca pandemi, terjadi pergeseran signifikan dalam cara orang mengonsumsi konten event. Meskipun event offline kembali marak, model hybrid tetap menjadi pilihan favorit karena fleksibilitasnya. Laporan ini menganalisis data pertumbuhan industri event di kota-kota besar Indonesia dan memprediksi jenis event apa yang akan paling diminati dalam dua tahun ke depan.",
                'gambar' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
                'tanggal' => now()->subDays(15)->format('Y-m-d'),
            ],
            [
                'judul' => "Peluang Bisnis Event Organizer di Era Digital",
                'kategori_id' => 5, // Business
                'sumber' => 'Entrepreneur Hub',
                'ringkasan' => "Mengapa sekarang adalah waktu yang tepat untuk memulai bisnis EO berbasis platform digital.",
                'konten' => "Dengan kemudahan akses platform manajemen event, hambatan masuk ke industri EO menjadi lebih rendah. Namun, persaingan semakin ketat. Kunci sukses di era ini adalah spesialisasi dan penguasaan alat digital. Artikel ini membedah model bisnis EO masa depan yang lebih efisien dan berorientasi pada data.",
                'gambar' => 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
                'tanggal' => now()->subDays(20)->format('Y-m-d'),
            ],
            [
                'judul' => "5 Cara Meningkatkan Engagement Peserta Webinar",
                'kategori_id' => 2, // Tips & Tricks
                'sumber' => 'KESAVENT Academy',
                'ringkasan' => "Webinar yang membosankan adalah musuh utama. Gunakan teknik-teknik ini agar peserta tetap antusias.",
                'konten' => "Banyak penyelenggara mengeluh peserta webinar mereka sering meninggalkan sesi sebelum selesai. Masalah utamanya adalah kurangnya interaksi. Gunakan fitur polling, tanya jawab langsung, gamifikasi, dan break-out rooms untuk membuat peserta merasa dilibatkan. Simak ulasan lengkap mengenai tools pendukung yang bisa Anda gunakan secara gratis.",
                'gambar' => 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&q=80',
                'tanggal' => now()->subDays(25)->format('Y-m-d'),
            ],
        ];

        foreach ($news as $data) {
            Berita::create($data);
        }

        echo "6 data dummy berita berhasil dibuat.\n";
    }
}
