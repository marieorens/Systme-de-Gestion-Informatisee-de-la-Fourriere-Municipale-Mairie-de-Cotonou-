<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reçu de Paiement</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Fourrière Municipale de Cotonou</h2>
        </div>
        
        <div class="content">
            <p>Bonjour,</p>
            
            <p>Votre paiement pour le véhicule immatriculé <strong>{{ $payment->vehicle->license_plate }}</strong> a été reçu et traité avec succès.</p>
            
            <p>Détails du paiement :</p>
            <ul>
                <li>Montant : {{ number_format($payment->amount, 0, ',', ' ') }} FCFA</li>
                <li>Référence : {{ $payment->reference_number }}</li>
                <li>Date : {{ $payment->created_at->format('d/m/Y H:i') }}</li>
            </ul>
            
            <p>Vous trouverez ci-joint votre reçu de paiement. Veuillez le présenter lors de la récupération de votre véhicule.</p>
            
            <p>Merci de votre confiance.</p>
        </div>
        
        <div class="footer">
            <p>Ce message est automatique, merci de ne pas y répondre.</p>
            <p>© {{ date('Y') }} Fourrière Municipale de Cotonou. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
