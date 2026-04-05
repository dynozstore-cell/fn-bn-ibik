<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendaftaranEvent extends Model
{
    use HasFactory;

    protected $table = 'pendaftaran_event';

    protected $fillable = [
        'user_id',
        'event_id',
        'tanggal_daftar',
        'status_pendaftaran'
    ];
}
