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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip,
} from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment'
import PrintIcon from '@mui/icons-material/Print'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import api from '../services/api'

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface Registration {
  id: number
  student: Student
  course: {
    id: number
    title: string
    price: number
  }
  registrationDate: string
  installmentPlan?: {
    totalAmount: number
    deposit: number
    numberOfInstallments: number
    installmentAmount: number
  }
  installmentPayments?: InstallmentPayment[]
}

interface InstallmentPayment {
  id: number
  installmentNumber: number
  amount: number
  dueDate: string
  paymentDate: string | null
  paymentMethod: string | null
  status: 'PENDING' | 'PAID' | 'OVERDUE'
}

export default function InstallmentPayments() {
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentPayment | null>(null)

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['installment-registrations'],
    queryFn: async () => {
      const response = await api.get('/registrations?hasInstallments=true')
      return response.data.data || []
    },
  })

  const createInstallmentPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post(`/registrations/${data.registrationId}/installment-plan`, data.plan)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment-registrations'] })
      setOpenDialog(false)
      setSelectedRegistration(null)
    },
  })

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post(`/installment-payments/${data.installmentId}/pay`, {
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment-registrations'] })
      setOpenPaymentDialog(false)
      setSelectedInstallment(null)
    },
  })

  const handleSubmitPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    const totalAmount = parseFloat(formData.get('totalAmount') as string)
    const deposit = parseFloat(formData.get('deposit') as string)
    const numberOfInstallments = parseInt(formData.get('numberOfInstallments') as string)
    
    const remainingAmount = totalAmount - deposit
    const installmentAmount = Math.round(remainingAmount / numberOfInstallments)

    createInstallmentPlanMutation.mutate({
      registrationId: selectedRegistration?.id,
      plan: {
        totalAmount,
        deposit,
        numberOfInstallments,
        installmentAmount,
      },
    })
  }

  const handleRecordPayment = (installment: InstallmentPayment) => {
    setSelectedInstallment(installment)
    setOpenPaymentDialog(true)
  }

  const handleSubmitPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    recordPaymentMutation.mutate({
      installmentId: selectedInstallment?.id,
      paymentMethod: formData.get('paymentMethod'),
      paymentDate: formData.get('paymentDate'),
    })
  }

  const getPaymentStatus = (installment: InstallmentPayment) => {
    if (installment.status === 'PAID') {
      return { label: 'Payé', color: 'success' as const, icon: <CheckCircleIcon /> }
    }
    if (installment.status === 'OVERDUE') {
      return { label: 'En retard', color: 'error' as const, icon: <PendingIcon /> }
    }
    return { label: 'En attente', color: 'warning' as const, icon: <PendingIcon /> }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Paiements Échelonnés
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des plans de paiement en plusieurs fois
          </Typography>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Plans actifs
              </Typography>
              <Typography variant="h4" fontWeight={600}>
                {registrations?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Montant total
              </Typography>
              <Typography variant="h4" fontWeight={600} color="primary">
                {registrations?.reduce((sum: number, r: Registration) => 
                  sum + (r.installmentPlan?.totalAmount || 0), 0
                ).toLocaleString()} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Paiements en attente
              </Typography>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {registrations?.reduce((sum: number, r: Registration) => 
                  sum + (r.installmentPayments?.filter(p => p.status !== 'PAID').length || 0), 0
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des inscriptions */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Étudiant</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell align="right">Montant total</TableCell>
              <TableCell align="right">Acompte</TableCell>
              <TableCell align="center">Tranches</TableCell>
              <TableCell align="center">Progression</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations && registrations.length > 0 ? (
              registrations.map((registration: Registration) => {
                const plan = registration.installmentPlan
                const payments = registration.installmentPayments || []
                const paidCount = payments.filter(p => p.status === 'PAID').length

                return (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {registration.student?.firstName} {registration.student?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {registration.student?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{registration.course?.title}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>
                        {plan?.totalAmount.toLocaleString()} DA
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {plan?.deposit.toLocaleString()} DA
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${paidCount}/${plan?.numberOfInstallments || 0}`}
                        color={paidCount === plan?.numberOfInstallments ? 'success' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', px: 2 }}>
                        <Stepper activeStep={paidCount} alternativeLabel>
                          {Array.from({ length: plan?.numberOfInstallments || 0 }).map((_, index) => (
                            <Step key={index}>
                              <StepLabel />
                            </Step>
                          ))}
                        </Stepper>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedRegistration(registration)
                          setOpenDialog(true)
                        }}
                      >
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    Aucun plan de paiement échelonné
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Détails et Paiements */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRegistration?.installmentPlan ? 'Détails du Plan de Paiement' : 'Créer un Plan de Paiement'}
        </DialogTitle>
        <DialogContent>
          {selectedRegistration?.installmentPlan ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRegistration.student?.firstName} {selectedRegistration.student?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Formation: {selectedRegistration.course?.title}
              </Typography>

              <Grid container spacing={2} mb={3}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Montant Total
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {selectedRegistration.installmentPlan.totalAmount.toLocaleString()} DA
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Acompte
                    </Typography>
                    <Typography variant="h5" fontWeight={600} color="success.main">
                      {selectedRegistration.installmentPlan.deposit.toLocaleString()} DA
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Par Tranche
                    </Typography>
                    <Typography variant="h5" fontWeight={600} color="primary">
                      {selectedRegistration.installmentPlan.installmentAmount.toLocaleString()} DA
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Échéances
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tranche</TableCell>
                      <TableCell align="right">Montant</TableCell>
                      <TableCell>Date limite</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Date de paiement</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRegistration.installmentPayments?.map((installment) => {
                      const status = getPaymentStatus(installment)
                      return (
                        <TableRow key={installment.id}>
                          <TableCell>Tranche {installment.installmentNumber}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600}>
                              {installment.amount.toLocaleString()} DA
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(installment.dueDate).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={status.icon}
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {installment.paymentDate
                              ? new Date(installment.paymentDate).toLocaleDateString('fr-FR')
                              : '-'}
                          </TableCell>
                          <TableCell align="center">
                            {installment.status === 'PAID' ? (
                              <Tooltip title="Imprimer le reçu">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => window.open(`/print-receipt?type=INSTALLMENT&id=${installment.id}`, '_blank')}
                                >
                                  <PrintIcon />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Enregistrer paiement">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleRecordPayment(installment)}
                                >
                                  <PaymentIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmitPlan}>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Définissez le plan de paiement pour {selectedRegistration?.student?.firstName}{' '}
                {selectedRegistration?.student?.lastName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="totalAmount"
                    label="Montant total"
                    type="number"
                    required
                    defaultValue={selectedRegistration?.course?.price || 0}
                    InputProps={{ endAdornment: 'DA' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="deposit"
                    label="Acompte à l'inscription"
                    type="number"
                    required
                    InputProps={{ endAdornment: 'DA' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="numberOfInstallments"
                    label="Nombre de tranches"
                    type="number"
                    required
                    inputProps={{ min: 1, max: 12 }}
                  />
                </Grid>
              </Grid>
              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                <Button type="submit" variant="contained" disabled={createInstallmentPlanMutation.isPending}>
                  Créer le plan
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        {selectedRegistration?.installmentPlan && (
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Fermer</Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Dialog Enregistrer Paiement */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Enregistrer le paiement</DialogTitle>
        <Box component="form" onSubmit={handleSubmitPayment}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Montant"
                  value={selectedInstallment?.amount.toLocaleString() + ' DA'}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="paymentDate"
                  label="Date de paiement"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  name="paymentMethod"
                  label="Mode de paiement"
                  required
                  defaultValue="CASH"
                >
                  <MenuItem value="CASH">Espèces</MenuItem>
                  <MenuItem value="CARD">Carte bancaire</MenuItem>
                  <MenuItem value="CHECK">Chèque</MenuItem>
                  <MenuItem value="TRANSFER">Virement</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPaymentDialog(false)}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={recordPaymentMutation.isPending}>
              Confirmer
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
