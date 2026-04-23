<x-mail::message>
# Halo, {{ $nama }}!

Terima kasih telah menghubungi kami. Berikut adalah balasan dari tim admin kami mengenai pesan Anda:

<x-mail::panel>
**Balasan Admin:**
{{ $balasan }}
</x-mail::panel>

---

### Informasi Pesan Asli Anda:
**Subjek:** {{ $data['subjek'] }}
**Pesan:**
{{ $pesan_asli }}

<x-mail::button :url="config('app.url')" color="primary">
Kunjungi Website Kami
</x-mail::button>

Terima kasih,<br>
**Tim Administrasi {{ config('app.name') }}**
</x-mail::message>
