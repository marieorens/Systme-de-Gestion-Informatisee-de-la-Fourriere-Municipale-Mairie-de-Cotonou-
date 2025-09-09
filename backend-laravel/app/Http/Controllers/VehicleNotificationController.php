<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Notifications\VehicleImpoundedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class VehicleNotificationController extends Controller
{
    public function __construct()
    {
        Log::info('VehicleNotificationController instancié');
    }

    public function notify(Request $request, $id)
    {
        Log::info('Début de la requête de notification', [
            'vehicle_id' => $id,
            'request_data' => $request->all()
        ]);

        try {
            $vehicle = Vehicle::find($id);

            if (!$vehicle) {
                Log::warning('Véhicule non trouvé', ['vehicle_id' => $id]);
                return response()->json([
                    'message' => 'Véhicule non trouvé'
                ], 404);
            }

            $request->validate([
                'method' => 'required|in:sms,email,both',
                'phone' => 'required_if:method,sms,both',
                'email' => 'required_if:method,email,both|email',
                'license_plate' => 'required|string'
            ]);

            if ($vehicle->license_plate !== trim($request->license_plate)) {
                return response()->json([
                    'message' => 'La plaque d\'immatriculation ne correspond pas au véhicule'
                ], 422);
            }

            if (in_array($request->method, ['sms', 'both'])) {
                Log::info('Tentative d\'envoi de SMS', [
                    'phone' => $request->phone,
                    'vehicle_id' => $vehicle->id
                ]);

                /*
                \Twilio::message(
                    $request->phone,
                    "Votre véhicule immatriculé {$request->license_plate} a été mis en fourrière. 
                    Veuillez contacter la Mairie de Cotonou au +229 XX XX XX XX"
                );
                */
            }

            if (in_array($request->method, ['email', 'both'])) {

                Log::info('Tentative d\'envoi d\'email', [
                    'email' => $request->email,
                    'vehicle_id' => $vehicle->id,
                    'license_plate' => $vehicle->license_plate,
                    'vehicle_type' => $vehicle->type
                ]);

                Notification::route('mail', $request->email)
                    ->notify(new VehicleImpoundedNotification($vehicle));
            }

            return response()->json([
                'message' => 'Notification envoyée avec succès'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la notification véhicule', [
                'vehicle_id' => $id,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de la notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
