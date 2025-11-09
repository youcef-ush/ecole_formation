import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PaymentSchedule {
  id: number;
  enrollmentId: number;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  status: 'En attente' | 'Payé' | 'En retard' | 'Paiement partiel' | 'Annulé';
  paidAmount: string;
  paidDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  enrollment: {
    id: number;
    student: {
      id: number;
      firstName: string;
      lastName: string;
      phone: string;
    };
    course: {
      id: number;
      title: string;
    };
  };
}

interface PaymentDialogData {
  scheduleId: number;
  currentAmount: number;
  remainingAmount: number;
  studentName: string;
  courseTitle: string;
  installmentNumber: number;
}

const PaymentSchedules: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentDialogData | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Formulaire de paiement
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Espèces',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    receivedBy: '',
    notes: '',
  });

  // Récupérer tous les échéanciers
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['paymentSchedules', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/payment-schedules${params}`);
      return response.data as PaymentSchedule[];
    },
  });

  // Mutation pour enregistrer un paiement
  const paymentMutation = useMutation({
    mutationFn: async (data: { scheduleId: number; paymentData: any }) => {
      const response = await api.post(`/payment-schedules/${data.scheduleId}/pay`, data.paymentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSchedules'] });
      setSnackbar({ open: true, message: 'Paiement enregistré avec succès', severity: 'success' });
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Erreur lors de l\'enregistrement', severity: 'error' });
    },
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      paymentMethod: 'Espèces',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      receivedBy: '',
      notes: '',
    });
    setSelectedSchedule(null);
  };

  const handlePayClick = (schedule: PaymentSchedule) => {
    const totalAmount = parseFloat(schedule.amount);
    const paidAmount = parseFloat(schedule.paidAmount);
    const remaining = totalAmount - paidAmount;

    setSelectedSchedule({
      scheduleId: schedule.id,
      currentAmount: totalAmount,
      remainingAmount: remaining,
      studentName: `${schedule.enrollment.student.firstName} ${schedule.enrollment.student.lastName}`,
      courseTitle: schedule.enrollment.course.title,
      installmentNumber: schedule.installmentNumber,
    });

    setPaymentForm({
      ...paymentForm,
      amount: remaining.toString(),
    });

    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedSchedule) return;

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({ open: true, message: 'Montant invalide', severity: 'error' });
      return;
    }

    if (amount > selectedSchedule.remainingAmount) {
      setSnackbar({ open: true, message: 'Le montant dépasse le reste à payer', severity: 'error' });
      return;
    }

    paymentMutation.mutate({
      scheduleId: selectedSchedule.scheduleId,
      paymentData: {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        reference: paymentForm.reference || undefined,
        receivedBy: paymentForm.receivedBy || undefined,
        notes: paymentForm.notes || undefined,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Payé':
        return 'success';
      case 'En attente':
        return 'warning';
      case 'En retard':
        return 'error';
      case 'Paiement partiel':
        return 'info';
      case 'Annulé':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Payé':
        return <CheckCircleIcon fontSize="small" />;
      case 'En retard':
        return <WarningIcon fontSize="small" />;
      case 'Paiement partiel':
        return <PaymentIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'student',
      headerName: 'Étudiant',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => (
        <Box>
          <Typography variant="body2" fontWeight="500">
            {params.row.enrollment.student.firstName} {params.row.enrollment.student.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.enrollment.student.phone}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'course',
      headerName: 'Formation',
      flex: 1,
      minWidth: 200,
      valueGetter: (_value, row) => row.enrollment.course.title,
    },
    {
      field: 'installmentNumber',
      headerName: 'Échéance N°',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => (
        <Chip label={`#${params.row.installmentNumber}`} size="small" />
      ),
    },
    {
      field: 'amount',
      headerName: 'Montant',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => (
        <Typography variant="body2" fontWeight="500">
          {parseFloat(params.row.amount).toLocaleString('fr-DZ')} DA
        </Typography>
      ),
    },
    {
      field: 'paidAmount',
      headerName: 'Payé',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => {
        const paid = parseFloat(params.row.paidAmount);
        const total = parseFloat(params.row.amount);
        const percentage = (paid / total) * 100;
        
        return (
          <Tooltip title={`${percentage.toFixed(0)}% payé`}>
            <Typography variant="body2" color={paid > 0 ? 'success.main' : 'text.secondary'}>
              {paid.toLocaleString('fr-DZ')} DA
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'dueDate',
      headerName: 'Date d\'échéance',
      width: 140,
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => {
        const dueDate = new Date(params.row.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today && params.row.status !== 'Payé';
        
        return (
          <Typography
            variant="body2"
            color={isOverdue ? 'error.main' : 'text.primary'}
            fontWeight={isOverdue ? 'bold' : 'normal'}
          >
            {format(dueDate, 'dd/MM/yyyy', { locale: fr })}
          </Typography>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 160,
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => (
        <Chip
          icon={getStatusIcon(params.row.status)}
          label={params.row.status}
          color={getStatusColor(params.row.status) as any}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<PaymentSchedule>) => (
        <Box>
          {params.row.status !== 'Payé' && params.row.status !== 'Annulé' && (
            <Tooltip title="Enregistrer un paiement">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handlePayClick(params.row)}
              >
                <PaymentIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Filtrer les données
  const filteredSchedules = schedules.filter((schedule) => {
    const searchLower = searchTerm.toLowerCase();
    const studentName = `${schedule.enrollment.student.firstName} ${schedule.enrollment.student.lastName}`.toLowerCase();
    const courseTitle = schedule.enrollment.course.title.toLowerCase();
    
    return studentName.includes(searchLower) || courseTitle.includes(searchLower);
  });

  // Calculer les statistiques
  const stats = {
    total: schedules.length,
    paid: schedules.filter(s => s.status === 'Payé').length,
    pending: schedules.filter(s => s.status === 'En attente').length,
    overdue: schedules.filter(s => s.status === 'En retard').length,
    partial: schedules.filter(s => s.status === 'Paiement partiel').length,
    totalAmount: schedules.reduce((sum, s) => sum + parseFloat(s.amount), 0),
    paidAmount: schedules.reduce((sum, s) => sum + parseFloat(s.paidAmount), 0),
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestion des Échéanciers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gérez tous les paiements échelonnés des formations
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Total échéances
              </Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography color="success.dark" variant="caption">
                Payées
              </Typography>
              <Typography variant="h5" color="success.dark">{stats.paid}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography color="warning.dark" variant="caption">
                En attente
              </Typography>
              <Typography variant="h5" color="warning.dark">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography color="error.dark" variant="caption">
                En retard
              </Typography>
              <Typography variant="h5" color="error.dark">{stats.overdue}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography color="info.dark" variant="caption">
                Partiels
              </Typography>
              <Typography variant="h5" color="info.dark">{stats.partial}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Montants */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Montant total
              </Typography>
              <Typography variant="h6">
                {stats.totalAmount.toLocaleString('fr-DZ')} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography color="success.dark" variant="body2">
                Montant encaissé
              </Typography>
              <Typography variant="h6" color="success.dark">
                {stats.paidAmount.toLocaleString('fr-DZ')} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography color="warning.dark" variant="body2">
                Reste à encaisser
              </Typography>
              <Typography variant="h6" color="warning.dark">
                {(stats.totalAmount - stats.paidAmount).toLocaleString('fr-DZ')} DA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtres et recherche */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Rechercher (étudiant, formation)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              size="small"
              label="Filtrer par statut"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="En attente">En attente</MenuItem>
              <MenuItem value="Payé">Payé</MenuItem>
              <MenuItem value="En retard">En retard</MenuItem>
              <MenuItem value="Paiement partiel">Paiement partiel</MenuItem>
              <MenuItem value="Annulé">Annulé</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setStatusFilter('');
                setSearchTerm('');
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredSchedules}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>

      {/* Dialog de paiement */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          resetPaymentForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enregistrer un paiement</DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Étudiant :</strong> {selectedSchedule.studentName}
                </Typography>
                <Typography variant="body2">
                  <strong>Formation :</strong> {selectedSchedule.courseTitle}
                </Typography>
                <Typography variant="body2">
                  <strong>Échéance N° :</strong> {selectedSchedule.installmentNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Montant total :</strong> {selectedSchedule.currentAmount.toLocaleString('fr-DZ')} DA
                </Typography>
                <Typography variant="body2" color="error">
                  <strong>Reste à payer :</strong> {selectedSchedule.remainingAmount.toLocaleString('fr-DZ')} DA
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Montant du paiement (DA)"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    inputProps={{ min: 0, max: selectedSchedule.remainingAmount, step: 100 }}
                    helperText={`Maximum : ${selectedSchedule.remainingAmount.toLocaleString('fr-DZ')} DA`}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Méthode de paiement"
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="Espèces">Espèces</MenuItem>
                    <MenuItem value="Carte bancaire">Carte bancaire</MenuItem>
                    <MenuItem value="Virement bancaire">Virement bancaire</MenuItem>
                    <MenuItem value="Chèque">Chèque</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Date du paiement"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Référence / N° de reçu"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="RECU-2025-001"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Encaissé par"
                    value={paymentForm.receivedBy}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receivedBy: e.target.value })}
                    placeholder="Nom de l'administrateur"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Informations complémentaires..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPaymentDialogOpen(false);
              resetPaymentForm();
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={paymentMutation.isPending}
          >
            {paymentMutation.isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentSchedules;
