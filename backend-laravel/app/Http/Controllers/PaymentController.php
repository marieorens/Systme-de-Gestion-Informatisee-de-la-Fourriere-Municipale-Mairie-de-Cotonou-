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

class PaymentController extends Controller
   
   
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

   
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
        
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        
        if ($request->has('payment_method') && $request->input('payment_method') !== 'all') {
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

   
    public function store(StorePaymentRequest $request)
    {
        $data = $request->validated();
        $data['reference'] = 'PMT-' . strtoupper(uniqid());
        $data['user_id'] = Auth::id();
        $payment = Payment::create($data);
        
        if ($data['payment_type'] === 'release_fee' && $payment->status === 'completed') {
            $vehicle = Vehicle::findOrFail($data['vehicle_id']);
            
            $totalDue = $this->calculateVehicleTotalDue($vehicle);
            $totalPaid = Payment::where('vehicle_id', $vehicle->id)
                ->where('status', 'completed')
                ->sum('amount');
            
            if ($totalPaid >= $totalDue) {
                $vehicle->update(['status' => 'ready_for_release']);  
            }
        }
        
        return new PaymentResource($payment->load(['vehicle', 'user']));
    }

   
    public function show(Payment $payment)
    {
        return new PaymentResource($payment->load(['vehicle', 'user']));
    }
    
   
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
    
    
    public function getVehiclePayments(Vehicle $vehicle)
    {
        $payments = Payment::where('vehicle_id', $vehicle->id)
            ->with('user')
            ->latest()
            ->get();
            
        return PaymentResource::collection($payments);
    }
    
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
        
        $payment = Payment::create($data);
        
        if ($data['payment_type'] === 'release_fee' && $data['status'] === 'completed') {
            $totalDue = $this->calculateVehicleTotalDue($vehicle);
            $totalPaid = Payment::where('vehicle_id', $vehicle->id)
                ->where('status', 'completed')
                ->sum('amount');
            
            if ($totalPaid >= $totalDue) {
                $vehicle->update(['status' => 'ready_for_release']);
              
            }
        }
        
        return new PaymentResource($payment->load(['vehicle', 'user']));
    }
    
   
    private function calculateVehicleTotalDue(Vehicle $vehicle)
    {
        $typeMap = [
            'MOTORCYCLE' => ['removal' => 5000, 'daily' => 2000],
            'TRICYCLE' => ['removal' => 10000, 'daily' => 3000],
            'SMALL_VEHICLE' => ['removal' => 30000, 'daily' => 5000],
            'MEDIUM_VEHICLE' => ['removal' => 50000, 'daily' => 10000],
            'LARGE_VEHICLE' => ['removal' => 80000, 'daily' => 15000],
            'SMALL_TRUCK' => ['removal' => 50000, 'daily' => 10000],
            'MEDIUM_TRUCK' => ['removal' => 120000, 'daily' => 15000],
            'LARGE_TRUCK' => ['removal' => 150000, 'daily' => 20000],
        ];
        $typeKey = $vehicle->type;
        $fees = $typeMap[$typeKey] ?? ['removal' => 30000, 'daily' => 5000];

        $impoundDate = Carbon::parse($vehicle->impound_date);
        $today = Carbon::now();
        $daysImpounded = $impoundDate->diffInDays($today);

        $storageFee = $daysImpounded * $fees['daily'];
        $removalFee = $fees['removal'];

        return $removalFee + $storageFee;
    }
}
