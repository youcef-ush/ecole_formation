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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Payment as PaymentIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Course {
  id: number;
  title: string;
  type: string;
}

interface Session {
  id: number;
  startDate: string;
  endDate: string;
  capacity: number;
  location: string;
  course: Course;
  courseId: number;
}

interface Registration {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  course: Course;
  session: Session;
  createdAt: string;
  validatedAt: string;
  registrationFee: number;
  registrationFeePaid: boolean;
  registrationFeePaidAt?: string;
  paymentMethod?: string;
  amountPaid?: number;
  isValidated: boolean;
  student?: {
    id: number;
    qrCode: string;
  };
}

const Registrations: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openValidationDialog, setOpenValidationDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    courseId: '',
    notes: '',
  });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'CASH',
    amountPaid: '',
  });
  const [validationData, setValidationData] = useState({
    registrationFee: '',
    paymentMethod: 'CASH',
    amountPaid: '',
  });

  const queryClient = useQueryClient();

  // Récupérer les inscriptions
  const { data: registrations, isLoading } = useQuery<Registration[]>({
    queryKey: ['registrations', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : '';
      const response = await api.get(`/registrations${params}`);
      return response.data.data;
    },
  });

  // Récupérer les formations
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data;
    },
  });

  // Créer une inscription
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/registrations', data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setOpenForm(false);
      resetForm();
      alert('✅ Inscription créée avec succès');
    },
    onError: (error: any) => {
      console.error('Erreur création inscription:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création';
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'DUPLICATE_STUDENT' || errorCode === 'DUPLICATE_REGISTRATION') {
        alert(`⚠️ ${errorMessage}\n\nVeuillez vérifier si cette personne est déjà inscrite ou enregistrée comme étudiant.`);
      } else {
        alert(`❌ ${errorMessage}`);
      }
    },
  });

  // Marquer le paiement
  const payMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof paymentData }) => {
      const response = await api.put(`/registrations/${id}/pay`, data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setOpenPaymentDialog(false);
      setSelectedRegistration(null);
      setPaymentData({ paymentMethod: 'CASH', amountPaid: '' });
    },
  });

  // Valider une inscription (crée l'étudiant avec QR Code)
  const validateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof validationData }) => {
      try {
        // D'abord enregistrer les frais et le paiement
        await api.put(`/registrations/${id}/pay`, {
          registrationFee: parseFloat(data.registrationFee),
          paymentMethod: data.paymentMethod,
          amountPaid: parseFloat(data.amountPaid),
        });
        
        // Ensuite valider l'inscription
        const response = await api.post(`/registrations/${id}/validate`);
        return response.data.data || response.data;
      } catch (error: any) {
        console.error('Erreur validation:', error);
        throw new Error(error.response?.data?.message || 'Erreur lors de la validation');
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setOpenValidationDialog(false);
      setSelectedRegistration(null);
      setValidationData({ registrationFee: '', paymentMethod: 'CASH', amountPaid: '' });
      alert(`✅ Étudiant créé avec succès!\nQR Code: ${data.student?.qrCode || 'N/A'}`);
    },
    onError: (error: any) => {
      console.error('Erreur complète:', error);
      alert(`❌ Erreur: ${error.message || 'Une erreur est survenue'}`);
    },
  });

  // Refuser une inscription
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/registrations/${id}/reject`);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });

  // Supprimer une inscription
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/registrations/${id}`);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      courseId: '',
      notes: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.courseId) {
      alert('Veuillez remplir tous les champs obligatoires (Nom, Prénom et Formation)');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleOpenPaymentDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    setPaymentData({
      paymentMethod: 'Espèces',
      amountPaid: registration.registrationFee?.toString() || '',
    });
    setOpenPaymentDialog(true);
  };

  const handleOpenValidationDialog = (registration: Registration) => {
    setSelectedRegistration(registration);
    setValidationData({
      registrationFee: registration.registrationFee?.toString() || '',
      paymentMethod: 'Espèces',
      amountPaid: registration.registrationFee?.toString() || '',
    });
    setOpenValidationDialog(true);
  };

  const handlePayment = () => {
    if (!selectedRegistration || !paymentData.amountPaid) {
      alert('Veuillez remplir tous les champs de paiement');
      return;
    }
    payMutation.mutate({
      id: selectedRegistration.id,
      data: paymentData,
    });
  };

  const handleValidate = () => {
    if (!selectedRegistration || !validationData.registrationFee || !validationData.amountPaid) {
      alert('Veuillez remplir tous les champs (Frais d\'inscription et Montant payé)');
      return;
    }
    validateMutation.mutate({
      id: selectedRegistration.id,
      data: validationData,
    });
  };

  const handleReject = (id: number) => {
    if (window.confirm('Refuser cette inscription ?')) {
      rejectMutation.mutate(id);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer cette inscription ?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'default';
      case 'Frais payés':
        return 'info';
      case 'Validée':
        return 'success';
      case 'Refusée':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente':
        return '⏳';
      case 'Frais payés':
        return '�';
      case 'Validée':
        return '✅';
      case 'Refusée':
        return '❌';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📝 Inscriptions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Nouvelle Inscription
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          select
          label="Filtrer par statut"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: 250 }}
          size="small"
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="En attente">⏳ En attente</MenuItem>
          <MenuItem value="Frais payés">💵 Frais payés</MenuItem>
          <MenuItem value="Validée">✅ Validée</MenuItem>
          <MenuItem value="Refusée">❌ Refusée</MenuItem>
        </TextField>
      </Paper>

      {isLoading ? (
        <Typography>Chargement...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom et Prénom</TableCell>
                <TableCell>Formation</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Frais</TableCell>
                <TableCell>Date de demande</TableCell>
                <TableCell>État</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations && registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Aucune inscription
                  </TableCell>
                </TableRow>
              ) : (
                registrations?.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <strong>{registration.firstName} {registration.lastName}</strong>
                      {registration.isValidated && registration.student?.qrCode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <QrCodeIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="success.main">
                            {registration.student.qrCode}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{registration.course?.title || 'N/A'}</TableCell>
                    <TableCell>
                      {registration.session ? (
                        <Box>
                          <Typography variant="body2">
                            📅 {new Date(registration.session.startDate).toLocaleDateString('fr-FR')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📍 {registration.session.location}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Non spécifié</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{registration.email || 'N/A'}</Typography>
                        <Typography variant="body2" color="text.secondary">{registration.phone || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {registration.registrationFee} DA
                        </Typography>
                        {registration.registrationFeePaid ? (
                          <Chip label="💵 Payé" color="success" size="small" />
                        ) : (
                          <Chip label="⏳ Non payé" color="warning" size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${getStatusIcon(registration.status)} ${registration.status}`}
                        color={getStatusColor(registration.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Bouton Payer (si non payé) */}
                        {!registration.registrationFeePaid && registration.status === 'En attente' && (
                          <Tooltip title="Enregistrer le paiement">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenPaymentDialog(registration)}
                            >
                              <PaymentIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton Valider (si payé mais pas validé) */}
                        {registration.registrationFeePaid && !registration.isValidated && registration.status !== 'Refusée' && (
                          <Tooltip title="Valider et créer l'étudiant avec QR Code">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleOpenValidationDialog(registration)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton Valider (si pas encore payé - validation directe avec paiement) */}
                        {!registration.registrationFeePaid && !registration.isValidated && registration.status !== 'Refusée' && (
                          <Tooltip title="Valider avec paiement (créer étudiant)">
                            <IconButton
                              color="success"
                              size="small"
                              onClick={() => handleOpenValidationDialog(registration)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton Refuser */}
                        {!registration.isValidated && (
                          <Tooltip title="Refuser">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleReject(registration.id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton Imprimer (si payé) */}
                        {registration.registrationFeePaid && (
                          <Tooltip title="Imprimer le reçu d'inscription">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => window.open(`/print-receipt?type=INSCRIPTION&id=${registration.id}`, '_blank')}
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton Supprimer (si pas validé) */}
                        {!registration.isValidated && (
                          <Tooltip title="Supprimer">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(registration.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* Bouton Détails */}
                        <Tooltip title="Détails">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setOpenDetails(true);
                            }}
                          >
                            <VisibilityIcon />
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

      {/* Dialog Formulaire */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle Inscription</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            📝 <strong>Nouveau Processus :</strong>
            <br />
            1️⃣ Création de l'inscription (candidature)
            <br />
            2️⃣ Validation par l'admin → Saisie des frais + paiement
            <br />
            3️⃣ Création automatique de l'étudiant avec <strong>QR Code</strong>
            <br />
            <br />
            💡 <em>L'email et le téléphone peuvent être partagés entre plusieurs étudiants (ex: enfants du même parent)</em>
          </Alert>
          <TextField
            fullWidth
            label="Prénom *"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Nom *"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email (optionnel)"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            helperText="Peut être partagé entre plusieurs étudiants (ex: enfants du même parent)"
          />
          <TextField
            fullWidth
            label="Téléphone (optionnel)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
            helperText="Peut être partagé entre plusieurs étudiants"
          />
          <TextField
            select
            fullWidth
            label="Formation *"
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            margin="normal"
          >
            {courses?.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title} ({course.type})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Paiement */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>💵 Enregistrer le Paiement</DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Candidat : <strong>{selectedRegistration.firstName} {selectedRegistration.lastName}</strong>
                <br />
                Formation : <strong>{selectedRegistration.course?.title}</strong>
                <br />
                Frais d'inscription : <strong>{selectedRegistration.registrationFee} DA</strong>
              </Alert>
              <TextField
                select
                fullWidth
                label="Méthode de paiement *"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                margin="normal"
              >
                <MenuItem value="Espèces">💵 Espèces</MenuItem>
                <MenuItem value="Carte bancaire">💳 Carte bancaire</MenuItem>
                <MenuItem value="Virement bancaire">🏦 Virement bancaire</MenuItem>
                <MenuItem value="Chèque">📝 Chèque</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Montant payé (DA) *"
                type="number"
                value={paymentData.amountPaid}
                onChange={(e) => setPaymentData({ ...paymentData, amountPaid: e.target.value })}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Annuler</Button>
          <Button onClick={handlePayment} variant="contained" color="success">
            Confirmer le Paiement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Validation (avec frais et paiement) */}
      <Dialog open={openValidationDialog} onClose={() => setOpenValidationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>✅ Valider l'Inscription et Créer l'Étudiant</DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>Candidat :</strong> {selectedRegistration.firstName} {selectedRegistration.lastName}
                <br />
                <strong>Formation :</strong> {selectedRegistration.course?.title}
                <br />
                <strong>Session :</strong> {selectedRegistration.session ? 
                  `${new Date(selectedRegistration.session.startDate).toLocaleDateString('fr-FR')} - ${selectedRegistration.session.location}` 
                  : 'N/A'}
              </Alert>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠️ Cette action va :
                <br />
                • Enregistrer les frais et le paiement
                <br />
                • Créer l'étudiant avec un <strong>QR Code unique</strong>
                <br />
                • Créer automatiquement l'affectation à la session
              </Alert>

              <TextField
                fullWidth
                label="Frais d'inscription (DA) *"
                type="number"
                value={validationData.registrationFee}
                onChange={(e) => setValidationData({ ...validationData, registrationFee: e.target.value })}
                margin="normal"
                helperText="Montant total des frais d'inscription"
              />

              <TextField
                select
                fullWidth
                label="Méthode de paiement *"
                value={validationData.paymentMethod}
                onChange={(e) => setValidationData({ ...validationData, paymentMethod: e.target.value })}
                margin="normal"
              >
                <MenuItem value="Espèces">💵 Espèces</MenuItem>
                <MenuItem value="Carte bancaire">💳 Carte bancaire</MenuItem>
                <MenuItem value="Virement bancaire">🏦 Virement bancaire</MenuItem>
                <MenuItem value="Chèque">📝 Chèque</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Montant payé (DA) *"
                type="number"
                value={validationData.amountPaid}
                onChange={(e) => setValidationData({ ...validationData, amountPaid: e.target.value })}
                margin="normal"
                helperText="Montant effectivement reçu"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenValidationDialog(false)}>Annuler</Button>
          <Button onClick={handleValidate} variant="contained" color="success" startIcon={<CheckCircleIcon />}>
            Valider et Créer l'Étudiant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Détails */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de l'inscription</DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Nom complet</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRegistration.firstName} {selectedRegistration.lastName}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Formation</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRegistration.course?.title}
              </Typography>

              {selectedRegistration.session && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Session</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    📅 Du {new Date(selectedRegistration.session.startDate).toLocaleDateString('fr-FR')} au {new Date(selectedRegistration.session.endDate).toLocaleDateString('fr-FR')}
                    <br />
                    📍 {selectedRegistration.session.location}
                    <br />
                    👥 {selectedRegistration.session.capacity} places
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRegistration.email || 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Téléphone</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedRegistration.phone || 'N/A'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
              <Chip
                label={`${getStatusIcon(selectedRegistration.status)} ${selectedRegistration.status}`}
                color={getStatusColor(selectedRegistration.status)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" color="text.secondary">Date de demande</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {new Date(selectedRegistration.createdAt).toLocaleString('fr-FR')}
              </Typography>

              {selectedRegistration.validatedAt && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Date de validation</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(selectedRegistration.validatedAt).toLocaleString('fr-FR')}
                  </Typography>
                </>
              )}

              {selectedRegistration.notes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body1">{selectedRegistration.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Registrations;
