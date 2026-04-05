<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
class AuthController extends Controller
{
   public function register(Request $request)
{
    $user = User::create([
        'nama_lengkap' => $request->nama_lengkap,
        'email' => $request->email,
        'no_hp' => $request->no_hp,
        'kategori_pendaftar' => $request->kategori_pendaftar,
        'password' => Hash::make($request->password)
    ]);

    return response()->json([
        'message' => 'Register berhasil',
        'data' => $user
    ]);
}

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if(!$user || !Hash::check($request->password, $user->password)){
            return response()->json([
                'message' => 'Email atau password salah'
            ],401);
        }

        return response()->json([
            'message' => 'Login berhasil',
            'data' => $user
        ]);
    }
}
