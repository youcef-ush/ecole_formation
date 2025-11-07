import { Box, Typography, Grid, Divider, Paper } from '@mui/material'

interface PaymentReceiptProps {
  type: 'INSCRIPTION' | 'SESSION' | 'INSTALLMENT'
  receiptNumber: string
  date: string
  studentName: string
  studentEmail?: string
  courseName: string
  amount: number
  paymentMethod: string
  description?: string
  installmentNumber?: number
  totalInstallments?: number
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
      case 'INSCRIPTION':
        return 'REÇU DE PAIEMENT - FRAIS D\'INSCRIPTION'
      case 'SESSION':
        return 'REÇU DE PAIEMENT - FRAIS MENSUEL'
      case 'INSTALLMENT':
        return 'REÇU DE PAIEMENT - ÉCHÉANCE'
      default:
        return 'REÇU DE PAIEMENT'
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Espèces'
      case 'CARD':
        return 'Carte bancaire'
      case 'CHECK':
        return 'Chèque'
      case 'TRANSFER':
        return 'Virement bancaire'
      default:
        return method
    }
  }

  return (
    <Paper 
      sx={{ 
        p: 4, 
        maxWidth: 800, 
        margin: 'auto',
        '@media print': {
          boxShadow: 'none',
          margin: 0,
        }
      }}
    >
      {/* En-tête */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
          INSPIRED ACADEMY BY NANA
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Centre de Formation Professionnelle
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Centre de Formation Bouinan, Blida
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          📞 +213 770 029 426 / +213 770 029 425
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Titre du reçu */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h6" fontWeight={600}>
          {getTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Reçu N° {receiptNumber}
        </Typography>
      </Box>

      {/* Informations du paiement */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Date de paiement:
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {new Date(date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Étudiant:
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {studentName}
          </Typography>
          {studentEmail && (
            <Typography variant="body2" color="text.secondary">
              {studentEmail}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Formation:
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {courseName}
          </Typography>
        </Grid>

        {description && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Description:
            </Typography>
            <Typography variant="body1">
              {description}
            </Typography>
          </Grid>
        )}

        {type === 'INSTALLMENT' && installmentNumber && totalInstallments && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Échéance:
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              Tranche {installmentNumber} sur {totalInstallments}
            </Typography>
          </Grid>
        )}

        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Mode de paiement:
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {getPaymentMethodLabel(paymentMethod)}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Montant payé:
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {amount.toLocaleString()} DA
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Pied de page */}
      <Box textAlign="center" mt={4}>
        <Typography variant="body2" color="text.secondary">
          Merci pour votre confiance
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Ce reçu fait foi de paiement. À conserver précieusement.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
        </Typography>
      </Box>

      {/* Signature */}
      <Box mt={6} display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Signature de l'étudiant
          </Typography>
          <Box sx={{ borderTop: '1px solid #ccc', width: 150 }} />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" mb={4}>
            Cachet de l'école
          </Typography>
          <Box sx={{ borderTop: '1px solid #ccc', width: 150 }} />
        </Box>
      </Box>

      {/* Instructions d'impression (cachées à l'impression) */}
      <Box 
        mt={4} 
        p={2} 
        bgcolor="grey.100" 
        borderRadius={1}
        sx={{
          '@media print': {
            display: 'none',
          }
        }}
      >
        <Typography variant="caption" color="text.secondary">
          💡 Conseil: Utilisez Ctrl+P (ou Cmd+P) pour imprimer ce reçu
        </Typography>
      </Box>
    </Paper>
  )
}
