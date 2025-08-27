import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Vehicle, Payment } from '@/types';
import { PaymentMethod } from '@/types/enums';


const MUNICIPAL_LOGO = "data:image/png;base64,YOUR_BASE64_ENCODED_LOGO";

interface ReceiptData {
  payment: Payment;
  vehicle: Vehicle;
  daysCount: number;
  dailyRate: number;
}

const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return 'Espèces';
    case PaymentMethod.BANK_TRANSFER:
      return 'Virement bancaire';
    case PaymentMethod.MOBILE_MONEY:
      return 'Paiement Mobile (KKiaPay)';
    case PaymentMethod.CREDIT_CARD:
      return 'Carte bancaire';
    default:
      return method;
  }
};


export const generateReceiptPDF = async (data: ReceiptData): Promise<string> => {
  const { payment, vehicle, daysCount, dailyRate } = data;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  

  doc.setProperties({
    title: `Reçu de paiement - ${vehicle.license_plate}`,
    subject: 'Reçu de paiement des frais de fourrière',
    author: 'Mairie de Cotonou',
    creator: 'Système de Gestion de Fourrière'
  });
  

  const primaryColor = [0, 87, 146];
  const accentColor = [219, 165, 20]; 
  
 
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 30, 'F');
  
 
  try {
    doc.addImage(MUNICIPAL_LOGO, 'PNG', 10, 5, 20, 20);
  } catch (e) {
    console.error('Erreur lors du chargement du logo:', e);
  }
  
  // Titre du reçu
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('RÉPUBLIQUE DU BÉNIN', 105, 15, { align: 'center' });
  doc.setFontSize(14);
  doc.text('MAIRIE DE COTONOU - FOURRIÈRE MUNICIPALE', 105, 22, { align: 'center' });
  
  // Titre du document
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(24);
  doc.text('REÇU DE PAIEMENT', 105, 45, { align: 'center' });
  
  // Ligne d'accent
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(1);
  doc.line(45, 48, 165, 48);
  
  // Numéro de reçu et date
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reçu N°: ${payment.receipt_number}`, 20, 60);
  doc.text(`Date: ${payment.created_at ? new Date(payment.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}`, 170, 60, { align: 'right' });
  
  // Informations sur le véhicule
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 70, 170, 40, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INFORMATIONS DU VÉHICULE', 105, 80, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Immatriculation:', 30, 90);
  doc.text('Marque / Modèle:', 30, 98);
  doc.text('Date de mise en fourrière:', 30, 106);
  
  doc.setFont('helvetica', 'bold');
  doc.text(vehicle.license_plate, 90, 90);
  doc.text(`${vehicle.make} ${vehicle.model} (${vehicle.color})`, 90, 98);
  doc.text(vehicle.impound_date ? new Date(vehicle.impound_date).toLocaleDateString('fr-FR') : 'Date inconnue', 90, 106);
  
  
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 120, 170, 60, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DÉTAILS DU PAIEMENT', 105, 130, { align: 'center' });
  

  autoTable(doc, {
    startY: 135,
    head: [['Description', 'Détails', 'Montant (FCFA)']],
    body: [
      ['Frais de stationnement', `${(dailyRate).toLocaleString()} FCFA/jour`, (payment.amount).toLocaleString()],
      ['Méthode de paiement', getPaymentMethodLabel(payment.method)],
      ['N° de référence', payment.reference_number],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });
  
  
  doc.setTextColor(220, 53, 69);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYÉ', 20, 295);


  try {
    const qrText = `https://fourriere.mairie-cotonou.bj/verif?receipt=${data.payment.receipt_number}`;
    const { generateQrCodeDataUrl } = await import('./generateQrCode');
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrText);
  doc.addImage(qrCodeDataUrl, 'PNG', 170, 255, 25, 25);
  } catch (e) {
    console.error('Erreur lors de la génération du QR code:', e);
  }
  
  // Conditions et termes
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text([
    'Ce reçu est la preuve de paiement des frais de fourrière. Il doit être présenté lors de la récupération du véhicule.',
    'Pour récupérer votre véhicule, veuillez vous munir de ce reçu, d\'une pièce d\'identité et de la carte grise du véhicule.',
    'Horaires d\'ouverture de la fourrière: Du lundi au vendredi de 8h à 17h et le samedi de 8h à 12h.'
  ], 20, 200, { maxWidth: 170, align: 'left' });
  
  // Pied de page
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 277, 210, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Mairie de Cotonou - Direction des Services Techniques', 105, 283, { align: 'center' });
  doc.text('Tél: +229 21 30 04 00 | Email: fourriere@mairie-cotonou.bj', 105, 289, { align: 'center' });
  
  
  return doc.output('datauristring');
};

export default generateReceiptPDF;
