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
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/event', [EventController::class, 'index']);
Route::get('/event/{id}', [EventController::class, 'show']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/event', [EventController::class, 'store']);
    Route::put('/event/{id}', [EventController::class, 'update']);
    Route::delete('/event/{id}', [EventController::class, 'destroy']);
});

Route::post('/daftar-event', [PendaftaranEventController::class, 'store']);
Route::get('/daftar-event', [PendaftaranEventController::class, 'index']);
Route::get('/daftar-event/{id}', [PendaftaranEventController::class, 'show']);
Route::put('/daftar-event/{id}', [PendaftaranEventController::class, 'update']);
Route::delete('/daftar-event/{id}', [PendaftaranEventController::class, 'destroy']);

Route::post('/kontak-event',[KontakEventController::class,'store']);
Route::get('/kontak-event',[KontakEventController::class,'index']);
Route::put('/kontak-event/{id}',[KontakEventController::class,'update']);

Route::get('/pembayaran', [PembayaranController::class, 'index']);
Route::post('/pembayaran', [PembayaranController::class, 'store']);
Route::get('/pembayaran/{id}', [PembayaranController::class, 'show']);
Route::put('/pembayaran/{id}/verifikasi', [PembayaranController::class, 'verifikasi']);

Route::get('/metode-pembayaran', [MetodePembayaranController::class, 'index']);
Route::post('/metode-pembayaran', [MetodePembayaranController::class, 'store']);
Route::get('/metode-pembayaran/{id}', [MetodePembayaranController::class, 'show']);

Route::get('/kategori', [KategoriController::class, 'index']);
