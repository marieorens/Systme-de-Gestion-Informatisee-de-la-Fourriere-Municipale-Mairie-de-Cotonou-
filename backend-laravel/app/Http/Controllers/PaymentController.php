<?php

namespace App\Http\Controllers;

use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Vehicle;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
/**
 * @OA\Tag(
 *     name="Payments",
 *     description="API Endpoints for payment management"
 * )
 */
class PaymentController extends Controller
    /**
     * Détail public d'un paiement (par id ou référence)
     */
   
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Liste publique des paiements (sans authentification)
     */
    public function publicIndex(Request $request)
    {
        $query = Payment::query()->with(['vehicle', 'user']);

        // Filtres optionnels
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('vehicle', function ($vehicleQuery) use ($search) {
                      $vehicleQuery->where('license_plate', 'like', "%{$search}%");
                  });
            });
        }
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $perPage = $request->input('per_page', 15);
        $payments = $query->latest()->paginate($perPage);

        return PaymentResource::collection($payments);
    }

     public function publicShow($id)
    {
        $payment = Payment::with(['vehicle', 'user'])
            ->where('id', $id)
            ->orWhere('reference', $id)
            ->firstOrFail();
        return new PaymentResource($payment);
    }

    /**
     * Enregistrement d'un paiement KKiaPay (public, sans authentification)
     */
    public function storeKkiapay(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string|unique:payments,reference',
            'vehicle_id' => 'required|exists:vehicles,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $vehicle = Vehicle::find($data['vehicle_id']);
        $ownerId = $vehicle ? $vehicle->owner_id : null;

        try {
            $payment = Payment::create([
                'vehicle_id' => $data['vehicle_id'],
                'owner_id' => $ownerId,
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'reference' => $data['id'],
                'description' => $data['description'] ?? 'Paiement KKiaPay',
                'payment_date' => now(),
            ]);
            \Log::info('Paiement KKiaPay créé avec succès', ['payment' => $payment->toArray()]);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la création du paiement KKiaPay', [
                'data' => $data,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Erreur lors de la création du paiement',
                'details' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'id' => $payment->id,
            'reference' => $payment->reference,
            'receipt_url' => url("/public/payments/{$payment->reference}/receipt"),
            'payment' => new PaymentResource($payment)
        ], 201);

    }

    /**
     * @OA\Get(
     *      path="/payments",
     *      operationId="getPaymentsList",
     *      tags={"Payments"},
     *      summary="Get list of payments",
     *      description="Returns list of payments",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="search", in="query", description="Search by reference or license plate", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="status", in="query", description="Filter by status", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="payment_method", in="query", description="Filter by payment method", required=false, @OA\Schema(type="string")),
     *      @OA\Parameter(name="date_from", in="query", description="Filter by start date", required=false, @OA\Schema(type="string", format="date")),
     *      @OA\Parameter(name="date_to", in="query", description="Filter by end date", required=false, @OA\Schema(type="string", format="date")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/PaymentResource"))
     *       ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function index(Request $request)
    {
        $query = Payment::query()->with(['vehicle', 'user']);
        
        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('vehicle', function ($vehicleQuery) use ($search) {
                      $vehicleQuery->where('license_plate', 'like', "%{$search}%");
                  });
            });
        }
        
        // Apply status filter
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        
        // Apply payment method filter
        if ($request->has('payment_method') && $request->input('payment_method') !== 'all') {
            $query->where('payment_method', $request->input('payment_method'));
        }
        
        // Apply date range filter
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        
        // Paginate results
        $perPage = $request->input('per_page', 15);
        $payments = $query->latest()->paginate($perPage);
        
        return PaymentResource::collection($payments);
    }

    /**
     * @OA\Post(
     *      path="/payments",
     *      operationId="storePayment",
     *      tags={"Payments"},
     *      summary="Store new payment",
     *      description="Returns payment data",
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(ref="#/components/schemas/StorePaymentRequest")
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/PaymentResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function store(StorePaymentRequest $request)
    {
        $data = $request->validated();
        
        // Generate a unique reference number
        $data['reference'] = 'PMT-' . strtoupper(uniqid());
        
        // Set the current user as the one who recorded the payment
        $data['user_id'] = Auth::id();
        
        // Create the payment
        $payment = Payment::create($data);
        
        // Update vehicle status if payment type is 'release_fee'
        if ($data['payment_type'] === 'release_fee' && $payment->status === 'completed') {
            $vehicle = Vehicle::findOrFail($data['vehicle_id']);
            
            // Check if all required payments are completed
            $totalDue = $this->calculateVehicleTotalDue($vehicle);
            $totalPaid = Payment::where('vehicle_id', $vehicle->id)
                ->where('status', 'completed')
                ->sum('amount');
            
            if ($totalPaid >= $totalDue) {
                $vehicle->update(['status' => 'ready_for_release']);
                
                // Send notification
                $this->notificationService->vehicleReadyForRelease($vehicle);
            }
        }
        
        return new PaymentResource($payment->load(['vehicle', 'user']));
    }

    /**
     * @OA\Get(
     *      path="/payments/{id}",
     *      operationId="getPaymentById",
     *      tags={"Payments"},
     *      summary="Get payment information",
     *      description="Returns payment data",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of payment", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/PaymentResource")
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function show(Payment $payment)
    {
        return new PaymentResource($payment->load(['vehicle', 'user']));
    }
    
    /**
     * @OA\Get(
     *      path="/payments/{id}/receipt",
     *      operationId="getPaymentReceipt",
     *      tags={"Payments"},
     *      summary="Get payment receipt",
     *      description="Returns payment receipt data for printing",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of payment", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              @OA\Property(property="data", type="object",
     *                  @OA\Property(property="payment", ref="#/components/schemas/PaymentResource"),
     *                  @OA\Property(property="receipt_details", type="object",
     *                      @OA\Property(property="receipt_number", type="string"),
     *                      @OA\Property(property="date", type="string", format="date-time"),
     *                      @OA\Property(property="system_name", type="string"),
     *                      @OA\Property(property="address", type="string"),
     *                      @OA\Property(property="contact_phone", type="string")
     *                  )
     *              )
     *          )
     *       ),
     *      @OA\Response(response=404, description="Not Found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function getReceipt($id)
    {
        $payment = Payment::with(['vehicle.owner', 'user'])->findOrFail($id);
        $settings = \Illuminate\Support\Facades\Cache::get('system_settings', [
            'system_name' => 'Système de Gestion de la Fourrière Municipale de Cotonou',
            'contact_phone' => '+229 21 30 30 30',
            'address' => 'Hôtel de ville de Cotonou, Bénin'
        ]);
        $receiptDetails = [
            'receipt_number' => $payment->reference,
            'date' => $payment->created_at,
            'system_name' => $settings['system_name'],
            'address' => $settings['address'],
            'contact_phone' => $settings['contact_phone']
        ];

    $qrText = 'http://127.0.0.1:8000/verif?receipt=' . $payment->reference;
    $result = Builder::create()
        ->data($qrText)
        ->size(110)
        ->margin(0)
        ->build();
    $qrCodeRaw = $result->getString(); 
    $qrCodeBase64 = 'data:image/png;base64,' . base64_encode($qrCodeRaw);
        $pdf = Pdf::loadView('receipts.payment', [
            'payment' => $payment,
            'receiptDetails' => $receiptDetails,
            'qrCode' => $qrCodeBase64
        ]);

        $filename = 'quitance_de_paiement_' . $payment->id . '_' . time() . '.pdf';
        $receiptsDir = storage_path('app/public/receipts/');
        $path = $receiptsDir . $filename;
        if (!file_exists($receiptsDir)) {
            mkdir($receiptsDir, 0775, true);
        }
        try {
            $pdf->save($path);
        } catch (\Exception $e) {
            \Log::error('Erreur génération PDF reçu: ' . $e->getMessage());
        }
        $receiptUrl = asset('storage/receipts/' . $filename);
        if ($payment->receipt_url !== $receiptUrl) {
            $payment->receipt_url = $receiptUrl;
            $payment->save();
        }
        return response()->json([
            'receipt_url' => $receiptUrl
        ]);
    }

    public function verifyReceipt(Request $request)
    {
    $reference = $request->query('receipt');
    $payment = Payment::where('reference', $reference)->with(['vehicle.owner'])->first();

    if (!$payment) {
        return view('receipts.notfound', ['reference' => $reference]);
    }

    return view('receipts.verify', ['payment' => $payment]);
    }
    
    /**
     * @OA\Post(
     *      path="/payments/{id}/send-receipt",
     *      operationId="sendReceiptByEmail",
     *      tags={"Payments"},
     *      summary="Send payment receipt by email",
     *      description="Sends the payment receipt to the specified email address",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="id", in="path", description="ID of payment", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              @OA\Property(property="email", type="string", format="email"),
     *              @OA\Property(property="pdf_data", type="string", description="Base64 encoded PDF data")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Email sent successfully"
     *      ),
     *      @OA\Response(response=404, description="Payment not found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function sendReceiptByEmail($id, Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'pdf_data' => 'required|string'
        ]);
        
        $payment = \App\Models\Payment::with(['vehicle.owner', 'user'])->find($id);
        
        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }
        
        // Envoyer l'email avec le PDF
        \Mail::to($request->email)
            ->send(new \App\Mail\ReceiptMail($payment, $request->pdf_data));
            
        return response()->json([
            'message' => 'Reçu envoyé par email avec succès'
        ]);
    }
    
    /**
     * @OA\Get(
     *      path="/vehicles/{vehicle}/payments",
     *      operationId="getVehiclePayments",
     *      tags={"Payments"},
     *      summary="Get vehicle payments",
     *      description="Returns all payments for a specific vehicle",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="vehicle", in="path", description="ID of vehicle", required=true, @OA\Schema(type="integer")),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(type="array", @OA\Items(ref="#/components/schemas/PaymentResource"))
     *       ),
     *      @OA\Response(response=404, description="Vehicle not found"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     * )
     */
    public function getVehiclePayments(Vehicle $vehicle)
    {
        $payments = Payment::where('vehicle_id', $vehicle->id)
            ->with('user')
            ->latest()
            ->get();
            
        return PaymentResource::collection($payments);
    }
    
    /**
     * @OA\Post(
     *      path="/vehicles/{vehicle}/payments",
     *      operationId="createVehiclePayment",
     *      tags={"Payments"},
     *      summary="Create a new payment for a vehicle",
     *      description="Returns the newly created payment",
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(name="vehicle", in="path", description="ID of vehicle", required=true, @OA\Schema(type="integer")),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              @OA\Property(property="amount", type="number", format="float", example="15000"),
     *              @OA\Property(property="payment_type", type="string", enum={"impound_fee", "storage_fee", "release_fee"}, example="storage_fee"),
     *              @OA\Property(property="payment_method", type="string", enum={"cash", "mobile_money", "card", "bank_transfer"}, example="cash"),
     *              @OA\Property(property="notes", type="string", example="Payment for 5 days of storage"),
     *              @OA\Property(property="status", type="string", enum={"pending", "completed", "failed"}, example="completed")
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/PaymentResource")
     *       ),
     *      @OA\Response(response=400, description="Bad Request"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=404, description="Vehicle not found"),
     * )
     */
    public function createVehiclePayment(Request $request, Vehicle $vehicle)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|string|in:impound_fee,storage_fee,release_fee',
            'payment_method' => 'required|string|in:cash,mobile_money,card,bank_transfer',
            'notes' => 'nullable|string',
            'status' => 'required|string|in:pending,completed,failed'
        ]);
        
        $data = $request->all();
        $data['vehicle_id'] = $vehicle->id;
        $data['reference'] = 'PMT-' . strtoupper(uniqid());
        $data['user_id'] = Auth::id();
        
        // Create the payment
        $payment = Payment::create($data);
        
        // Update vehicle status if payment type is 'release_fee' and payment is completed
        if ($data['payment_type'] === 'release_fee' && $data['status'] === 'completed') {
            // Check if all required payments are completed
            $totalDue = $this->calculateVehicleTotalDue($vehicle);
            $totalPaid = Payment::where('vehicle_id', $vehicle->id)
                ->where('status', 'completed')
                ->sum('amount');
            
            if ($totalPaid >= $totalDue) {
                $vehicle->update(['status' => 'ready_for_release']);
                
                // Send notification
                $this->notificationService->vehicleReadyForRelease($vehicle);
            }
        }
        
        return new PaymentResource($payment->load(['vehicle', 'user']));
    }
    
    /**
     * Calculate the total amount due for a vehicle
     *
     * @param Vehicle $vehicle
     * @return float
     */
    private function calculateVehicleTotalDue(Vehicle $vehicle)
    {
        // Get fee settings from cache
        $settings = \Illuminate\Support\Facades\Cache::get('system_settings', [
            'daily_storage_fee' => 2000,
            'admin_fee' => 10000
        ]);
        
        $dailyStorageFee = $settings['daily_storage_fee'];
        $adminFee = $settings['admin_fee'];
        
        // Calculate days in impound
        $impoundDate = Carbon::parse($vehicle->impound_date);
        $today = Carbon::now();
        $daysImpounded = $impoundDate->diffInDays($today);
        
        // Calculate storage fee
        $storageFee = $daysImpounded * $dailyStorageFee;
        
        // Total due is admin fee + storage fee
        return $adminFee + $storageFee;
    }
}
