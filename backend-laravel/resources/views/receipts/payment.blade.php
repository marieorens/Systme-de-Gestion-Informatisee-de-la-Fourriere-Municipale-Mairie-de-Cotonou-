<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Quittance de paiement</title>
    <style>
    body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1a3557; background: #fff; margin: 0; }
    .container { max-width: 700px; margin: 24px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px 28px; }
    .header { text-align: center; margin-bottom: 28px; }
    .header .title { font-size: 26px; font-weight: bold; color: #005792; margin-bottom: 8px; }
    .header .subtitle { font-size: 15px; color: #1a3557; margin-bottom: 6px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 17px; font-weight: bold; color: #005792; margin-bottom: 10px; border-bottom: 1px solid #e0e7ef; padding-bottom: 4px; }
    .info-table, .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .info-table th, .info-table td, .payment-table th, .payment-table td { padding: 8px 14px; text-align: left; font-size: 14px; }
    .info-table th { background: #f0f6fa; color: #005792; font-weight: 600; }
    .info-table tr, .payment-table tr { border-bottom: 1px solid #e0e7ef; }
    .payment-table th { background: #005792; color: #fff; font-weight: 600; }
    .instructions { background: #f0f6fa; border-radius: 8px; padding: 14px; margin-top: 14px; font-size: 13px; color: #1a3557; }
    .footer { text-align: center; color: #fff; background: #005792; padding: 14px 0; border-radius: 0 0 10px 10px; font-size: 13px; margin-top: 28px; }
    .qr { text-align: right; margin-top: 14px; }
    .qr img { width: 110px; height: 110px; }
    @page { size: A4; margin: 24px; }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
           <strong><div class="republique">RÉPUBLIQUE DU BÉNIN</div><br></strong> 
            <div class="subtitle">MAIRIE DE COTONOU - FOURRIÈRE MUNICIPALE</div>
            <div class="title">QUITTANCE DE PAIEMENT</div>
        </div>
        <div class="summary-box">
            <strong>Reçu N°:</strong> {{ $receiptDetails['receipt_number'] }} &nbsp; | 
            <strong>Date:</strong> {{ \Carbon\Carbon::parse($receiptDetails['date'])->format('d/m/Y') }} &nbsp; | 
            <strong>Réf. Paiement:</strong> {{ $payment->reference }}
        </div><br><br>

        <div class="section">
            <table class="info-table">
                <tr><th>Système</th><td>{{ $receiptDetails['system_name'] }}</td></tr>
                <tr><th>Adresse</th><td>{{ $receiptDetails['address'] }}</td></tr>
                <tr><th>Contact</th><td>{{ $receiptDetails['contact_phone'] }}</td></tr>
            </table>
        </div>
        <div class="section">
            <div class="section-title">Informations du véhicule</div>
            <table class="info-table">
                <tr><th>Immatriculation</th><td>{{ $payment->vehicle->license_plate }}</td></tr>
                <tr><th>Marque / Modèle</th><td>{{ $payment->vehicle->make }} {{ $payment->vehicle->model }} ({{ $payment->vehicle->color }})</td></tr>
                <tr><th>Date de mise en fourrière</th><td>{{ \Carbon\Carbon::parse($payment->vehicle->impound_date)->format('d/m/Y') }}</td></tr>
            </table>
        </div>

        <div class="section">
            <div class="section-title">Détails du paiement</div>
            <table class="payment-table">
                <tr>
                    <th>Description</th>
                    <th>Détails</th>
                    <th>Montant (FCFA)</th>
                </tr>
                <tr>
                    <td>Frais payés</td>
                    <td>—</td>
                    <td>{{ number_format($payment->amount, 0, ',', ' ') }}</td>
                </tr>
                <tr>
                    <td>Méthode de paiement</td>
                    <td colspan="2">{{ $payment->payment_method }}</td>
                </tr>
            </table>
    
            <div class="instructions">
                Ce reçu est la preuve de paiement des frais de fourrière. Il doit être présenté lors de la récupération du véhicule.<br>
                Veuillez vous munir de ce reçu, d'une pièce d'identité et de la carte grise du véhicule.<br>
                Horaires d'ouverture : Lundi–Vendredi 8h–17h, Samedi 8h–12h.
            </div>
        </div>

        <div class="bottom-section">
            <div class="qr">
                @if(isset($qrCode))
                    <img src="{{ $qrCode }}" alt="QR Code reçu" />
                @endif
            </div>
        </div>

        <div class="footer">
            Mairie de Cotonou - Direction de la Police Républicaine<br>
            Tél: +229 21 30 04 00 | Email: fourriere@mairie-cotonou.bj
        </div>
    </div>
</body>
</html>
