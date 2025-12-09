import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Autocomplete,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import api from '../services/api';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

interface Course {
  id: number;
  title: string;
  totalPrice: number;
  type: string;
}

interface PaymentPlan {
  id: number;
  name: string;
  installmentsCount: number;
  intervalDays: number;
}

interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  startDate: string;
  status: string;
  student?: Student;
  course?: Course;
  installments?: Installment[];
}

interface Installment {
  id: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | ''>('');

  // View installments dialog
  const [viewEnrollment, setViewEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes, plansRes] = await Promise.all([
        api.get('/students'),
        api.get('/courses'),
        api.get('/payment-plans').catch(() => ({ data: { data: [] } })), // Fallback if endpoint doesn't exist yet
      ]);

      setStudents(studentsRes.data.data || []);
      setCourses(coursesRes.data.data || []);
      setPaymentPlans(plansRes.data?.data || [
        { id: 1, name: 'Paiement Unique', installmentsCount: 1, intervalDays: 0 },
        { id: 2, name: 'Mensuel', installmentsCount: 3, intervalDays: 30 },
        { id: 3, name: '3 Tranches', installmentsCount: 3, intervalDays: 30 },
      ]);

      // Load enrollments (we don't have a list endpoint yet, so we'll skip for now)
      setEnrollments([]);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedStudent || !selectedCourse || !selectedPlan) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await api.post('/enrollments', {
        studentId: selectedStudent.id,
        courseId: selectedCourse.id,
        paymentPlanId: selectedPlan,
      });

      const newEnrollment = response.data;
      setEnrollments([newEnrollment, ...enrollments]);
      setSuccess('Inscription créée avec succès!');
      handleCloseDialog();

      // Show installments dialog
      setTimeout(() => {
        setViewEnrollment(newEnrollment);
      }, 500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setSelectedCourse(null);
    setSelectedPlan('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inscriptions</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Nouvelle Inscription
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Enrollments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Étudiant</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Date Début</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucune inscription. Cliquez sur "Nouvelle Inscription" pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {enrollment.student?.firstName} {enrollment.student?.lastName}
                  </TableCell>
                  <TableCell>{enrollment.course?.title}</TableCell>
                  <TableCell>{enrollment.startDate}</TableCell>
                  <TableCell>
                    <Chip
                      label={enrollment.status}
                      color={enrollment.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setViewEnrollment(enrollment)}>
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle Inscription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              value={selectedStudent}
              onChange={(_, value) => setSelectedStudent(value)}
              renderInput={(params) => <TextField {...params} label="Étudiant" />}
            />

            <Autocomplete
              options={courses}
              getOptionLabel={(option) => `${option.title} - ${option.totalPrice} DA`}
              value={selectedCourse}
              onChange={(_, value) => setSelectedCourse(value)}
              renderInput={(params) => <TextField {...params} label="Formation" />}
            />

            <FormControl fullWidth>
              <InputLabel>Plan de Paiement</InputLabel>
              <Select
                value={selectedPlan}
                label="Plan de Paiement"
                onChange={(e) => setSelectedPlan(Number(e.target.value))}
              >
                {paymentPlans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.installmentsCount} échéance{plan.installmentsCount > 1 ? 's' : ''})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Créer</Button>
        </DialogActions>
      </Dialog>

      {/* View Installments Dialog */}
      <Dialog open={!!viewEnrollment} onClose={() => setViewEnrollment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Échéancier</DialogTitle>
        <DialogContent>
          {viewEnrollment?.installments && viewEnrollment.installments.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewEnrollment.installments.map((inst, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{inst.dueDate}</TableCell>
                    <TableCell>{inst.amount} DA</TableCell>
                    <TableCell>
                      <Chip
                        label={inst.isPaid ? 'Payé' : 'À payer'}
                        color={inst.isPaid ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography>Aucune échéance trouvée.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewEnrollment(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
