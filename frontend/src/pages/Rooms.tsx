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
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  description: string;
  isActive: boolean;
}

const Rooms: React.FC = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Théorique',
    capacity: '',
    description: '',
  });

  const queryClient = useQueryClient();

  // Récupérer les salles
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await api.get('/rooms');
      return response.data.data;
    },
  });

  // Créer une salle
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/rooms', {
        ...data,
        capacity: parseInt(data.capacity),
      });
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setOpenForm(false);
      resetForm();
    },
  });

  // Modifier une salle
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await api.put(`/rooms/${id}`, {
        ...data,
        capacity: parseInt(data.capacity),
      });
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setOpenForm(false);
      setSelectedRoom(null);
      resetForm();
    },
  });

  // Supprimer une salle
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/rooms/${id}`);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Théorique',
      capacity: '',
      description: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.capacity) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedRoom) {
      updateMutation.mutate({ id: selectedRoom.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity.toString(),
      description: room.description || '',
    });
    setOpenForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer cette salle ? (Impossible si des sessions sont actives)')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedRoom(null);
    resetForm();
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'Théorique':
        return 'primary';
      case 'Pratique':
        return 'success';
      case 'Informatique':
        return 'info';
      case 'Atelier':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'Théorique':
        return '📚';
      case 'Pratique':
        return '🔧';
      case 'Informatique':
        return '💻';
      case 'Atelier':
        return '🏭';
      default:
        return '🏫';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🏫 Gestion des Salles
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Ajouter une Salle
        </Button>
      </Box>

      {isLoading ? (
        <Typography>Chargement...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom de la Salle</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Capacité</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms && rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucune salle
                  </TableCell>
                </TableRow>
              ) : (
                rooms?.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <strong>{room.name}</strong>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${getRoomTypeIcon(room.type)} ${room.type}`}
                        color={getRoomTypeColor(room.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${room.capacity} places`} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>{room.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={room.isActive ? 'Active' : 'Inactive'}
                        color={room.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Modifier">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEdit(room)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(room.id)}
                          >
                            <DeleteIcon />
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
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRoom ? 'Modifier la Salle' : 'Nouvelle Salle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom de la Salle *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            placeholder="Ex: Salle A, Atelier Cuisine 1"
          />
          <TextField
            select
            fullWidth
            label="Type *"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            margin="normal"
          >
            <MenuItem value="Théorique">📚 Théorique</MenuItem>
            <MenuItem value="Pratique">🔧 Pratique</MenuItem>
            <MenuItem value="Informatique">💻 Informatique</MenuItem>
            <MenuItem value="Atelier">🏭 Atelier</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Capacité (nombre de places) *"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            margin="normal"
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            placeholder="Équipements, localisation, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedRoom ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Rooms;
