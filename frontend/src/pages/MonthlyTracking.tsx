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
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import PrintIcon from '@mui/icons-material/Print'
import PaymentIcon from '@mui/icons-material/Payment'
import { Tooltip } from '@mui/material'
import api from '../services/api'

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface SessionPayment {
  id: number
  amount: number
  paymentDate: string | null
  paymentMethod: string | null
  paymentType: string
}

interface Enrollment {
  id: number
  student: Student
  sessionPayments: SessionPayment[]
}

interface Session {
  id: number
  monthLabel: string
  price: number
  course: {
    title: string
  }
  trainer: {
    firstName: string
    lastName: string
  }
  enrollments: Enrollment[]
  capacity: number
}

export default function MonthlyTracking() {
  const queryClient = useQueryClient()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
  })

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['monthly-tracking', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get(`/sessions?month=${selectedMonth}&year=${selectedYear}`)
      return response.data.data || []
    },
  })

  // Mutation pour valider un paiement de session
  const validatePaymentMutation = useMutation({
    mutationFn: async (data: { enrollmentId: number; sessionId: number; amount: number; paymentMethod: string; paymentDate: string }) => {
      const response = await api.post(`/sessions/${data.sessionId}/payments`, {
        enrollmentId: data.enrollmentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        paymentType: 'SESSION_FEE',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-tracking'] })
      setOpenPaymentDialog(false)
      setSelectedEnrollment(null)
      setSelectedSession(null)
      setPaymentData({
        amount: '',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
      })
    },
  })

  const handleValidatePayment = (enrollment: Enrollment, session: Session) => {
    setSelectedEnrollment(enrollment)
    setSelectedSession(session)
    setPaymentData({
      ...paymentData,
      amount: session.price.toString(),
    })
    setOpenPaymentDialog(true)
  }

  const handleConfirmPayment = () => {
    if (selectedEnrollment && selectedSession) {
      validatePaymentMutation.mutate({
        enrollmentId: selectedEnrollment.id,
        sessionId: selectedSession.id,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
      })
    }
  }

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const getMonthLabel = (month: number, year: number) => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return `${monthNames[month - 1]} ${year}`
  }

  const getPaymentStatus = (enrollment: Enrollment, session: Session) => {
    const payment = enrollment.sessionPayments?.find(
      (p) => p.paymentType === 'SESSION_FEE'
    )
    
    if (payment && payment.paymentDate) {
      return { paid: true, amount: payment.amount, date: payment.paymentDate }
    }
    return { paid: false, amount: session.price, date: null }
  }

  const calculateSessionStats = (session: Session) => {
    let totalExpected = 0
    let totalPaid = 0
    let studentsPaid = 0
    let studentsUnpaid = 0

    session.enrollments?.forEach((enrollment) => {
      const status = getPaymentStatus(enrollment, session)
      totalExpected += session.price || 0
      if (status.paid) {
        totalPaid += status.amount
        studentsPaid++
      } else {
        studentsUnpaid++
      }
    })

    return { totalExpected, totalPaid, studentsPaid, studentsUnpaid }
  }

  const calculateMonthStats = () => {
    let totalExpected = 0
    let totalPaid = 0
    let totalSessions = 0
    let totalStudents = 0

    sessions?.forEach((session: Session) => {
      const stats = calculateSessionStats(session)
      totalExpected += stats.totalExpected
      totalPaid += stats.totalPaid
      totalSessions++
      totalStudents += session.enrollments?.length || 0
    })

    return { totalExpected, totalPaid, totalSessions, totalStudents }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  const monthStats = calculateMonthStats()

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Suivi Mensuel des Paiements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Contrôle détaillé par session et par étudiant
          </Typography>
        </Box>
      </Box>

      {/* Sélecteur de mois */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <IconButton onClick={handlePreviousMonth} color="primary">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" color="primary" fontWeight={600}>
          {getMonthLabel(selectedMonth, selectedYear)}
        </Typography>
        <IconButton onClick={handleNextMonth} color="primary">
          <ChevronRightIcon />
        </IconButton>
      </Paper>

      {/* Statistiques du mois */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Sessions du mois
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {monthStats.totalSessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Étudiants inscrits
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {monthStats.totalStudents}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Attendu
              </Typography>
              <Typography variant="h4" fontWeight={600} color="primary">
                {monthStats.totalExpected.toLocaleString()} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Encaissé
              </Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {monthStats.totalPaid.toLocaleString()} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des sessions */}
      <Box>
        {sessions && sessions.length > 0 ? (
          sessions.map((session: Session) => {
            const stats = calculateSessionStats(session)
            const collectionRate = stats.totalExpected > 0 
              ? Math.round((stats.totalPaid / stats.totalExpected) * 100) 
              : 0

            return (
              <Accordion key={session.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {session.course?.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Formateur: {session.trainer?.firstName} {session.trainer?.lastName}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${stats.studentsPaid}/${session.enrollments?.length || 0} payés`}
                      color={stats.studentsUnpaid === 0 ? 'success' : 'warning'}
                      size="small"
                    />
                    <Box sx={{ minWidth: 150, textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        Taux de recouvrement
                      </Typography>
                      <Typography variant="h6" color={collectionRate === 100 ? 'success.main' : 'warning.main'}>
                        {collectionRate}%
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 180, textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        {stats.totalPaid.toLocaleString()} / {stats.totalExpected.toLocaleString()} DA
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Étudiant</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell align="right">Montant</TableCell>
                          <TableCell>Statut</TableCell>
                          <TableCell>Date de paiement</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {session.enrollments && session.enrollments.length > 0 ? (
                          session.enrollments.map((enrollment: Enrollment) => {
                            const status = getPaymentStatus(enrollment, session)
                            return (
                              <TableRow key={enrollment.id}>
                                <TableCell>
                                  {enrollment.student?.firstName} {enrollment.student?.lastName}
                                </TableCell>
                                <TableCell>{enrollment.student?.email}</TableCell>
                                <TableCell align="right">
                                  <Typography fontWeight={600}>
                                    {status.amount.toLocaleString()} DA
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {status.paid ? (
                                    <Chip
                                      icon={<CheckCircleIcon />}
                                      label="Payé"
                                      color="success"
                                      size="small"
                                    />
                                  ) : (
                                    <Chip
                                      icon={<ErrorIcon />}
                                      label="Impayé"
                                      color="error"
                                      size="small"
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {status.paid && status.date
                                    ? new Date(status.date).toLocaleDateString('fr-FR')
                                    : '-'}
                                </TableCell>
                                <TableCell align="center">
                                  {status.paid ? (
                                    <Tooltip title="Imprimer le reçu">
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => window.open(`/print-receipt?type=SESSION&id=${enrollment.id}`, '_blank')}
                                      >
                                        <PrintIcon />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Valider le paiement">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => handleValidatePayment(enrollment, session)}
                                      >
                                        <PaymentIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              Aucun étudiant inscrit
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )
          })
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aucune session prévue pour ce mois
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Dialog de validation de paiement */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Valider le paiement mensuel
        </DialogTitle>
        <DialogContent>
          {selectedEnrollment && selectedSession && (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Étudiant: <strong>{selectedEnrollment.student?.firstName} {selectedEnrollment.student?.lastName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Formation: <strong>{selectedSession.course?.title}</strong> - {selectedSession.monthLabel}
              </Typography>

              <TextField
                fullWidth
                label="Montant"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                margin="normal"
                required
                InputProps={{
                  endAdornment: <Typography>DA</Typography>,
                }}
              />

              <TextField
                select
                fullWidth
                label="Mode de paiement"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="CASH">Espèces</MenuItem>
                <MenuItem value="CARD">Carte bancaire</MenuItem>
                <MenuItem value="TRANSFER">Virement</MenuItem>
                <MenuItem value="CHECK">Chèque</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Date de paiement"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Annuler</Button>
          <Button
            onClick={handleConfirmPayment}
            variant="contained"
            disabled={!paymentData.amount || validatePaymentMutation.isPending}
          >
            {validatePaymentMutation.isPending ? 'Validation...' : 'Valider le paiement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
