<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'event';
    protected $fillable = [
        'user_id',
        'nama_event',
        'kategori_id',
        'deskripsi',
        'tanggal',
        'lokasi',
        'harga',
        'foto_event',
        'custom_form_schema'
    ];

    protected $casts = [
        'custom_form_schema' => 'array',
    ];

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }

    public function penyelenggara()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_user');
    }
}
