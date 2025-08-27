<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OwnerController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProcedureController;
use App\Http\Controllers\PublicVehicleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::prefix('public')->group(function () {
    Route::post('vehicles/search', [PublicVehicleController::class, 'search']);
    Route::get('vehicles/{licensePlate}', [PublicVehicleController::class, 'getByLicensePlate']);
    Route::get('vehicles/{licensePlate}/fees', [PublicVehicleController::class, 'calculateFees']);
    // Ajout de la route publique pour le reçu de paiement
    Route::get('payments/{id}/receipt', [PaymentController::class, 'getReceipt']);
});

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('profile', [AuthController::class, 'profile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // Vehicles
    Route::apiResource('vehicles', VehicleController::class);
    Route::post('vehicles/{id}/photos', [VehicleController::class, 'uploadPhotos']);
    Route::get('vehicles/{id}/qr-code', [VehicleController::class, 'getQrCode']);
    Route::get('vehicles/{vehicle}/storage-fee', [VehicleController::class, 'calculateStorageFee']);
    Route::get('vehicles/{vehicle}/payments', [VehicleController::class, 'getPayments']);

    // Owners
    Route::apiResource('owners', OwnerController::class);
    Route::get('owners/{id}/vehicles', [OwnerController::class, 'getVehicles']);

    // Procedures
    Route::apiResource('procedures', ProcedureController::class);
    Route::get('procedures/{id}/documents', [ProcedureController::class, 'getDocuments']);
    Route::post('procedures/{id}/documents', [ProcedureController::class, 'uploadDocuments']);
    Route::delete('procedures/{id}/documents/{docId}', [ProcedureController::class, 'deleteDocument']);

    // Payments
    Route::apiResource('payments', PaymentController::class);
    Route::get('payments/{id}/receipt', [PaymentController::class, 'getReceipt']);
    Route::post('payments/{id}/send-receipt', [PaymentController::class, 'sendReceiptByEmail']);
    Route::get('vehicles/{vehicle}/payments', [PaymentController::class, 'getVehiclePayments']);
    Route::post('vehicles/{vehicle}/payments', [PaymentController::class, 'createVehiclePayment']);

    // Admin Users
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('roles', [UserController::class, 'getRoles']);
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::get('notifications/{notification}', [NotificationController::class, 'show']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // Settings
    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);

    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'index']);
    Route::get('dashboard/vehicles-by-status', [DashboardController::class, 'vehiclesByStatus']);
    Route::get('dashboard/payments-by-month', [DashboardController::class, 'paymentsByMonth']);
    Route::get('dashboard/recent-activities', [DashboardController::class, 'recentActivities']);
});
