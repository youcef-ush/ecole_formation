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
  Alert,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import api from '../services/api'

interface Trainer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  specialties: string[]
  bio: string
  cv?: string
  courses?: Course[]
}

interface Course {
  id: number
  title: string
  category: string
  durationMonths: number
  price: number
}

export default function Trainers() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null)

  const { data: trainers, isLoading } = useQuery<Trainer[]>({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers')
      return response.data.data || response.data
    },
  })

  // Charger les formations d'un formateur spécifique
  const { data: trainerCourses } = useQuery<Course[]>({
    queryKey: ['trainer-courses', selectedTrainer?.id],
    queryFn: async () => {
      if (!selectedTrainer?.id) return []
      const response = await api.get(`/trainers/${selectedTrainer.id}/courses`)
      return response.data.data || response.data
    },
    enabled: !!selectedTrainer?.id && openDetails,
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/trainers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setOpenCreate(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/trainers/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      setOpenDelete(false)
      setOpenDetails(false)
      setSelectedTrainer(null)
    },
  })

  const handleConfirmDelete = () => {
    if (selectedTrainer) {
      deleteMutation.mutate(selectedTrainer.id)
    }
  }

  const handleUpdateTrainer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      bio: formData.get('bio'),
      cv: formData.get('cv'),
    })
  }

  const handleCreateTrainer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      specialties: formData.get('specialties') 
        ? (formData.get('specialties') as string).split(',').map(s => s.trim())
        : [],
      bio: formData.get('bio'),
      cv: formData.get('cv'),
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
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

              {selectedTrainer.cv && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    CV
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`${import.meta.env.VITE_API_URL}/uploads/${selectedTrainer.cv}`, '_blank')
                      }}
                    >
                      Voir le CV
                    </Button>
                    <Chip label={selectedTrainer.cv} size="small" />
                  </Box>
                </Grid>
              )}

              {/* Formations du formateur */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Formations assurées
                </Typography>
                {trainerCourses && trainerCourses.length > 0 ? (
                  <TableContainer component={Paper} sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Formation</TableCell>
                          <TableCell>Catégorie</TableCell>
                          <TableCell>Durée</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trainerCourses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell>{course.title}</TableCell>
                            <TableCell>
                              <Chip label={course.category} size="small" />
                            </TableCell>
                            <TableCell>{course.durationMonths} mois</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucune formation assignée
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={() => {
              setOpenDetails(false)
              setOpenDelete(true)
            }}
          >
            Supprimer
          </Button>
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

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    CV (Optionnel)
                  </Typography>
                  {selectedTrainer.cv && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip label={selectedTrainer.cv} />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/trainers/${selectedTrainer.id}/cv`, '_blank')}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={async () => {
                          if (confirm('Supprimer le CV ?')) {
                            await api.delete(`/trainers/${selectedTrainer.id}/cv`)
                            queryClient.invalidateQueries({ queryKey: ['trainers'] })
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                  >
                    {selectedTrainer.cv ? 'Remplacer le CV' : 'Upload CV (PDF)'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const formData = new FormData()
                          formData.append('cv', file)
                          await api.post(`/trainers/${selectedTrainer.id}/upload-cv`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          })
                          queryClient.invalidateQueries({ queryKey: ['trainers'] })
                          alert('CV uploaded successfully!')
                        }
                      }}
                    />
                  </Button>
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

      {/* Dialog de création formateur */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateTrainer}>
          <DialogTitle>
            <Typography variant="h6">Ajouter un Formateur</Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  name="firstName"
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  name="lastName"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="phone"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Spécialités"
                  name="specialties"
                  helperText="Séparez par des virgules (ex: Mathématiques, Physique)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Biographie"
                  name="bio"
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  Vous pourrez uploader un CV (PDF) après la création du formateur
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)} disabled={createMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer le formateur'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirmer la suppression
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir supprimer ce formateur ?
          </Typography>
          {selectedTrainer && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'error.50' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedTrainer.firstName} {selectedTrainer.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedTrainer.email}
              </Typography>
            </Paper>
          )}
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            ⚠️ Cette action est irréversible. Les formations assignées à ce formateur ne seront pas supprimées mais n'auront plus de formateur assigné.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={deleteMutation.isPending}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
