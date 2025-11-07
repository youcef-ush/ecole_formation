import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import api from '../services/api'

interface Trainer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  specialties: string[]
  bio: string
}

export default function Trainers() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null)

  const { data: trainers, isLoading } = useQuery<Trainer[]>({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers')
      return response.data.data || response.data
    },
  })

  const filteredTrainers = trainers?.filter((trainer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      trainer.firstName?.toLowerCase().includes(query) ||
      trainer.lastName?.toLowerCase().includes(query) ||
      trainer.email?.toLowerCase().includes(query) ||
      trainer.specialties?.some(spec => spec.toLowerCase().includes(query))
    )
  }) || []

  const handleRowClick = (trainer: Trainer) => {
    setSelectedTrainer(trainer)
    setOpenDetails(true)
  }

  const handleEditClick = () => {
    setOpenDetails(false)
    setOpenEdit(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/trainers/${selectedTrainer?.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setOpenEdit(false)
      setSelectedTrainer(null)
    },
  })

  const handleUpdateTrainer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      bio: formData.get('bio'),
    })
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Formateurs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez la liste de vos formateurs
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Ajouter un formateur
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom, email ou spécialité..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom complet</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Spécialités</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTrainers && filteredTrainers.length > 0 ? (
              filteredTrainers.map((trainer) => (
                <TableRow
                  key={trainer.id}
                  hover
                  onClick={() => handleRowClick(trainer)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{trainer.id}</TableCell>
                  <TableCell>
                    {trainer.firstName} {trainer.lastName}
                  </TableCell>
                  <TableCell>{trainer.email}</TableCell>
                  <TableCell>{trainer.phone}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {trainer.specialties?.map((spec, idx) => (
                        <Chip key={idx} label={spec} size="small" color="primary" />
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun formateur trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de détails formateur */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Détails du Formateur</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedTrainer && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {selectedTrainer.firstName} {selectedTrainer.lastName}
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                    {selectedTrainer.specialties?.map((spec, idx) => (
                      <Chip key={idx} label={spec} size="small" color="primary" />
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ID Formateur
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{selectedTrainer.id}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{selectedTrainer.email}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Téléphone
                </Typography>
                <Typography variant="body1">{selectedTrainer.phone}</Typography>
              </Grid>

              {selectedTrainer.bio && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Biographie
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                    <Typography variant="body2">{selectedTrainer.bio}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de modification formateur */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleUpdateTrainer}>
          <DialogTitle>
            <Typography variant="h6">Modifier le Formateur</Typography>
          </DialogTitle>
          <DialogContent>
            {selectedTrainer && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="firstName"
                    defaultValue={selectedTrainer.firstName}
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="lastName"
                    defaultValue={selectedTrainer.lastName}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={selectedTrainer.email}
                    disabled
                    helperText="L'email ne peut pas être modifié"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    name="phone"
                    defaultValue={selectedTrainer.phone}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Biographie"
                    name="bio"
                    defaultValue={selectedTrainer.bio}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)} disabled={updateMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
