<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'event';
    protected $fillable = [
    'nama_event',
    'kategori_id',
    'deskripsi',
    'tanggal',
    'lokasi',
    'foto_event'
];
}
