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
}

const Registrations: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    courseId: '',
    sessionId: '',
    notes: '',
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

  // Récupérer les sessions disponibles (filtrées par formation si sélectionnée)
  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['sessions', formData.courseId],
    queryFn: async () => {
      const response = await api.get('/sessions');
      return response.data.data;
    },
    enabled: openForm, // Charger uniquement quand le formulaire est ouvert
  });

  // Filtrer les sessions par formation sélectionnée
  const filteredSessions = sessions?.filter(
    (session) => !formData.courseId || session.courseId === parseInt(formData.courseId)
  );

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
      sessionId: '',
      notes: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.courseId || !formData.sessionId) {
      alert('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Formation et Session)');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleValidate = (id: number) => {
    if (window.confirm('Valider cette inscription et créer l\'étudiant ?')) {
      validateMutation.mutate(id);
    }
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
      case 'En attente de paiement':
        return 'warning';
      case 'Validée par Finance':
        return 'success';
      case 'Refusée':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente de paiement':
        return '🟡';
      case 'Validée par Finance':
        return '🟢';
      case 'Refusée':
        return '🔴';
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
          <MenuItem value="En attente de paiement">🟡 En attente de paiement</MenuItem>
          <MenuItem value="Validée par Finance">🟢 Validée par Finance</MenuItem>
          <MenuItem value="Refusée">🔴 Refusée</MenuItem>
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
                <TableCell>Date de demande</TableCell>
                <TableCell>État</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations && registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucune inscription
                  </TableCell>
                </TableRow>
              ) : (
                registrations?.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <strong>{registration.firstName} {registration.lastName}</strong>
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
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {registration.status === 'En attente de paiement' && (
                          <>
                            <Tooltip title="Valider (Créer étudiant)">
                              <IconButton
                                color="success"
                                size="small"
                                onClick={() => handleValidate(registration.id)}
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
                          </>
                        )}
                        {registration.status !== 'Validée par Finance' && (
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
            📝 L'inscription sera créée avec le statut "En attente de paiement"
            <br />
            🎓 Après validation par Finance : Compte étudiant + Affectation à la session automatiques
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
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Téléphone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Formation *"
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value, sessionId: '' })}
            margin="normal"
          >
            {courses?.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title} ({course.type})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Session *"
            value={formData.sessionId}
            onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
            margin="normal"
            disabled={!formData.courseId}
            helperText={!formData.courseId ? 'Veuillez d\'abord sélectionner une formation' : ''}
          >
            {filteredSessions?.length === 0 ? (
              <MenuItem disabled>Aucune session disponible</MenuItem>
            ) : (
              filteredSessions?.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  📅 {new Date(session.startDate).toLocaleDateString('fr-FR')} - {new Date(session.endDate).toLocaleDateString('fr-FR')} | 
                  📍 {session.location} | 
                  👥 {session.capacity} places
                </MenuItem>
              ))
            )}
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
