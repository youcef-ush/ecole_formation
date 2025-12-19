/**
 * Générateur de factures pour les paiements d'inscription
 */

export interface InvoiceData {
  invoiceNumber: string;
  studentName: string;
  phone: string;
  email?: string;
  formationTitle?: string;
  amount: number;
  paymentDate: Date;
  enrollmentId: number;
}

export const generateInvoice = (data: InvoiceData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour imprimer la facture');
    return;
  }

  const invoiceHTML = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reçu de Paiement - ${data.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 10px;
          background: #fff;
          font-size: 13px;
        }
        
        .invoice-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border: 2px solid #000;
        }
        
        .header {
          background: white;
          color: #000;
          padding: 20px 30px;
          border-bottom: 2px solid #000;
        }
        
        .header::before {
          display: none;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 26px;
          margin-bottom: 3px;
          font-weight: bold;
          color: #000;
        }
        
        .header .subtitle {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 10px;
          color: #000;
        }
        
        .school-info {
          font-size: 12px;
          line-height: 1.6;
          margin-top: 8px;
          background: #f5f5f5;
          padding: 8px 12px;
          border-radius: 3px;
          color: #000;
        }
        
        .school-info div {
          margin: 2px 0;
        }
        
        .school-info strong {
          margin-right: 6px;
        }
        
        .invoice-type {
          background: white;
          color: #000;
          text-align: center;
          padding: 10px;
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }
        
        .invoice-number {
          display: flex;
          justify-content: space-between;
          padding: 12px 30px;
          background: white;
          border-bottom: 2px dashed #000;
        }
        
        .invoice-number .left,
        .invoice-number .right {
          font-size: 12px;
          color: #000;
        }
        
        .invoice-number strong {
          color: #000;
          font-size: 14px;
        }
        
        .content-section {
          padding: 15px 30px;
          background: white;
        }
        
        .info-section {
          margin-bottom: 15px;
        }
        
        .info-section h2 {
          color: #000;
          font-size: 16px;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 2px solid #000;
          font-weight: bold;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 6px;
          padding: 4px 0;
        }
        
        .info-label {
          flex: 0 0 180px;
          font-weight: bold;
          color: #333;
          font-size: 12px;
        }
        
        .info-value {
          flex: 1;
          color: #000;
          font-size: 12px;
        }
        
        .amount-section {
          background: white;
          color: #000;
          border: 3px solid #000;
          border-radius: 5px;
          padding: 20px;
          margin: 15px 0;
          text-align: center;
        }
        
        .amount-section .label {
          font-size: 14px;
          margin-bottom: 8px;
          font-weight: 500;
          color: #000;
        }
        
        .amount-section .amount {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 2px;
          color: #000;
        }
        
        .footer {
          margin-top: 15px;
          padding: 15px 30px;
          background: white;
          text-align: center;
          color: #000;
          font-size: 11px;
          border-top: 2px solid #000;
        }
        
        .footer p {
          margin: 4px 0;
          color: #000;
        }
        
        .footer .important {
          color: #000;
          font-weight: bold;
          margin-top: 8px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding: 0 30px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          width: 180px;
          border-top: 2px solid #000;
          margin-top: 40px;
          padding-top: 8px;
          font-size: 11px;
          color: #000;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .invoice-container {
            border: 2px solid #000;
            page-break-inside: avoid;
          }
          
          .header {
            background: white !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .invoice-type {
            background: white !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .amount-section {
            background: white !important;
            color: #000 !important;
            border: 3px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          @page {
            margin: 0.5cm;
            size: A4;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <h1>📚 Inspired Academy By Nana</h1>
            <div class="subtitle">Centre de Formation et d'Excellence</div>
            <div class="school-info">
              <div><strong>📍 Adresse:</strong> Annoussa - BLIDA</div>
              <div><strong>📞 Téléphone:</strong> 0213 770 02 94 25 / 0213 770 02 94 26</div>
              <div><strong>✉️ Email:</strong> Inspiredacademy@gmail.com</div>
            </div>
          </div>
        </div>
        
        <!-- Invoice Type -->
        <div class="invoice-type">
          REÇU DE PAIEMENT - FRAIS D'INSCRIPTION
        </div>
        
        <!-- Invoice Number -->
        <div class="invoice-number">
          <div class="left">
            <strong>N° de Reçu:</strong><br>
            ${data.invoiceNumber}
          </div>
          <div class="right">
            <strong>Date d'émission:</strong><br>
            ${data.paymentDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        
        <div class="content-section">
<div class="content-section">
        <div class="info-section">
          <h2>📋 Informations de l'Étudiant</h2>
          <div class="info-row">
            <div class="info-label">Nom complet:</div>
            <div class="info-value">${data.studentName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Téléphone:</div>
            <div class="info-value">${data.phone}</div>
          </div>
          ${data.email ? `
          <div class="info-row">
            <div class="info-label">Email:</div>
            <div class="info-value">${data.email}</div>
          </div>
          ` : ''}
          ${data.formationTitle ? `
          <div class="info-row">
            <div class="info-label">Formation(s):</div>
            <div class="info-value">${data.formationTitle}</div>
          </div>
          ` : ''}
        </div>
        
        <!-- Amount Section -->
        <div class="amount-section">
          <div class="label">💰 MONTANT PAYÉ</div>
          <div class="amount">${data.amount.toLocaleString('fr-FR')} DA</div>
          <div class="label" style="margin-top: 15px; font-size: 16px; opacity: 0.9;">
            Frais d'inscription réglés en espèces
          </div>
        </div>
        
        <!-- Payment Details -->
        <div class="info-section">
          <h2>💳 Détails du Paiement</h2>
          <div class="info-row">
            <div class="info-label">Mode de paiement:</div>
            <div class="info-value">Espèces</div>
          </div>
          <div class="info-row">
            <div class="info-label">Référence inscription:</div>
            <div class="info-value">#${data.enrollmentId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Statut:</div>
            <div class="info-value" style="color: #000; font-weight: bold; font-size: 14px;">✓ PAYÉ ET VALIDÉ</div>
          </div>
        </div>
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Signature de l'Étudiant</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Cachet et Signature</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Ce reçu confirme le paiement des frais d'inscription.</p>
          <p class="important">Merci de votre confiance et bienvenue dans notre établissement.</p>
          <div style="margin-top: 8px; font-size: 10px; color: #666;">
            Document généré le ${new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
      
      <script>
        // Auto-print when page loads
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
};

// Générer un numéro de facture unique
export const generateInvoiceNumber = (enrollmentId: number): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  
  return `INS-${year}${month}${day}-${enrollmentId}-${timestamp}`;
};
