<?php

namespace App\Http\Controllers;

use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class PublicVehicleController extends Controller
{
    /**
     * Search for a vehicle by license plate.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
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
     * Get vehicle details by license plate.
     *
     * @param  string  $licensePlate
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByLicensePlate($licensePlate)
    {
        $vehicle = Vehicle::where('license_plate', $licensePlate)
                          ->with(['owner', 'payments'])
                          ->first();
        
        if (!$vehicle) {
            return response()->json([
                'message' => 'Véhicule non trouvé',
            ], 404);
        }
        
        return new VehicleResource($vehicle);
    }
    
    /**
     * Calculate fees for a vehicle.
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
        
        // Get fee settings
        $dailyStorageFee = 2000; // Default
        $adminFee = 10000; // Default
        
        // In a real implementation, you would get these from your settings table
        
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
            ]
        ]);
    }
}
