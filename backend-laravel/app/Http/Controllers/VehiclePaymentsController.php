<?php

namespace App\Http\Controllers;

use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Vehicles",
 *     description="API Endpoints for vehicle storage fee calculation and payment history"
 * )
 */
class VehiclePaymentsController extends Controller
{
    /**
     * @OA\Get(
     *     path="/vehicles/{vehicle}/storage-fee",
     *     operationId="calculateVehicleStorageFee",
     *     tags={"Vehicles"},
     *     summary="Calculate storage fee for a vehicle",
     *     description="Returns the current storage fee for a vehicle based on impound duration",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="vehicle", in="path", description="Vehicle ID", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="days_impounded", type="integer"),
     *                 @OA\Property(property="daily_rate", type="number"),
     *                 @OA\Property(property="storage_fee", type="number"),
     *                 @OA\Property(property="admin_fee", type="number"),
     *                 @OA\Property(property="total_due", type="number"),
     *                 @OA\Property(property="amount_paid", type="number"),
     *                 @OA\Property(property="balance", type="number")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, description="Vehicle not found"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function calculateStorageFee(Vehicle $vehicle)
    {
        // Get fee settings (in a real implementation, get these from a settings table)
        $dailyStorageFee = 2000; // Default in XOF
        $adminFee = 10000; // Default in XOF
        
        // Calculate days in impound
        $impoundDate = Carbon::parse($vehicle->impound_date);
        $today = Carbon::now();
        $daysImpounded = $impoundDate->diffInDays($today);
        
        // Calculate total storage fee
        $storageFee = $daysImpounded * $dailyStorageFee;
        $totalDue = $storageFee + $adminFee;
        
        // Calculate amount already paid for this vehicle
        $amountPaid = Payment::where('vehicle_id', $vehicle->id)
            ->where('status', 'completed')
            ->sum('amount');
        
        // Calculate remaining balance
        $balance = max(0, $totalDue - $amountPaid);
        
        return response()->json([
            'data' => [
                'days_impounded' => $daysImpounded,
                'daily_rate' => $dailyStorageFee,
                'storage_fee' => $storageFee,
                'admin_fee' => $adminFee,
                'total_due' => $totalDue,
                'amount_paid' => $amountPaid,
                'balance' => $balance
            ]
        ]);
    }
    
    /**
     * @OA\Get(
     *     path="/vehicles/{vehicle}/payments",
     *     operationId="getVehiclePayments",
     *     tags={"Vehicles"},
     *     summary="Get payment history for a vehicle",
     *     description="Returns all payments associated with a vehicle",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="vehicle", in="path", description="Vehicle ID", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/PaymentResource"))
     *         )
     *     ),
     *     @OA\Response(response=404, description="Vehicle not found"),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function getPayments(Vehicle $vehicle)
    {
        $payments = Payment::where('vehicle_id', $vehicle->id)
            ->with('user')
            ->latest()
            ->get();
            
        return PaymentResource::collection($payments);
    }
}
