<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    use HasFactory;
    protected $table = 'pembayaran';

    protected $fillable = [
        'pendaftaran_id',
        'jumlah_bayar',
        'metode_pembayaran_id',
        'bukti_pembayaran',
        'status_pembayaran'
    ];
}
