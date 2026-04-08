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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_user');
    }

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function pembayaran()
    {
        return $this->hasMany(Pembayaran::class, 'pendaftaran_id');
    }
}
