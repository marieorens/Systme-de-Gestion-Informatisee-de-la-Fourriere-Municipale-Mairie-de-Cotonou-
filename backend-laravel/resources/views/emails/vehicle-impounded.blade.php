@component('mail::message')
# Notification de mise en fourrière

Bonjour {{ $owner->name }},

Nous vous informons que votre véhicule immatriculé **{{ $vehicle->plate_number }}** a été mis en fourrière municipale le {{ $date }}.

## Détails du véhicule
- Marque : {{ $vehicle->brand }}
- Modèle : {{ $vehicle->model }}
- Couleur : {{ $vehicle->color }}

## Prochaines étapes
1. Veuillez vous présenter à la fourrière municipale avec :
   - Une pièce d'identité valide
   - La carte grise du véhicule
   - Le certificat d'assurance valide

2. Des frais de fourrière seront applicables selon la durée de garde.

Pour toute information complémentaire, veuillez nous contacter au :
- Téléphone : +229 21 30 30 30
- Email : contact@fourriere-municipale.bj

Cordialement,

{{ config('app.name') }}
@endcomponent
