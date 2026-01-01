import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Print } from "@mui/icons-material";

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    studentName: string;
    amount: number;
    date: string;
    courseTitle: string;
    type: string;
  } | null;
}

export default function ReceiptModal({
  open,
  onClose,
  data,
}: ReceiptModalProps) {
  if (!data) return null;

  const generateReceipt = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour imprimer le reçu");
      return;
    }

    const receiptHTML = `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reçu de Paiement</title>
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
                  <div style="text-align: center; margin-bottom: 10px;">
                    <img src="/dashboard/logo.png" alt="Inspired Academy" style="max-height: 60px; max-width: 150px;" />
                  </div>
                  <h1>Inspired Academy By Nana</h1>
                  <div class="subtitle">Centre de Formation et d'Excellence</div>
                  <div class="school-info">
                    <div><strong>📍 Adresse:</strong> Amroussa - Bouinan Blida</div>
                    <div><strong>📞 Téléphone:</strong> 0213 770 02 94 25 / 0213 770 02 94 26</div>
                    <div><strong>✉️ Email:</strong> Inspiredacademy@gmail.com</div>
                  </div>
                </div>
              </div>

              <!-- Invoice Type -->
              <div class="invoice-type">
                REÇU DE PAIEMENT
              </div>

              <!-- Invoice Number -->
              <div class="invoice-number">
                <div class="left">
                  <strong>N° de Reçu:</strong><br>
                  REC-${Date.now()}
                </div>
                <div class="right">
                  <strong>Date d'émission:</strong><br>
                  ${new Date(data.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              <div class="content-section">
              <div class="info-section">
                <h2>📋 Informations du Paiement</h2>
                <div class="info-row">
                  <div class="info-label">Nom de l'étudiant:</div>
                  <div class="info-value">${data.studentName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Formation:</div>
                  <div class="info-value">${data.courseTitle}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Type de paiement:</div>
                  <div class="info-value">${data.type}</div>
                </div>
              </div>

              <!-- Amount Section -->
              <div class="amount-section">
                <div class="label">💰 MONTANT PAYÉ</div>
                <div class="amount">${data.amount.toLocaleString(
                  "fr-FR"
                )} DA</div>
                <div class="label" style="margin-top: 15px; font-size: 16px; opacity: 0.9;">
                  Paiement en espèces
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>Merci pour votre confiance et votre inscription à nos formations.</p>
                <p>Ce reçu fait foi de paiement et doit être conservé précieusement.</p>
                <p class="important">📞 Pour toute question, contactez-nous au 0213 770 02 94 25 / 26</p>
              </div>

              <!-- Signature Section -->
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line">Signature de l'étudiant</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line">Cachet de l'école</div>
                </div>
              </div>
            </div>
            </div>
          </body>
          </html>
        `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();

    // Auto-print when page loads
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Reçu de Paiement</DialogTitle>
      <DialogContent>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Reçu de paiement généré avec succès !</p>
          <p>
            <strong>Étudiant:</strong> {data.studentName}
          </p>
          <p>
            <strong>Montant:</strong> {data.amount} DA
          </p>
          <p>
            <strong>Formation:</strong> {data.courseTitle}
          </p>
          <p>
            <strong>Date:</strong> {data.date}
          </p>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
        <Button
          variant="contained"
          startIcon={<Print />}
          onClick={generateReceipt}
        >
          Imprimer le Reçu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
