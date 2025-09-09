<?php

namespace App\Http\Controllers;

use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use App\Enums\VehicleStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PublicVehicleController extends Controller
{
    /**
     * Update vehicle status by ID.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */

    public function publicUpdate(Request $request, $id)
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) {
            return response()->json(['message' => 'Véhicule non trouvé'], 404);
        }

        $status = $request->input('status', 'claimed');
        if (!in_array($status, [
            VehicleStatus::IMPOUNDED->value,
            VehicleStatus::CLAIMED->value,
            VehicleStatus::SOLD->value,
            VehicleStatus::DESTROYED->value,
            VehicleStatus::PENDING_DESTRUCTION->value,
        ])) {
            return response()->json(['message' => 'Statut de véhicule invalide', 'status_recu' => $status], 400);
        }

        $vehicle->status = $status;
        $vehicle->save();

        Log::info('Statut du véhicule mis à jour publiquement', [
            'vehicle_id' => $vehicle->id,
            'new_status' => $vehicle->status,
        ]);

        return response()->json(['message' => 'Statut du véhicule mis à jour', 'vehicle' => $vehicle]);
    }

    /**
     * Search for a vehicle by license plate.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \App\Http\Resources\VehicleResource|\Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $request->validate([
            'license_plate' => 'required|string|min:3',
        ]);

        $licensePlate = $request->input('license_plate');

        $vehicle = Vehicle::where('license_plate', 'like', "%{$licensePlate}%")
                          ->with('owner')
                          ->first();

        if (!$vehicle) {
            return response()->json([
                'message' => 'Aucun véhicule trouvé avec cette plaque d\'immatriculation',
            ], 404);
        }

        return new VehicleResource($vehicle);
    }

    
    /**
     * Update vehicle status by license plate.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $licensePlate
     * @return \Illuminate\Http\JsonResponse
     */
    public function publicUpdateByPlate(Request $request, $licensePlate)
    {
        $vehicle = Vehicle::where('license_plate', $licensePlate)->first();
        if (!$vehicle) {
            return response()->json(['message' => 'Véhicule non trouvé'], 404);
        }

        $status = $request->input('status', 'claimed');
        Log::info('Valeur reçue pour status dans publicUpdate', ['status' => $status]);

        if (!in_array($status, [
            VehicleStatus::IMPOUNDED->value,
            VehicleStatus::CLAIMED->value,
            VehicleStatus::SOLD->value,
            VehicleStatus::DESTROYED->value,
            VehicleStatus::PENDING_DESTRUCTION->value,
        ])) {
            return response()->json(['message' => 'Statut de véhicule invalide', 'status_recu' => $status], 400);
        }

        $vehicle->status = $status;
        if ($request->has('description')) {
            $vehicle->description = $request->input('description');
        }
        $vehicle->save();

        Log::info('Statut du véhicule mis à jour publiquement par plaque', [
            'vehicle_id' => $vehicle->id,
            'license_plate' => $licensePlate,
            'new_status' => $vehicle->status,
        ]);

        return response()->json(['message' => 'Statut du véhicule mis à jour', 'vehicle' => $vehicle]);
    }

    /**
     * Get vehicle details by license plate.
     *
     * @param  string  $licensePlate
     * @return \App\Http\Resources\VehicleResource|\Illuminate\Http\JsonResponse
     */
    public function getByLicensePlate($licensePlate)
    {
        $vehicle = Vehicle::where('license_plate', $licensePlate)
                          ->with(['payments'])
                          ->first();

        if (!$vehicle) {
            return response()->json([
                'message' => 'Véhicule non trouvé',
            ], 404);
        }

        return new VehicleResource($vehicle);
    }

    /**
     * Calculate fees for a vehicle by license plate.
     *
     * @param  string  $licensePlate
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateFees($licensePlate)
    {
        $vehicle = Vehicle::where('license_plate', $licensePlate)->first();

        if (!$vehicle) {
            return response()->json([
                'message' => 'Véhicule non trouvé',
            ], 404);
        }

        // Default fee settings
        $dailyStorageFee = 2000;
        $adminFee = 10000;

        // Calculate days in impound
        $impoundDate = new \DateTime($vehicle->impound_date);
        $today = new \DateTime();
        $daysImpounded = $impoundDate->diff($today)->days;

        // Calculate fees
        $storageFees = $daysImpounded * $dailyStorageFee;
        $totalFees = $storageFees + $adminFee;

        return response()->json([
            'vehicle' => new VehicleResource($vehicle),
            'fees' => [
                'days_impounded' => $daysImpounded,
                'daily_rate' => $dailyStorageFee,
                'storage_fees' => $storageFees,
                'admin_fee' => $adminFee,
                'total_due' => $totalFees,
            ],
        ]);
    }
}
