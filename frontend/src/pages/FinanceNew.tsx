import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import PaymentIcon from '@mui/icons-material/Payment'
import api from '../services/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function FinanceNew() {
  const [tabValue, setTabValue] = useState(0)
  const [paymentDialog, setPaymentDialog] = useState<any>(null)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Espèces',
    reference: '',
    notes: '',
  })

  const queryClient = useQueryClient()

  // Frais d'inscription
  const { data: registrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ['registration-fees'],
    queryFn: async () => {
      const response = await api.get('/finance/registration-fees')
      return response.data.data || response.data
    },
  })

  // Suivi mensuel
  const { data: monthlyTracking, isLoading: loadingMonthly } = useQuery({
    queryKey: ['monthly-tracking'],
    queryFn: async () => {
      const response = await api.get('/finance/monthly-tracking')
      return response.data.data || response.data
    },
  })

  // Mutation pour payer les frais d'inscription
  const payRegistrationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/finance/registration-fees/${data.id}/pay`, data.paymentData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-fees'] })
      setPaymentDialog(null)
      alert('Paiement enregistré avec succès !')
    },
  })

  // Mutation pour payer une session
  const paySessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/finance/session-payments/pay', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-tracking'] })
      setPaymentDialog(null)
      alert('Paiement enregistré avec succès !')
    },
  })

  const handlePayRegistration = (registration: any) => {
    setPaymentDialog({ type: 'registration', data: registration })
    setPaymentData({
      amount: registration.registrationFee || '5000',
      paymentMethod: 'Espèces',
      reference: '',
      notes: '',
    })
  }

  const handlePaySession = (student: any, month: any) => {
    setPaymentDialog({ type: 'session', student, month })
    setPaymentData({
      amount: month.price.toString(),
      paymentMethod: 'Espèces',
      reference: '',
      notes: '',
    })
  }

  const handleConfirmPayment = () => {
    if (paymentDialog.type === 'registration') {
      payRegistrationMutation.mutate({
        id: paymentDialog.data.id,
        paymentData: {
          ...paymentData,
          amount: parseFloat(paymentData.amount),
        },
      })
    } else {
      paySessionMutation.mutate({
        studentId: paymentDialog.student.studentId,
        sessionId: paymentDialog.month.sessionId,
        ...paymentData,
        amount: parseFloat(paymentData.amount),
      })
    }
  }

  if (loadingRegistrations && loadingMonthly) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        💰 Gestion Financière
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Suivi des paiements - Frais d'inscription et sessions mensuelles
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab label="📝 Frais d'Inscription" />
          <Tab label="📅 Suivi Mensuel (Sessions)" />
        </Tabs>
      </Box>

      {/* TAB 1: Frais d'inscription */}
      <TabPanel value={tabValue} index={0}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Les frais d'inscription doivent être payés UNE SEULE FOIS pour devenir étudiant officiel.
        </Alert>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Candidat</TableCell>
                <TableCell>Formation</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Frais</TableCell>
                <TableCell>Statut Paiement</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations && registrations.length > 0 ? (
                registrations.map((reg: any) => (
                  <TableRow key={reg.id}>
                    <TableCell>{reg.id}</TableCell>
                    <TableCell>
                      {reg.firstName} {reg.lastName}
                    </TableCell>
                    <TableCell>{reg.course?.title || 'N/A'}</TableCell>
                    <TableCell>{reg.phone}</TableCell>
                    <TableCell>{reg.registrationFee || 5000} DA</TableCell>
                    <TableCell>
                      {reg.registrationFeePaid ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Payé"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<PendingIcon />}
                          label="Impayé"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {!reg.registrationFeePaid && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => handlePayRegistration(reg)}
                        >
                          Enregistrer Paiement
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucune inscription en attente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* TAB 2: Suivi mensuel */}
      <TabPanel value={tabValue} index={1}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Suivi des paiements MENSUELS pour chaque session. Un étudiant doit payer chaque mois
          pour assister aux cours.
        </Alert>

        {monthlyTracking && monthlyTracking.length > 0 ? (
          monthlyTracking.map((student: any) => (
            <Paper key={student.studentId} sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                👤 {student.studentName}
                <Chip label={student.courseTitle} color="primary" size="small" sx={{ ml: 2 }} />
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email: {student.studentEmail}
              </Typography>

              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mois</TableCell>
                      <TableCell>Période</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Payé</TableCell>
                      <TableCell>Reste</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {student.months.map((month: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <strong>{month.monthLabel || `Mois ${month.month}`}</strong>
                        </TableCell>
                        <TableCell>
                          {new Date(month.startDate).toLocaleDateString('fr-FR')} -{' '}
                          {new Date(month.endDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{month.price} DA</TableCell>
                        <TableCell>{month.totalPaid} DA</TableCell>
                        <TableCell>
                          {month.remainingAmount > 0 ? (
                            <span style={{ color: 'red' }}>{month.remainingAmount} DA</span>
                          ) : (
                            '0 DA'
                          )}
                        </TableCell>
                        <TableCell>
                          {month.isPaid ? (
                            <Chip label="Payé" color="success" size="small" />
                          ) : (
                            <Chip label="Impayé" color="error" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {!month.isPaid && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handlePaySession(student, month)}
                            >
                              Payer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))
        ) : (
          <Alert severity="warning">Aucun suivi mensuel disponible</Alert>
        )}
      </TabPanel>

      {/* Dialog de paiement */}
      <Dialog open={!!paymentDialog} onClose={() => setPaymentDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          💳 Enregistrer un paiement
          {paymentDialog?.type === 'session' && (
            <Typography variant="body2" color="text.secondary">
              {paymentDialog.student?.studentName} - {paymentDialog.month?.monthLabel}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Montant (DA)"
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              fullWidth
            />
            <TextField
              label="Méthode de paiement"
              select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              fullWidth
            >
              <MenuItem value="Espèces">Espèces</MenuItem>
              <MenuItem value="Chèque">Chèque</MenuItem>
              <MenuItem value="Virement bancaire">Virement bancaire</MenuItem>
              <MenuItem value="Carte bancaire">Carte bancaire</MenuItem>
            </TextField>
            <TextField
              label="Référence (optionnel)"
              value={paymentData.reference}
              onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
              fullWidth
            />
            <TextField
              label="Notes (optionnel)"
              multiline
              rows={3}
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(null)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleConfirmPayment}
            disabled={!paymentData.amount}
          >
            Confirmer le paiement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
