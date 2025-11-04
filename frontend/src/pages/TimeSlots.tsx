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
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface TimeSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  label: string;
  isActive: boolean;
}

const daysOfWeek = [
  { value: 'Lundi', label: 'Lundi' },
  { value: 'Mardi', label: 'Mardi' },
  { value: 'Mercredi', label: 'Mercredi' },
  { value: 'Jeudi', label: 'Jeudi' },
  { value: 'Vendredi', label: 'Vendredi' },
  { value: 'Samedi', label: 'Samedi' },
  { value: 'Dimanche', label: 'Dimanche' },
];

const TimeSlots: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    dayOfWeek: 'Lundi',
    startTime: '',
    endTime: '',
    label: '',
  });

  const queryClient = useQueryClient();

  // Récupérer les créneaux
  const { data: timeSlots, isLoading } = useQuery<TimeSlot[]>({
    queryKey: ['timeslots'],
    queryFn: async () => {
      const response = await api.get('/time-slots');
      return response.data.data;
    },
  });

  // Créer un créneau
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/time-slots', data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeslots'] });
      setOpenForm(false);
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Modifier un créneau
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await api.put(`/time-slots/${id}`, data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeslots'] });
      setOpenForm(false);
      setSelectedTimeSlot(null);
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  // Supprimer un créneau
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/time-slots/${id}`);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeslots'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const resetForm = () => {
    setFormData({
      dayOfWeek: 'Lundi',
      startTime: '',
      endTime: '',
      label: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.startTime || !formData.endTime) {
      alert('Veuillez remplir les heures de début et de fin');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('L\'heure de début doit être inférieure à l\'heure de fin');
      return;
    }

    if (selectedTimeSlot) {
      updateMutation.mutate({ id: selectedTimeSlot.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setFormData({
      dayOfWeek: timeSlot.dayOfWeek,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      label: timeSlot.label || '',
    });
    setOpenForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer ce créneau horaire ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedTimeSlot(null);
    resetForm();
  };

  const getDayColor = (day: string) => {
    const colors: { [key: string]: any } = {
      Lundi: 'primary',
      Mardi: 'secondary',
      Mercredi: 'success',
      Jeudi: 'info',
      Vendredi: 'warning',
      Samedi: 'error',
      Dimanche: 'default',
    };
    return colors[day] || 'default';
  };

  // Grouper par jour
  const groupedTimeSlots = timeSlots?.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as { [key: string]: TimeSlot[] });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ⏰ Gestion des Créneaux Horaires
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Ajouter un Créneau
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Les créneaux horaires définissent les plages de temps disponibles pour planifier les sessions.
      </Alert>

      {isLoading ? (
        <Typography>Chargement...</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {daysOfWeek.map((day) => {
            const slots = groupedTimeSlots?.[day.value] || [];
            if (slots.length === 0) return null;

            return (
              <Paper key={day.value} sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <Chip label={day.label} color={getDayColor(day.value)} sx={{ mr: 1 }} />
                  {slots.length} créneau(x)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Heure de début</TableCell>
                        <TableCell>Heure de fin</TableCell>
                        <TableCell>Label</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {slots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>
                            <strong>{slot.startTime}</strong>
                          </TableCell>
                          <TableCell>
                            <strong>{slot.endTime}</strong>
                          </TableCell>
                          <TableCell>{slot.label || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={slot.isActive ? 'Actif' : 'Inactif'}
                              color={slot.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Modifier">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleEdit(slot)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleDelete(slot.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          })}

          {(!groupedTimeSlots || Object.keys(groupedTimeSlots).length === 0) && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucun créneau horaire défini
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Dialog Formulaire */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTimeSlot ? 'Modifier le Créneau' : 'Nouveau Créneau'}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Jour de la semaine *"
            value={formData.dayOfWeek}
            onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
            margin="normal"
          >
            {daysOfWeek.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Heure de début *"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Heure de fin *"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Label (optionnel)"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            margin="normal"
            placeholder="Ex: Matinée, Après-midi, Soirée"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedTimeSlot ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeSlots;
