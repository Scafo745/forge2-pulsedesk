<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;

// Auth Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me']);

// Ticket Routes
Route::get('/tickets', [TicketController::class, 'index']);
Route::post('/tickets', [TicketController::class, 'store']);
Route::get('/tickets/{id}', [TicketController::class, 'show']);
Route::put('/tickets/{id}', [TicketController::class, 'update']);
Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);

// Comment Routes
Route::post('/tickets/{ticketId}/comments', [CommentController::class, 'store']);

// Dashboard Routes
Route::get('/dashboard', [DashboardController::class, 'stats']);

<<<<<<< HEAD
Route::get('/debug-env', function() {
    return response()->json([
        'db_connection' => env('DB_CONNECTION'),
        'db_host' => env('DB_HOST'),
        'db_database' => env('DB_DATABASE'),
        'getenv_db_connection' => getenv('DB_CONNECTION'),
        'getenv_db_host' => getenv('DB_HOST'),
        'has_env_file' => file_exists(base_path('.env')),
        'env_file_contents' => file_exists(base_path('.env')) ? file_get_contents(base_path('.env')) : null,
    ]);
});

=======
>>>>>>> 9f4eeb8 (Fix lint warnings, backend errors, and improve multi‑tenant validation)
