<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'no_hp' => ['required', 'string', 'max:25'],
            'kategori_pendaftar' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $validated['email'] = strtolower(trim($validated['email']));
        $validated['password'] = Hash::make($validated['password']);
        $validated['role'] = 'user';

        $user = User::create($validated);

        return response()->json([
            'message' => 'Register berhasil',
            'data' => $user
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($validated['email']));
        $password = $validated['password'];
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'data' => $user,
            'token' => $token,
        ]);
    }
}
