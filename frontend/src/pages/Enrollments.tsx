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
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Add, CheckCircle, Delete, Edit } from '@mui/icons-material';
import api from '../services/api';
import { enrollmentService, Enrollment, CreateEnrollmentData } from '../services/enrollmentService';
import { generateInvoice, generateInvoiceNumber, InvoiceData } from '../utils/invoiceGenerator';

interface Course {
  id: number;
  title: string;
  description?: string;
  price: number;
  registrationFee?: number;
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  
  // Payment validation dialog
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedEnrollmentForPayment, setSelectedEnrollmentForPayment] = useState<Enrollment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<CreateEnrollmentData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    courseId: 0,
  });
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollmentsData] = await Promise.all([
        api.get('/courses'),
        enrollmentService.getAllEnrollments(),
      ]);

      setCourses(coursesRes.data.data || []);
      setEnrollments(enrollmentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (enrollment?: Enrollment) => {
    if (enrollment) {
      setEditingEnrollment(enrollment);
      setFormData({
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        email: enrollment.email,
        phone: enrollment.phone,
        birthDate: enrollment.birthDate || '',
        address: enrollment.address || '',
        courseId: enrollment.courseId,
      });
      setSelectedCourseIds(enrollment.courseId ? [enrollment.courseId] : []);
    } else {
      setEditingEnrollment(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        address: '',
        courseId: 0,
      });
      setSelectedCourseIds([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEnrollment(null);
    setDialogError(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      address: '',
      courseId: 0,
    });
    setSelectedCourseIds([]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setDialogError('Nom, prénom et téléphone sont obligatoires');
      return;
    }

    setDialogError(null); // Reset error

    try {
      if (editingEnrollment) {
        // Update existing enrollment
        await enrollmentService.updateEnrollment(editingEnrollment.id, formData);
        setSuccess('Inscription mise à jour avec succès');
      } else {
        // Create enrollment with multiple courses
        const enrollmentPayload = {
          ...formData,
          courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
        };
        
        await enrollmentService.createEnrollment(enrollmentPayload);
        
        if (selectedCourseIds.length > 0) {
          setSuccess(`Inscription créée avec ${selectedCourseIds.length} formation(s)`);
        } else {
          setSuccess('Inscription créée avec succès (sans formation)');
        }
      }

      handleCloseDialog();
      loadData();
    } catch (err: any) {
      // Afficher l'erreur dans le dialog au lieu de fermer
      setDialogError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleOpenPaymentDialog = (enrollment: Enrollment) => {
    setSelectedEnrollmentForPayment(enrollment);
    setPaymentAmount(enrollment.registrationFee?.toString() || '');
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedEnrollmentForPayment(null);
    setPaymentAmount('');
  };

  const handleConfirmPayment = async () => {
    if (!selectedEnrollmentForPayment) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Le montant ne peut pas être négatif');
      return;
    }

    try {
      // Update registration fee first
      await enrollmentService.updateEnrollment(selectedEnrollmentForPayment.id, {
        registrationFee: amount
      });

      // Then mark as paid
      const result = await enrollmentService.markEnrollmentPaid(selectedEnrollmentForPayment.id);
      
      // Générer et imprimer la facture
      const invoiceData: InvoiceData = {
        invoiceNumber: generateInvoiceNumber(selectedEnrollmentForPayment.id),
        studentName: `${selectedEnrollmentForPayment.firstName} ${selectedEnrollmentForPayment.lastName}`,
        phone: selectedEnrollmentForPayment.phone,
        email: selectedEnrollmentForPayment.email,
        formationTitle: selectedEnrollmentForPayment.courseTitle || undefined,
        amount: amount,
        paymentDate: new Date(),
        enrollmentId: selectedEnrollmentForPayment.id,
      };
      
      generateInvoice(invoiceData);
      
      setSuccess(
        `✅ Paiement de ${amount} DA validé ! Étudiant créé avec QR code.\n` +
        `ID Étudiant: ${result.student.id}\n` +
        `Statut: ${result.student.status}\n` +
        `📄 Facture générée et envoyée à l'impression`
      );
      handleClosePaymentDialog();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation du paiement');
    }
  };

  const handleDelete = async (enrollment: Enrollment) => {
    if (!confirm(`Supprimer l'inscription de ${enrollment.firstName} ${enrollment.lastName} ?`)) {
      return;
    }

    try {
      await enrollmentService.deleteEnrollment(enrollment.id);
      setSuccess('Inscription supprimée avec succès');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusChip = (enrollment: Enrollment) => {
    if (enrollment.isRegistrationFeePaid) {
      return <Chip label="PAYÉ" color="success" size="small" />;
    }
    return <Chip label="EN ATTENTE" color="warning" size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inscriptions</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Inscription
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {success}
        </Alert>
      )}

      {/* Enrollments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom Complet</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Frais Inscription</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucune inscription. Cliquez sur "Nouvelle Inscription" pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    {enrollment.firstName} {enrollment.lastName}
                  </TableCell>
                  <TableCell>{enrollment.email || '-'}</TableCell>
                  <TableCell>{enrollment.phone}</TableCell>
                  <TableCell>{enrollment.courseTitle || `Formation #${enrollment.courseId}`}</TableCell>
                  <TableCell>
                    {enrollment.registrationFee ? `${enrollment.registrationFee} DA` : '-'}
                  </TableCell>
                  <TableCell>{getStatusChip(enrollment)}</TableCell>
                  <TableCell>
                    {new Date(enrollment.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {!enrollment.isRegistrationFeePaid && (
                      <>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(enrollment)}
                          title="Modifier"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenPaymentDialog(enrollment)}
                          title="Valider le paiement"
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(enrollment)}
                          title="Supprimer"
                        >
                          <Delete />
                        </IconButton>
                      </>
                    )}
                    {enrollment.isRegistrationFeePaid && (
                      <Typography variant="caption" color="text.secondary">
                        Payé le {new Date(enrollment.registrationFeePaidAt!).toLocaleDateString('fr-FR')}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEnrollment ? 'Modifier l\'inscription' : 'Nouvelle Inscription'}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" onClose={() => setDialogError(null)} sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom *"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom *"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de naissance"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Formations (optionnel)"
                value={selectedCourseIds}
                onChange={(e) => {
                  const value = e.target.value as unknown as number[];
                  setSelectedCourseIds(value);
                }}
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => {
                    const selectedArray = selected as number[];
                    if (selectedArray.length === 0) return 'Aucune formation sélectionnée';
                    return selectedArray
                      .map(id => courses.find(c => c.id === id)?.title)
                      .filter(Boolean)
                      .join(', ');
                  },
                }}
                helperText="Vous pouvez sélectionner plusieurs formations"
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title} - {course.price} DA
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEnrollment ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Validation Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Valider le paiement
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Étudiant:</strong> {selectedEnrollmentForPayment?.firstName} {selectedEnrollmentForPayment?.lastName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Formation:</strong> {selectedEnrollmentForPayment?.courseTitle || `Formation #${selectedEnrollmentForPayment?.courseId}`}
            </Typography>
            
            <TextField
              fullWidth
              label="Montant des frais d'inscription (DA)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              sx={{ mt: 3 }}
              autoFocus
              helperText="Saisissez le montant payé par l'étudiant (peut être 0 DA)"
              inputProps={{ min: 0, step: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Annuler</Button>
          <Button 
            onClick={handleConfirmPayment} 
            variant="contained" 
            color="success"
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            Valider le paiement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
