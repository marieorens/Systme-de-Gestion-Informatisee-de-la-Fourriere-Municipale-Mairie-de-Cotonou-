<?php

namespace App\Notifications;

use App\Models\Vehicle;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VehicleImpoundedNotification extends Notification
{
    use Queueable;

    protected $vehicle;

    public function __construct(Vehicle $vehicle)
    {
        $this->vehicle = $vehicle;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $dailyFee = $this->getDailyStorageFee($this->vehicle->type);
        $removalFee = $this->getRemovalFee($this->vehicle->type);

        return (new MailMessage)
            ->subject('Votre véhicule a été mis en fourrière')
            ->greeting('Bonjour,')
            ->line("Nous vous informons que votre véhicule immatriculé {$this->vehicle->license_plate} a été mis en fourrière municipale de Cotonou.")
            ->line("Frais d'enlèvement : " . number_format($removalFee, 0, ',', ' ') . ' FCFA')
            ->line("Frais de garde journalière : " . number_format($dailyFee, 0, ',', ' ') . ' FCFA')
            ->line('Pour récupérer votre véhicule, veuillez vous présenter à la mairie de Cotonou avec les documents suivants:')
            ->line('- Une pièce d\'identité valide')
            ->line('- La carte grise du véhicule')
            ->line('- Le reçu de paiement des frais de fourrière')
            ->action('Plus d\'informations', url('/'))
            ->line('Pour plus d\'informations, contactez-nous au +229 XX XX XX XX')
            ->salutation('Cordialement, La Mairie de Cotonou');
    }

    protected function getDailyStorageFee(string $type): int
    {
        return match ($type) {
            'MOTORCYCLE' => 2000,
            'TRICYCLE' => 3000,
            'SMALL_VEHICLE' => 5000,
            'MEDIUM_VEHICLE' => 10000,
            'LARGE_VEHICLE' => 15000,
            'SMALL_TRUCK' => 10000,
            'MEDIUM_TRUCK' => 15000,
            'LARGE_TRUCK' => 20000,
            default => 5000,
        };
    }

    protected function getRemovalFee(string $type): int
    {
        return match ($type) {
            'MOTORCYCLE' => 5000,
            'TRICYCLE' => 10000,
            'SMALL_VEHICLE' => 30000,
            'MEDIUM_VEHICLE' => 50000,
            'LARGE_VEHICLE' => 80000,
            'SMALL_TRUCK' => 50000,
            'MEDIUM_TRUCK' => 120000,
            'LARGE_TRUCK' => 150000,
            default => 30000,
        };
    }
}
