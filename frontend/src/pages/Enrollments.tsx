import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import api from '../services/api';
import ReceiptModal from '../components/ReceiptModal';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  isRegistrationFeePaid: boolean;
}

interface Course {
  id: number;
  title: string;
  totalPrice: number;
  type: string;
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
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // New student fields
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  // Registration Fee state
  const [registrationFee, setRegistrationFee] = useState<string>('0');
  const [receiptData, setReceiptData] = useState<any>(null);

  // View installments dialog
  const [viewEnrollment, setViewEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/students'),
        api.get('/courses'),
        api.get('/enrollments'),
      ]);

      setStudents(studentsRes.data.data || []);
      setCourses(coursesRes.data.data || []);

      setEnrollments(enrollmentsRes.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedCourse) {
      setError('Veuillez sélectionner une formation');
      return;
    }

    if (!isNewStudent && !selectedStudent) {
      setError('Veuillez sélectionner un étudiant ou créer un nouveau');
      return;
    }

    if (isNewStudent && (!newStudentFirstName || !newStudentLastName || !newStudentPhone)) {
      setError('Veuillez remplir nom, prénom et téléphone pour le nouvel étudiant');
      return;
    }

    try {
      const feeAmount = parseInt(registrationFee || '0', 10);
      const payload: any = {
        courseId: selectedCourse.id,
        registrationFee: feeAmount,
      };

      if (isNewStudent) {
        payload.studentData = {
          firstName: newStudentFirstName,
          lastName: newStudentLastName,
          phone: newStudentPhone,
          email: newStudentEmail,
        };
      } else {
        payload.studentId = selectedStudent!.id;
      }

      const response = await api.post('/enrollments', payload);

      const newEnrollment = response.data;
      setEnrollments([newEnrollment, ...enrollments]);
      setSuccess('Inscription créée avec succès!');

      // If fee was paid, show receipt
      if (feeAmount > 0 && (!selectedStudent?.isRegistrationFeePaid || isNewStudent)) {
        console.log("Setting receipt data triggered");
        setReceiptData({
          studentName: isNewStudent ? `${newStudentFirstName} ${newStudentLastName}` : `${selectedStudent!.firstName} ${selectedStudent!.lastName}`,
          courseTitle: selectedCourse.title,
          amount: feeAmount,
          date: new Date().toLocaleDateString(),
          type: "Frais d'inscription"
        });
      }

      handleCloseDialog();
      // Reload students to update their status (isRegistrationFeePaid)
      loadData();

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setSelectedCourse(null);
    setIsNewStudent(false);
    setNewStudentFirstName('');
    setNewStudentLastName('');
    setNewStudentPhone('');
    setNewStudentEmail('');
    setRegistrationFee('0');
  };

  const handleValidate = async (enrollmentId: number) => {
    try {
      await api.put(`/enrollments/${enrollmentId}/status`, { status: 'COMPLETED' });
      setSuccess('Inscription validée avec succès!');
      // Reload data
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    }
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
                      label={enrollment.status === 'COMPLETED' ? 'Validé' : enrollment.status === 'ACTIVE' ? 'Actif' : enrollment.status}
                      color={enrollment.status === 'COMPLETED' ? 'success' : enrollment.status === 'ACTIVE' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setViewEnrollment(enrollment)}>
                      <Visibility />
                    </IconButton>
                    {enrollment.status === 'ACTIVE' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => handleValidate(enrollment.id)}
                        sx={{ ml: 1 }}
                      >
                        Valider
                      </Button>
                    )}
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={isNewStudent}
                  onChange={(e) => setIsNewStudent(e.target.checked)}
                />
              }
              label="Nouveau étudiant"
            />

            {isNewStudent ? (
              <>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={newStudentFirstName}
                  onChange={(e) => setNewStudentFirstName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Nom"
                  value={newStudentLastName}
                  onChange={(e) => setNewStudentLastName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Email (optionnel)"
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                />
              </>
            ) : (
              <Autocomplete
                options={students}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                value={selectedStudent}
                onChange={(_, value) => setSelectedStudent(value)}
                renderInput={(params) => <TextField {...params} label="Étudiant" required />}
              />
            )}

            {/* Logic for Registration Fee */}
            {(isNewStudent || (selectedStudent && !selectedStudent.isRegistrationFeePaid)) ? (
              <TextField
                fullWidth
                label="Frais d'inscription (Premier paiement)"
                type="number"
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
                helperText="Ce paiement valide le statut de l'étudiant."
              />
            ) : selectedStudent && selectedStudent.isRegistrationFeePaid ? (
              <Alert severity="info">Frais d'inscription déjà réglés pour cet étudiant.</Alert>
            ) : null}

            <Autocomplete
              options={courses}
              getOptionLabel={(option) => `${option.title} - ${option.totalPrice} DA`}
              value={selectedCourse}
              onChange={(_, value) => setSelectedCourse(value)}
              renderInput={(params) => <TextField {...params} label="Formation" required />}
            />
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

      <ReceiptModal
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
    </Box>
  );
}
