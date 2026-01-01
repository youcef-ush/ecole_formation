import { Box, Typography } from "@mui/material";

interface PaymentReceiptProps {
  type: "INSCRIPTION" | "SESSION" | "INSTALLMENT";
  receiptNumber: string;
  date: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  amount: number;
  paymentMethod: string;
  description?: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

export default function PaymentReceipt({
  type,
  receiptNumber,
  date,
  studentName,
  studentEmail,
  courseName,
  amount,
  paymentMethod,
  description,
  installmentNumber,
  totalInstallments,
}: PaymentReceiptProps) {
  const getTitle = () => {
    switch (type) {
      case "INSCRIPTION":
        return "REÇU DE PAIEMENT - FRAIS D'INSCRIPTION";
      case "SESSION":
        return "REÇU DE PAIEMENT - FRAIS MENSUEL";
      case "INSTALLMENT":
        return "REÇU DE PAIEMENT - ÉCHÉANCE";
      default:
        return "REÇU DE PAIEMENT";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Espèces";
      case "CARD":
        return "Carte bancaire";
      case "CHECK":
        return "Chèque";
      case "TRANSFER":
        return "Virement bancaire";
      default:
        return method;
    }
  };

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
        <title>Reçu de Paiement - ${receiptNumber}</title>
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
            ${getTitle()}
          </div>

          <!-- Invoice Number -->
          <div class="invoice-number">
            <div class="left">
              <strong>N° de Reçu:</strong><br>
              ${receiptNumber}
            </div>
            <div class="right">
              <strong>Date d'émission:</strong><br>
              ${new Date(date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div class="content-section">
          <div class="info-section">
            <h2>📋 Informations de l'Étudiant</h2>
            <div class="info-row">
              <div class="info-label">Nom complet:</div>
              <div class="info-value">${studentName}</div>
            </div>
            ${
              studentEmail
                ? `
            <div class="info-row">
              <div class="info-label">Email:</div>
              <div class="info-value">${studentEmail}</div>
            </div>
            `
                : ""
            }
            <div class="info-row">
              <div class="info-label">Formation(s):</div>
              <div class="info-value">${courseName}</div>
            </div>
            ${
              description
                ? `
            <div class="info-row">
              <div class="info-label">Description:</div>
              <div class="info-value">${description}</div>
            </div>
            `
                : ""
            }
            ${
              type === "INSTALLMENT" && installmentNumber && totalInstallments
                ? `
            <div class="info-row">
              <div class="info-label">Échéance:</div>
              <div class="info-value">Tranche ${installmentNumber} sur ${totalInstallments}</div>
            </div>
            `
                : ""
            }
          </div>

          <!-- Amount Section -->
          <div class="amount-section">
            <div class="label">💰 MONTANT PAYÉ</div>
            <div class="amount">${amount.toLocaleString("fr-FR")} DA</div>
            <div class="label" style="margin-top: 15px; font-size: 16px; opacity: 0.9;">
              Mode de paiement: ${getPaymentMethodLabel(paymentMethod)}
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
    <Box>
      <Box
        sx={{
          p: 2,
          border: "1px solid #ddd",
          borderRadius: 1,
          mb: 2,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Aperçu du reçu de paiement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cliquez sur "Imprimer" pour générer le reçu au format A4
        </Typography>
      </Box>

      <Box sx={{ textAlign: "center", mt: 2 }}>
        <button
          onClick={generateReceipt}
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🖨️ Imprimer le Reçu
        </button>
      </Box>
    </Box>
  );
}
