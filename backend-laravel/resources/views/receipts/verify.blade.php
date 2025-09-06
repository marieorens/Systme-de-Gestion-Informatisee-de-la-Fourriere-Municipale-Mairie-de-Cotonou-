<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Vérification du reçu - Fourrière Municipale de Cotonou</title>
    <style>
        body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #f8fafc; color: #1a3557; }
        .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 40px 32px; }
        .header { text-align: center; margin-bottom: 32px; }
        .header .title { font-size: 28px; font-weight: bold; color: #005792; margin-bottom: 8px; }
        .header .subtitle { font-size: 16px; color: #1a3557; margin-bottom: 4px; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 18px; font-weight: bold; color: #005792; margin-bottom: 12px; border-bottom: 1px solid #e0e7ef; padding-bottom: 4px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .info-table th, .info-table td { padding: 8px 12px; text-align: left; }
        .info-table th { background: #f0f6fa; color: #005792; font-weight: 600; }
        .info-table tr { border-bottom: 1px solid #e0e7ef; }
        .footer { text-align: center; color: #fff; background: #005792; padding: 18px 0; border-radius: 0 0 12px 12px; font-size: 13px; margin-top: 40px; }
        .valid { color: #198754; font-size: 22px; font-weight: bold; margin-top: 18px; }
        .invalid { color: #dc3545; font-size: 22px; font-weight: bold; margin-top: 18px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Vérification du reçu</div>
            <div class="subtitle">Fourrière Municipale de Cotonou</div>
        </div>
        @if(isset($payment))
            <div class="valid">Reçu valide</div>
            <div class="section">
                <div class="section-title">Informations du reçu</div>
                <table class="info-table">
                    <tr><th>Reçu N°</th><td>{{ $payment->reference }}</td></tr>
                    <tr><th>Date de paiement</th><td>{{ \Carbon\Carbon::parse($payment->created_at)->format('d/m/Y') }}</td></tr>
                    <tr><th>Montant</th><td>{{ number_format($payment->amount, 0, ',', ' ') }} FCFA</td></tr>
                    <tr><th>Méthode de paiement</th><td>{{ $payment->payment_method }}</td></tr>
                </table>
            </div>
            <div class="section">
                <div class="section-title">Informations du véhicule</div>
                <table class="info-table">
                    <tr><th>Immatriculation</th><td>{{ $payment->vehicle->license_plate ?? '-' }}</td></tr>
                    <tr><th>Marque / Modèle</th><td>{{ $payment->vehicle->make ?? '-' }} {{ $payment->vehicle->model ?? '-' }} ({{ $payment->vehicle->color ?? '-' }})</td></tr>
                    <tr><th>Date de mise en fourrière</th><td>{{ isset($payment->vehicle->impound_date) ? \Carbon\Carbon::parse($payment->vehicle->impound_date)->format('d/m/Y') : '-' }}</td></tr>
                </table>
            </div>
        @else
            <div class="invalid">Reçu non trouvé</div>
            <div class="section">
                <div class="section-title">Aucun reçu ne correspond à la référence fournie.</div>
                <p>Vérifiez le numéro du reçu ou contactez la fourrière municipale.</p>
            </div>
        @endif
        <div class="footer">
            Mairie de Cotonou - Direction des Services Techniques<br>
            Tél: +229 21 30 04 00 | Email: fourriere@mairie-cotonou.bj
        </div>
    </div>
</body>
</html>
