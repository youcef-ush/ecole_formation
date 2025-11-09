import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface OverdueSchedule {
  id: number;
  enrollmentId: number;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  status: string;
  paidAmount: string;
  enrollment: {
    id: number;
    student: {
      id: number;
      firstName: string;
      lastName: string;
      phone: string;
      user: {
        email: string;
      };
    };
    course: {
      id: number;
      title: string;
    };
  };
}

const OverduePayments: React.FC = () => {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  // Récupérer les paiements en retard
  const { data: overdueSchedules = [], isLoading } = useQuery({
    queryKey: ['overduePayments'],
    queryFn: async () => {
      const response = await api.get('/payment-schedules/overdue');
      return response.data as OverdueSchedule[];
    },
  });

  const handlePayClick = (scheduleId: number) => {
    // Rediriger vers la page des échéanciers avec dialog de paiement ouvert
    navigate(`/payment-schedules?pay=${scheduleId}`);
  };

  const handleContactStudent = (phone: string, email: string, studentName: string) => {
    setSnackbar({
      open: true,
      message: `Contact étudiant ${studentName} : ${phone} / ${email}`,
      severity: 'info',
    });
  };

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    return differenceInDays(today, due);
  };

  const getSeverityColor = (daysOverdue: number): 'warning' | 'error' => {
    return daysOverdue > 30 ? 'error' : 'warning';
  };

  const columns: GridColDef[] = [
    {
      field: 'student',
      headerName: 'Étudiant',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => {
        const student = params.row.enrollment.student;
        const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>
              {initials}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="500">
                {student.firstName} {student.lastName}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {student.phone}
                </Typography>
              </Stack>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'course',
      headerName: 'Formation',
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.enrollment.course.title,
    },
    {
      field: 'installmentNumber',
      headerName: 'Échéance',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => (
        <Chip 
          label={`#${params.row.installmentNumber}`} 
          size="small" 
          color="error" 
          variant="outlined"
        />
      ),
    },
    {
      field: 'dueDate',
      headerName: 'Date d\'échéance',
      width: 140,
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => {
        const dueDate = new Date(params.row.dueDate);
        
        return (
          <Typography variant="body2" color="error.main" fontWeight="bold">
            {format(dueDate, 'dd/MM/yyyy', { locale: fr })}
          </Typography>
        );
      },
    },
    {
      field: 'daysOverdue',
      headerName: 'Retard',
      width: 120,
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => {
        const days = getDaysOverdue(params.row.dueDate);
        const severity = getSeverityColor(days);
        
        return (
          <Chip
            icon={<WarningAmberIcon />}
            label={`${days} jour${days > 1 ? 's' : ''}`}
            color={severity}
            size="small"
          />
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Montant dû',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => {
        const totalAmount = parseFloat(params.row.amount);
        const paidAmount = parseFloat(params.row.paidAmount);
        const remaining = totalAmount - paidAmount;
        
        return (
          <Box>
            <Typography variant="body2" fontWeight="bold" color="error.main">
              {remaining.toLocaleString('fr-DZ')} DA
            </Typography>
            {paidAmount > 0 && (
              <Typography variant="caption" color="text.secondary">
                ({paidAmount.toLocaleString('fr-DZ')} payé)
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 150,
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => (
        <Chip
          label={params.row.status}
          color={params.row.status === 'En retard' ? 'error' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<OverdueSchedule>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Enregistrer un paiement">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handlePayClick(params.row.id)}
            >
              <PaymentIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Contacter l'étudiant">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleContactStudent(
                params.row.enrollment.student.phone,
                params.row.enrollment.student.user.email,
                `${params.row.enrollment.student.firstName} ${params.row.enrollment.student.lastName}`
              )}
            >
              <PhoneIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Calculer les statistiques
  const stats = {
    total: overdueSchedules.length,
    totalAmount: overdueSchedules.reduce((sum, s) => {
      const totalAmount = parseFloat(s.amount);
      const paidAmount = parseFloat(s.paidAmount);
      return sum + (totalAmount - paidAmount);
    }, 0),
    criticalCount: overdueSchedules.filter(s => getDaysOverdue(s.dueDate) > 30).length,
    averageDays: overdueSchedules.length > 0
      ? Math.round(overdueSchedules.reduce((sum, s) => sum + getDaysOverdue(s.dueDate), 0) / overdueSchedules.length)
      : 0,
  };

  // Grouper par étudiant
  const studentGroups = overdueSchedules.reduce((acc, schedule) => {
    const studentId = schedule.enrollment.student.id;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: schedule.enrollment.student,
        schedules: [],
        totalDue: 0,
      };
    }
    acc[studentId].schedules.push(schedule);
    const totalAmount = parseFloat(schedule.amount);
    const paidAmount = parseFloat(schedule.paidAmount);
    acc[studentId].totalDue += (totalAmount - paidAmount);
    return acc;
  }, {} as Record<number, any>);

  const uniqueStudents = Object.keys(studentGroups).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" fontSize="large" />
          Paiements en Retard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Liste des échéances non payées après leur date d'échéance
        </Typography>
      </Box>

      {/* Alerte si beaucoup de retards */}
      {stats.total > 10 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Attention !</strong> Vous avez {stats.total} paiements en retard représentant {stats.totalAmount.toLocaleString('fr-DZ')} DA.
            {stats.criticalCount > 0 && ` Dont ${stats.criticalCount} avec plus de 30 jours de retard.`}
          </Typography>
        </Alert>
      )}

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Typography color="error.dark" variant="caption" fontWeight="bold">
                TOTAL EN RETARD
              </Typography>
              <Typography variant="h4" color="error.dark" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="caption" color="error.dark">
                échéances impayées
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Typography color="warning.dark" variant="caption" fontWeight="bold">
                MONTANT TOTAL DÛ
              </Typography>
              <Typography variant="h5" color="warning.dark" fontWeight="bold">
                {stats.totalAmount.toLocaleString('fr-DZ')} DA
              </Typography>
              <Typography variant="caption" color="warning.dark">
                à encaisser d'urgence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.dark' }}>
            <CardContent>
              <Typography color="text.secondary" variant="caption" fontWeight="bold">
                RETARDS CRITIQUES
              </Typography>
              <Typography variant="h4" color="error.dark" fontWeight="bold">
                {stats.criticalCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {'>'}30 jours de retard
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption" fontWeight="bold">
                ÉTUDIANTS CONCERNÉS
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {uniqueStudents}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Retard moyen : {stats.averageDays} jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Message si aucun retard */}
      {stats.total === 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Excellent !</strong> Aucun paiement en retard pour le moment. 
            Tous les étudiants sont à jour dans leurs paiements.
          </Typography>
        </Alert>
      )}

      {/* Actions rapides */}
      {stats.total > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Actions rapides
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<EmailIcon />}
              size="small"
              onClick={() => setSnackbar({ 
                open: true, 
                message: 'Fonction d\'envoi d\'emails en masse à implémenter', 
                severity: 'info' 
              })}
            >
              Relancer tous par email
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<PhoneIcon />}
              size="small"
              onClick={() => setSnackbar({ 
                open: true, 
                message: 'Fonction d\'envoi de SMS en masse à implémenter', 
                severity: 'info' 
              })}
            >
              Envoyer SMS de rappel
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.print()}
            >
              Imprimer la liste
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Tableau */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={overdueSchedules}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'dueDate', sort: 'asc' }],
            },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: 'error.lighter',
              },
            },
          }}
        />
      </Paper>

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

export default OverduePayments;
