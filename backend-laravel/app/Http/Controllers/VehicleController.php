<?php
namespace App\Http\Controllers;

use App\Mail\FourriereNotificationMail;
use Illuminate\Support\Facades\Mail;
use App\Http\Requests\Vehicle\StoreVehicleRequest;
use App\Http\Requests\Vehicle\UpdateVehicleRequest;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\VehicleResource;
use App\Models\Payment;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VehicleController extends Controller
   
{
    /**
     * @OA\Get(
     *      path="/vehicles",
     *      operationId="getVehiclesList",
     *      tags={"Vehicles"},
     *      summary="Get list of vehicles",
     *      description="Returns list of vehicles",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="search", in="query", description="Search term", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="status", in="query", description="Filter by status", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="date_from", in="query", description="Filter by start date", required=false, @OA\Schema(type="string", format="date")),
     *      @OA\Parameter(name="date_to", in="query", description="Filter by end date", required=false, @OA\Schema(type="string", format="date")),
     *      @OA\Parameter(name="vehicle_type", in="query", description="Filter by vehicle type", required=false, @OA\Schema(type="string")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/VehicleResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function index(Request $request)
    {
        $query = Vehicle::query()->with('owner');
        
        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('license_plate', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('color', 'like', "%{$search}%");
            });
        }
        
        // Apply status filter
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        
        // Apply date range filter
        if ($request->has('date_from')) {
            $query->where('impound_date', '>=', $request->input('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->where('impound_date', '<=', $request->input('date_to'));
        }
        
        // Apply vehicle type filter
        if ($request->has('vehicle_type') && $request->input('vehicle_type') !== 'all') {
            $query->where('type', $request->input('vehicle_type'));
        }
        
        // Paginate results
        $perPage = $request->input('per_page', 15);
        $vehicles = $query->latest()->paginate($perPage);
        
        return VehicleResource::collection($vehicles);
    }

      public function notifyOwner(Request $request, $id)
    {
        $request->validate([
            'method' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'license_plate' => 'required|string',
            'description' => 'nullable|string',
        ]);

        if (in_array($request->method, ['email', 'both'])) {
            \Mail::to($request->email)->send(new FourriereNotificationMail([
                'license_plate' => $request->license_plate,
                'description' => $request->description,
            ]));
        }

        // Tu peux simuler l'envoi SMS ici si besoin

        return response()->json(['success' => true]);
    }

    /**
     * @OA\Post(
     *      path="/vehicles",
     *      operationId="storeVehicle",
     *      tags={"Vehicles"},
     *      summary="Store new vehicle",
     *      description="Returns vehicle data",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/StoreVehicleRequest")
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/VehicleResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function store(StoreVehicleRequest $request)
    {
        $data = $request->validated();
        
        // Handle file uploads if included
        if ($request->hasFile('photos')) {
            $photos = [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('vehicles', 'public');
                $photos[] = $path;
            }
            $data['photos'] = $photos;
        } else {
            $data['photos'] = [];
        }
        
        // Generate QR code
        $qrData = [
            'license_plate' => $data['license_plate'],
            'make' => $data['make'],
            'model' => $data['model'],
            'impound_date' => $data['impound_date'],
        ];
        
        $qrCode = 'QR' . md5(json_encode($qrData));
        $data['qr_code'] = $qrCode;
        
        $vehicle = Vehicle::create($data);
        
        return new VehicleResource($vehicle);
    }

    /**
     * @OA\Get(
     *      path="/vehicles/{id}",
     *      operationId="getVehicleById",
     *      tags={"Vehicles"},
     *      summary="Get vehicle information",
     *      description="Returns vehicle data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of vehicle", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/VehicleResource")
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function show(Vehicle $vehicle)
    {
        return new VehicleResource($vehicle->load('owner'));
    }

    /**
     * @OA\Put(
     *      path="/vehicles/{id}",
     *      operationId="updateVehicle",
     *      tags={"Vehicles"},
     *      summary="Update existing vehicle",
     *      description="Returns updated vehicle data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of vehicle", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/UpdateVehicleRequest")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/VehicleResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $data = $request->validated();
        
        // Handle file uploads if included
        if ($request->hasFile('photos')) {
            $photos = $vehicle->photos ?? [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('vehicles', 'public');
                $photos[] = $path;
            }
            $data['photos'] = $photos;
        }
        
        $vehicle->update($data);
        
        return new VehicleResource($vehicle);
    }

    /**
     * @OA\Delete(
     *      path="/vehicles/{id}",
     *      operationId="deleteVehicle",
     *      tags={"Vehicles"},
     *      summary="Delete existing vehicle",
     *      description="Deletes a record and returns no content",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of vehicle", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(response=204, description="Successful operation"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Not Found"),
     * )
     */
    public function destroy(Vehicle $vehicle)
    {
        // Check if there are any procedures or payments associated with this vehicle
        if ($vehicle->procedures()->exists() || $vehicle->payments()->exists()) {
            return response()->json([
                'message' => 'Ce véhicule ne peut pas être supprimé car il a des procédures ou des paiements associés.'
            ], 422);
        }
        
        $vehicle->delete();
        
        return response()->noContent();
    }
    
    /**
     * Upload photos for a vehicle.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function uploadPhotos(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);
        
        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg|max:2048',
        ]);
        
        $photos = $vehicle->photos ?? [];
        
        foreach ($request->file('photos') as $photo) {
            $path = $photo->store('vehicles', 'public');
            $photos[] = $path;
        }
        
        $vehicle->update(['photos' => $photos]);
        
        return new VehicleResource($vehicle);
    }
    
    /**
     * Get QR code for a vehicle.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function getQrCode($id)
    {
        $vehicle = Vehicle::findOrFail($id);
        
        // Generate QR code data
        $qrData = [
            'id' => $vehicle->id,
            'license_plate' => $vehicle->license_plate,
            'make' => $vehicle->make,
            'model' => $vehicle->model,
            'impound_date' => $vehicle->impound_date->format('Y-m-d'),
        ];
        
        // In a real implementation, you would generate a QR code image here
        // For now, we just return the data that would be encoded
        
        return response()->json([
            'qr_code' => $vehicle->qr_code,
            'data' => $qrData,
        ]);
    }
    
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
            
        return \App\Http\Resources\PaymentResource::collection($payments);
    }
}
