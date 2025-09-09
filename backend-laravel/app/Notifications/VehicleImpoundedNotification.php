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
        $tableHtml = '<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:14px;">'
            . '<thead style="background:#f5f5f5;">'
            . '<tr>'
            . '<th>Type de véhicule</th>'
            . '<th>Frais d\'enlèvement</th>'
            . '<th>Frais de garde journalière</th>'
            . '</tr>'
            . '</thead>'
            . '<tbody>'
            . '<tr><td>Deux-roues motorisés</td><td>5 000 FCFA</td><td>2 000 FCFA</td></tr>'
            . '<tr><td>Tricycles</td><td>10 000 FCFA</td><td>3 000 FCFA</td></tr>'
            . '<tr><td>Véhicule de 4 à 12 places</td><td>30 000 FCFA</td><td>5 000 FCFA</td></tr>'
            . '<tr><td>Véhicule de 13 à 30 places</td><td>50 000 FCFA</td><td>10 000 FCFA</td></tr>'
            . '<tr><td>Véhicule à partir de 31 places</td><td>80 000 FCFA</td><td>15 000 FCFA</td></tr>'
            . '<tr><td>Camion inférieur à 5 tonnes</td><td>50 000 FCFA</td><td>10 000 FCFA</td></tr>'
            . '<tr><td>Camion de 5 à 10 tonnes</td><td>120 000 FCFA</td><td>15 000 FCFA</td></tr>'
            . '<tr><td>Camion supérieur à 10 tonnes</td><td>150 000 FCFA</td><td>20 000 FCFA</td></tr>'
            . '</tbody></table>';

        return (new MailMessage)
            ->subject('Votre véhicule a été mis en fourrière')
            ->greeting('Bonjour,')
            ->line("Nous vous informons que votre véhicule immatriculé {$this->vehicle->license_plate} a été mis en fourrière municipale de Cotonou en ce jour.")
            ->line("Voici la grille officielle des frais de fourrière :")
            ->line(new \Illuminate\Support\HtmlString($tableHtml))
            ->line(' ')
            ->line('Pour récupérer votre véhicule, veuillez vous présenter à la fourrière avec les documents suivants :')
            ->line('- Une pièce d\'identité valide')
            ->line('- La carte grise du véhicule')
            ->line('- La quittance de paiement des frais de fourrière à retirer [ici](http://localhost:8080/vehicule-lookup)')
            ->action('Plus d\'informations', url('/'))
            ->line('Pour plus d\'informations, contactez-nous au +229 21 30 31 32 ')
            ->salutation('Cordialement, La Mairie de Cotonou');
    }
}
