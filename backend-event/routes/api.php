<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PendaftaranEventController;
use App\Http\Controllers\KontakEventController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\MetodePembayaranController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\BeritaController;
use App\Http\Controllers\KategoriBeritaController;
use App\Http\Controllers\OTPController;
use App\Http\Controllers\AdminDashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Auth Routes (Public) ──────────────────────────────────────────────────
Route::post('/register',         [AuthController::class, 'register']);
Route::post('/login',            [AuthController::class, 'login']);
Route::post('/forgot-password',  [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',   [AuthController::class, 'resetPassword']);

// OTP Routes
Route::post('/otp/verify',  [OTPController::class, 'verify']);
Route::post('/otp/resend',  [OTPController::class, 'resend']);

// ─── Auth Routes (Protected) ───────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/me',       [AuthController::class, 'me']);
    
    // Admin Dashboard
    Route::get('/admin/dashboard-stats', [AdminDashboardController::class, 'index']);
});

// ─── Event Routes ──────────────────────────────────────────────────────────
Route::get('/event',       [EventController::class, 'index']);
Route::get('/event/{id}',  [EventController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/event',          [EventController::class, 'store']);
    Route::put('/event/{id}',      [EventController::class, 'update']);
    Route::delete('/event/{id}',   [EventController::class, 'destroy']);
});

// ─── Pendaftaran Event Routes ──────────────────────────────────────────────
Route::post('/daftar-event',        [PendaftaranEventController::class, 'store']);
Route::get('/daftar-event',         [PendaftaranEventController::class, 'index']);
Route::get('/daftar-event/{id}',    [PendaftaranEventController::class, 'show']);
Route::put('/daftar-event/{id}',    [PendaftaranEventController::class, 'update']);
Route::delete('/daftar-event/{id}', [PendaftaranEventController::class, 'destroy']);

// ─── Kontak Event Routes ───────────────────────────────────────────────────
Route::post('/kontak-event',       [KontakEventController::class, 'store']);
Route::get('/kontak-event',        [KontakEventController::class, 'index']);
Route::put('/kontak-event/{id}',   [KontakEventController::class, 'update']);

// ─── Pembayaran Routes ─────────────────────────────────────────────────────
Route::get('/pembayaran',                    [PembayaranController::class, 'index']);
Route::post('/pembayaran',                   [PembayaranController::class, 'store']);
Route::get('/pembayaran/{id}',               [PembayaranController::class, 'show']);
Route::put('/pembayaran/{id}/verifikasi',    [PembayaranController::class, 'verifikasi']);

// ─── Metode Pembayaran Routes ──────────────────────────────────────────────
Route::get('/metode-pembayaran',       [MetodePembayaranController::class, 'index']);
Route::post('/metode-pembayaran',      [MetodePembayaranController::class, 'store']);
Route::get('/metode-pembayaran/{id}',  [MetodePembayaranController::class, 'show']);

// ─── Kategori Routes ───────────────────────────────────────────────────────
Route::get('/kategori', [KategoriController::class, 'index']);

// ─── Berita Routes ─────────────────────────────────────────────────────────
Route::get('/berita', [BeritaController::class, 'index']);
Route::get('/berita/{id}', [BeritaController::class, 'show']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/berita', [BeritaController::class, 'store']);
    Route::put('/berita/{id}', [BeritaController::class, 'update']);
    Route::delete('/berita/{id}', [BeritaController::class, 'destroy']);
});

// ─── Kategori Berita Routes ────────────────────────────────────────────────
Route::get('/kategori-berita', [KategoriBeritaController::class, 'index']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/kategori-berita', [KategoriBeritaController::class, 'store']);
    Route::put('/kategori-berita/{id}', [KategoriBeritaController::class, 'update']);
    Route::delete('/kategori-berita/{id}', [KategoriBeritaController::class, 'destroy']);
});
