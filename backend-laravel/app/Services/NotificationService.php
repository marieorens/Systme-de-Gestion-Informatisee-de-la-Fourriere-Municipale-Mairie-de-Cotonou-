<?php

namespace App\Services;

use App\Enums\NotificationChannel;
use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\Owner;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function createNotification(
        string $title,
        string $message,
        NotificationType $type,
        ?User $user = null,
        ?Owner $owner = null,
        ?Vehicle $vehicle = null,
        ?NotificationChannel $channel = null,
        ?Carbon $scheduledAt = null
    ): Notification {
        $notification = new Notification();
        $notification->title = $title;
        $notification->message = $message;
        $notification->type = $type;
        $notification->channel = $channel ?? NotificationChannel::APP;
        
        if ($user) {
            $notification->user_id = $user->id;
        }
        
        if ($owner) {
            $notification->owner_id = $owner->id;
        }
        
        if ($vehicle) {
            $notification->vehicle_id = $vehicle->id;
        }
        
        if ($scheduledAt) {
            $notification->scheduled_at = $scheduledAt;
        }
        
        $notification->save();
        return $notification;
    }
    
    public function createVehicleImpoundNotification(Vehicle $vehicle): Notification
    {
        $title = 'Véhicule mis en fourrière';
        $message = "Votre véhicule {$vehicle->make} {$vehicle->model} immatriculé {$vehicle->license_plate} a été mis en fourrière le {$vehicle->impound_date->format('d/m/Y')}. Veuillez contacter la fourrière municipale pour plus d'informations.";
        
        return $this->createNotification(
            $title,
            $message,
            NotificationType::VEHICLE_IMPOUNDED,
            null,
            $vehicle->owner,
            $vehicle,
            NotificationChannel::SMS
        );
    }
    
    public function createPaymentDueNotification(Vehicle $vehicle, float $amount): Notification
    {
        $title = 'Paiement de frais de fourrière';
        $message = "Des frais de fourrière de {$amount} FCFA sont dus pour votre véhicule {$vehicle->make} {$vehicle->model} immatriculé {$vehicle->license_plate}. Veuillez effectuer le paiement dès que possible.";
        
        return $this->createNotification(
            $title,
            $message,
            NotificationType::PAYMENT_DUE,
            null,
            $vehicle->owner,
            $vehicle,
            NotificationChannel::EMAIL
        );
    }
    
    public function createVehicleReleaseNotification(Vehicle $vehicle): Notification
    {
        $title = 'Véhicule libéré de la fourrière';
        $message = "Votre véhicule {$vehicle->make} {$vehicle->model} immatriculé {$vehicle->license_plate} a été libéré de la fourrière. Vous pouvez venir le récupérer.";
        
        return $this->createNotification(
            $title,
            $message,
            NotificationType::VEHICLE_RELEASED,
            null,
            $vehicle->owner,
            $vehicle,
            NotificationChannel::SMS
        );
    }
    
    public function createSystemNotification(string $title, string $message): void
    {
        try {
            $admins = User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                $this->createNotification(
                    $title,
                    $message,
                    NotificationType::SYSTEM,
                    $admin,
                    null,
                    null,
                    NotificationChannel::APP
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to create system notification: ' . $e->getMessage());
        }
    }
    
    public function markAsRead(Notification $notification): Notification
    {
        $notification->read_at = now();
        $notification->save();
        return $notification;
    }
    
    public function getUnreadNotificationsForUser(User $user, int $limit = 15)
    {
        return Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->latest()
            ->limit($limit)
            ->get();
    }
    
    public function getUnreadNotificationsForOwner(Owner $owner, int $limit = 15)
    {
        return Notification::where('owner_id', $owner->id)
            ->whereNull('read_at')
            ->latest()
            ->limit($limit)
            ->get();
    }
    
    public function vehicleReadyForRelease(Vehicle $vehicle)
    {
        if (!$vehicle->owner) {
            Log::warning("Impossible d'envoyer la notification : véhicule sans propriétaire", [
                'vehicle_id' => $vehicle->id, 
                'license_plate' => $vehicle->license_plate
            ]);
            return null;
        }
        
        return $this->createNotification(
            'Véhicule prêt pour récupération',
            "Votre véhicule immatriculé {$vehicle->license_plate} est prêt à être récupéré. Veuillez vous présenter à la fourrière avec votre pièce d'identité et la carte grise du véhicule.",
            NotificationType::VEHICLE_READY,
            null,
            $vehicle->owner,
            $vehicle
        );
    }
}
