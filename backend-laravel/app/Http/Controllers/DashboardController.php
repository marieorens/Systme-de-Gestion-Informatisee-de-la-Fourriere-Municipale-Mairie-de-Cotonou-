<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Payment;
use App\Models\Procedure;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Dashboard",
 *     description="API Endpoints for Dashboard Statistics"
 * )
 */
class DashboardController extends Controller
{
    /**
     * @OA\Get(
     *     path="/dashboard/stats",
     *     operationId="getDashboardStats",
     *     tags={"Dashboard"},
     *     summary="Get dashboard statistics",
     *     description="Returns key statistics for the dashboard",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="total_vehicles", type="integer"),
     *                 @OA\Property(property="vehicles_impounded_count", type="integer"),
     *                 @OA\Property(property="total_revenue", type="number"),
     *                 @OA\Property(property="active_procedures_count", type="integer"),
     *                 @OA\Property(property="recently_added_vehicles", type="array", @OA\Items(type="object")),
     *                 @OA\Property(property="procedures_nearing_deadline", type="array", @OA\Items(type="object"))
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function index()
    {
        $stats = [
            'total_vehicles' => Vehicle::count(),
            'total_owners' => \App\Models\Owner::count(), 
            'unclaimed_vehicles' => Vehicle::where('status', 'impounded')->count(),
            'monthly_revenue' => Payment::whereMonth('created_at', now()->month)
                                    ->whereYear('created_at', now()->year)
                                    ->sum('amount') ?? 0,
            'total_procedures' => Procedure::count(),
            'total_payments' => Payment::count(),
            'recently_added_vehicles' => Vehicle::latest()->take(5)->get(),
            'procedures_nearing_deadline' => Procedure::where('status', 'in_progress')
                                                      ->with('vehicle:id,license_plate')
                                                      ->latest()
                                                      ->take(5)
                                                      ->get(),
        ];

        return response()->json($stats);
    }
    
    /**
     * @OA\Get(
     *     path="/dashboard/vehicles-by-status",
     *     operationId="getVehiclesByStatus",
     *     tags={"Dashboard"},
     *     summary="Get vehicles grouped by status",
     *     description="Returns count of vehicles for each status",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="status", type="string"),
     *                     @OA\Property(property="count", type="integer")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function vehiclesByStatus()
    {
        $statuses = DB::table('vehicles')
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();
        
        return response()->json($statuses);
    }

    /**
     * @OA\Get(
     *     path="/dashboard/payments-by-month",
     *     operationId="getPaymentsByMonth",
     *     tags={"Dashboard"},
     *     summary="Get payments grouped by month",
     *     description="Returns sum of payments for each month of the current year",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="month", type="string"),
     *                     @OA\Property(property="total", type="number")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function paymentsByMonth()
    {
        $currentYear = Carbon::now()->year;
        
        $payments = DB::table('payments')
            ->select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(amount) as amount')
            )
            ->whereYear('created_at', $currentYear)
            ->groupBy('month')
            ->orderBy('month')
            ->get();
        
        // Format result to include all months, even those with no payments
        $result = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthName = Carbon::create($currentYear, $i, 1)->format('F');
            $monthData = $payments->firstWhere('month', $i);
            
            $result[] = [
                'month' => $monthName,
                'amount' => $monthData ? $monthData->amount : 0,
            ];
        }
        
        return response()->json($result);
    }

    /**
     * @OA\Get(
     *     path="/dashboard/recent-activities",
     *     operationId="getRecentActivities",
     *     tags={"Dashboard"},
     *     summary="Get recent system activities",
     *     description="Returns recent activities like vehicle additions, payments, procedure updates",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer"),
     *                     @OA\Property(property="type", type="string"),
     *                     @OA\Property(property="description", type="string"),
     *                     @OA\Property(property="created_at", type="string", format="date-time")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function recentActivities(Request $request)
    {
        $limit = $request->input('limit', 10);
        
        // For this example, we'll combine recent entries from multiple tables
        // In a real implementation, you would typically have an activities or audit log table
        
        // Use DB::table for vehicles to avoid enum casting issues
        $recentVehicles = DB::table('vehicles')
            ->select(
                'id',
                DB::raw("'vehicle' as type"),
                DB::raw("CONCAT('Vehicle ', license_plate, ' was added to the system') as message"),
                'created_at',
                'id as reference_id',
                DB::raw("'vehicle' as reference_type")
            )
            ->latest()
            ->limit($limit)
            ->get();
            
        $recentPayments = Payment::select(
                'id',
                DB::raw("'payment' as type"),
                DB::raw("CONCAT('Payment of XOF ', amount, ' was received for vehicle ID ', vehicle_id) as message"),
                'created_at',
                'id as reference_id',
                DB::raw("'payment' as reference_type")
            )
            ->latest()
            ->take($limit)
            ->get();
            
        // For procedures, use DB::table to avoid enum casting issues
        $proceduresRaw = DB::table('procedures')
            ->select(
                'id',
                DB::raw("'procedure' as type"),
                DB::raw("CONCAT('Procedure for vehicle ID ', vehicle_id, ' was updated to status ', status) as message"),
                'created_at',
                'id as reference_id',
                DB::raw("'procedure' as reference_type")
            )
            ->latest()
            ->limit($limit)
            ->get();
            
        // Merge and sort the collections
        $activities = $recentVehicles->concat($recentPayments)->concat($proceduresRaw)
            ->sortByDesc('created_at')
            ->values()
            ->take($limit);
            
        return response()->json($activities);
    }
}
