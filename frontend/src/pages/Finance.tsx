import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

interface Course {
  id: number;
  title: string;
  type: string;
}

interface Payment {
  id: number;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  status: string;
  student: Student;
  course: Course;
}

interface Registration {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  course: Course;
  createdAt: string;
}

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openValidateDialog, setOpenValidateDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const queryClient = useQueryClient();

  // Récupérer les paiements
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get('/payments');
      return response.data.data || [];
    },
  });

  // Récupérer les inscriptions en attente
  const { data: pendingRegistrations, isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: ['registrations', 'pending'],
    queryFn: async () => {
      const response = await api.get('/registrations?status=En attente de paiement');
      return response.data.data || [];
    },
  });

  // Valider une inscription
  const validateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/registrations/${id}/validate`);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setOpenValidateDialog(false);
      setSelectedRegistration(null);
      setPaymentAmount('');
    },
  });

  // Refuser une inscription
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/registrations/${id}/reject`, {
        notes: 'Paiement refusé',
      });
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });

  const handleValidateClick = (registration: Registration) => {
    setSelectedRegistration(registration);
    setOpenValidateDialog(true);
  };

  const handleValidateConfirm = () => {
    if (!selectedRegistration) return;
    validateMutation.mutate(selectedRegistration.id);
  };

  const handleReject = (id: number) => {
    if (window.confirm('Refuser ce paiement ?')) {
      rejectMutation.mutate(id);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Payé':
      case 'Validé':
        return 'success';
      case 'En attente':
        return 'warning';
      case 'Refusé':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          💸 Gestion Financière
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Validation des Paiements" />
          <Tab label="Historique des Paiements" />
          <Tab label="Suivi Mensuel (À venir)" disabled />
        </Tabs>
      </Paper>

      {/* Tab 1: Validation des paiements */}
      {activeTab === 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Validez les inscriptions pour créer les comptes étudiants et donner accès aux formations.
          </Alert>

          {registrationsLoading ? (
            <Typography>Chargement...</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom et Prénom</TableCell>
                    <TableCell>Formation</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date de demande</TableCell>
                    <TableCell>État</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRegistrations && pendingRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            ✅ Aucune inscription en attente de validation
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRegistrations?.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <strong>{registration.firstName} {registration.lastName}</strong>
                        </TableCell>
                        <TableCell>{registration.course?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={registration.course?.type || 'N/A'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="🟡 En attente"
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Valider le paiement">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleValidateClick(registration)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Refuser">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleReject(registration.id)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Tab 2: Historique des paiements */}
      {activeTab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Historique de tous les paiements validés dans le système.
          </Alert>

          {paymentsLoading ? (
            <Typography>Chargement...</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Étudiant</TableCell>
                    <TableCell>Formation</TableCell>
                    <TableCell>Montant</TableCell>
                    <TableCell>Méthode</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments && payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            Aucun paiement enregistré
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.student ? (
                            <strong>
                              {payment.student.firstName} {payment.student.lastName}
                            </strong>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>{payment.course?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <strong>{payment.amount.toLocaleString()} DA</strong>
                        </TableCell>
                        <TableCell>
                          <Chip label={payment.paymentMethod} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            color={getPaymentStatusColor(payment.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Dialog Validation */}
      <Dialog open={openValidateDialog} onClose={() => setOpenValidateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Valider le Paiement</DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Cette action va créer un compte étudiant et donner accès à la formation.
              </Alert>

              <Typography variant="subtitle2" color="text.secondary">Étudiant</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{selectedRegistration.firstName} {selectedRegistration.lastName}</strong>
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Formation</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRegistration.course?.title}
              </Typography>

              <TextField
                fullWidth
                label="Montant payé (optionnel)"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                margin="normal"
                placeholder="Ex: 15000"
                helperText="Montant en Dinars Algériens (DA)"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenValidateDialog(false)}>Annuler</Button>
          <Button
            onClick={handleValidateConfirm}
            variant="contained"
            color="success"
            startIcon={<PaymentIcon />}
          >
            Valider le Paiement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Finance;
