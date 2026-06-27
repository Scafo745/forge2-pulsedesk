<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.'
            ], 401);
        }

        Auth::login($user);

        return response()->json([
            'user' => $user->load('organization'),
            'message' => 'Logged in successfully.'
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    }

    public function me(Request $request)
    {
        $user = null;

        if ($request->hasHeader('X-User-Id')) {
            $user = User::find($request->header('X-User-Id'));
        } else {
            $user = Auth::user();
        }

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user' => $user->load('organization')
        ]);
    }
}
