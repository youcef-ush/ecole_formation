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

interface Registration {
  id: number;
  student?: Student;
  courseIds?: number[]; // stored server-side
  courses?: Course[]; // expanded
  createdAt?: string;
  status: string; // PENDING/PAID/VALIDATED etc
  enrollmentIds?: number[];
}

export default function Enrollments() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // (No helper needed: registrations are unique per student)

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);

  // New student fields
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);

  // View installments dialog
  const [viewEnrollment, setViewEnrollment] = useState<Registration | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<string>('0');
  const [selectedRegistrationForPay, setSelectedRegistrationForPay] = useState<Registration | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/enrollments'),
      ]);

      setCourses(coursesRes.data.data || []);

      // Group enrollments by student to show one row per student (simple registration view)
      const enrollments = enrollmentsRes.data.data || enrollmentsRes.data || [];
      const map = new Map<number, any>();
      for (const e of enrollments) {
        const sid = e.student?.id || e.studentId;
        if (!map.has(sid)) {
          map.set(sid, {
            student: e.student,
            courses: [e.course],
            enrollmentIds: [e.id],
            createdAt: e.createdAt,
            payments: e.payments || [],
          });
        } else {
          const cur = map.get(sid);
          cur.courses.push(e.course);
          cur.enrollmentIds.push(e.id);
          cur.payments = cur.payments.concat(e.payments || []);
          if (new Date(e.createdAt) < new Date(cur.createdAt)) cur.createdAt = e.createdAt;
        }
      }

      const grouped = Array.from(map.values()).map((item) => ({
        id: item.enrollmentIds[0],
        student: item.student,
        courses: item.courses,
        courseIds: item.courses.map((c: any) => c.id),
        createdAt: item.createdAt,
        status: (item.payments && item.payments.length > 0) ? 'PAID' : 'PENDING',
        enrollmentIds: item.enrollmentIds,
      }));

      setRegistrations(grouped as any[]);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (selectedCourses.length === 0) {
      setError('Veuillez sélectionner au moins une formation');
      return;
    }

    if (!newStudentFirstName || !newStudentLastName || !newStudentPhone) {
      setError('Veuillez remplir nom, prénom et téléphone pour l\'étudiant');
      return;
    }

    try {

      // Create a single registration containing all selected courses
      const payload: any = {
        courseIds: selectedCourses.map(c => c.id),
      };

      // Basic flow: always provide student info from form (new student)
      payload.firstName = newStudentFirstName;
      payload.lastName = newStudentLastName;
      payload.phone = newStudentPhone;
      if (newStudentEmail) payload.email = newStudentEmail;

      await api.post('/enrollments', { studentData: payload, courseIds: payload.courseIds });

      // If a registration fee was provided, we'll expect admin to validate later.
      setSuccess("Inscription créée (statut PENDING). Affichez l'étudiant dans le tableau pour valider le paiement.");
      handleCloseDialog();
      // Refresh students to reflect possible registration fee state
      loadData();

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCourses([]);
    setNewStudentFirstName('');
    setNewStudentLastName('');
    setNewStudentPhone('');
    setNewStudentEmail('');
  };

  // Validation is handled via the pay dialog which creates a payment for the first enrollment then marks related enrollments as COMPLETED

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

      {/* Registrations Table (one row per student registration) */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Étudiant</TableCell>
              <TableCell>Formations</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucune inscription. Cliquez sur "Nouvelle Inscription" pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    {reg.student?.firstName} {reg.student?.lastName}
                  </TableCell>
                  <TableCell>
                    {reg.courses && reg.courses.length > 0 ? (
                      reg.courses.map(c => <Chip key={c.id} label={`${c.title}`} size="small" sx={{ mr: 0.5 }} />)
                    ) : (
                      reg.courseIds ? reg.courseIds.join(', ') : '-'
                    )}
                  </TableCell>
                  <TableCell>{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={reg.status}
                      color={reg.status === 'PAID' || reg.status === 'VALIDATED' ? 'success' : reg.status === 'PENDING' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setViewEnrollment(reg)}>
                      <Visibility />
                    </IconButton>
                    {reg.status === 'PENDING' && (
                      <Button size="small" variant="outlined" color="success" sx={{ ml: 1 }} onClick={() => { setSelectedRegistrationForPay(reg); setPayAmount('0'); setPayDialogOpen(true); }}>
                        Valider
                      </Button>
                    )}
                    {(reg.status === 'PAID' || reg.status === 'VALIDATED') && (
                      <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => {
                        // Build receipt data and open modal
                        setReceiptData({
                          studentName: `${reg.student?.firstName ?? ''} ${reg.student?.lastName ?? ''}`.trim(),
                          courseTitle: reg.courses ? reg.courses.map(c => c.title).join(', ') : (reg.courseIds ? reg.courseIds.join(', ') : ''),
                          amount: 0, // Not known here; the server could return payment info in a future iteration
                          date: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                          type: 'Frais d\'inscription'
                        });
                      }}>
                        Reçu
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Simple student fields (always new student for basic flow) */}
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

              <Autocomplete
                multiple
                options={courses}
                getOptionLabel={(option) => `${option.title} - ${option.totalPrice} DA`}
                value={selectedCourses}
                onChange={(_, newValue) => setSelectedCourses(newValue)}
                renderInput={(params) => <TextField {...params} label="Formations (Sélection multiple)" required />}
              />

              {/* Show selected courses in a simple table for clarity */}
              {selectedCourses.length > 0 && (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Formation</TableCell>
                        <TableCell>Prix</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCourses.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.title}</TableCell>
                          <TableCell>{c.totalPrice} DA</TableCell>
                          <TableCell>
                            <Button size="small" onClick={() => setSelectedCourses(prev => prev.filter(x => x.id !== c.id))}>Supprimer</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Créer</Button>
        </DialogActions>
      </Dialog>

      {/* Pay Dialog for registration fee */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Valider Frais d'inscription</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography>Étudiant: {selectedRegistrationForPay?.student?.firstName} {selectedRegistrationForPay?.student?.lastName}</Typography>
            <TextField label="Montant (DA)" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={async () => {
            if (!selectedRegistrationForPay) return;
            try {
              const amt = parseInt(payAmount || '0', 10);
              // Use first enrollment to record payment
              const firstEnrollmentId = selectedRegistrationForPay.enrollmentIds && selectedRegistrationForPay.enrollmentIds.length > 0 ? selectedRegistrationForPay.enrollmentIds[0] : null;
              if (!firstEnrollmentId) throw new Error('Aucune inscription trouvée pour cet étudiant');

              await api.post('/payments', { enrollmentId: firstEnrollmentId, amount: amt });

              // Mark all related enrollments as COMPLETED
              for (const id of selectedRegistrationForPay.enrollmentIds) {
                await api.put(`/enrollments/${id}/status`, { status: 'COMPLETED' });
              }

              setSuccess('Paiement enregistré et inscription validée.');
              setReceiptData({
                studentName: `${selectedRegistrationForPay.student?.firstName ?? ''} ${selectedRegistrationForPay.student?.lastName ?? ''}`.trim(),
                courseTitle: selectedRegistrationForPay.courses ? selectedRegistrationForPay.courses.map(c => c.title).join(', ') : (selectedRegistrationForPay.courseIds ? selectedRegistrationForPay.courseIds.join(', ') : ''),
                amount: amt,
                date: new Date().toLocaleDateString(),
                type: 'Frais d\'inscription',
              });

              setPayDialogOpen(false);
              setSelectedRegistrationForPay(null);
              // Refresh list
              loadData();
            } catch (e: any) {
              setError(e.response?.data?.message || 'Erreur lors du paiement');
            }
          }}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* View Installments Dialog */}
      <Dialog open={!!viewEnrollment} onClose={() => setViewEnrollment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Échéancier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle1">Étudiant: {viewEnrollment?.student?.firstName} {viewEnrollment?.student?.lastName}</Typography>
            <Typography variant="subtitle2">Formations sélectionnées:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {viewEnrollment?.courses && viewEnrollment.courses.length > 0 ? (
                viewEnrollment.courses.map(c => <Chip key={c.id} label={c.title} size="small" />)
              ) : (
                viewEnrollment?.courseIds ? <Typography>{viewEnrollment.courseIds.join(', ')}</Typography> : <Typography>-</Typography>
              )}
            </Box>
          </Box>
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
