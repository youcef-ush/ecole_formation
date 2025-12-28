import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import api from '../services/api'

interface Course {
  id: number
  title: string
  description: string
  type: string
  category: string
  durationMonths: number
  price: number
  monthlyPrice?: number
  totalPrice: number
  trainerId?: number
  isActive: boolean
}

interface Trainer {
  id: number
  firstName: string
  lastName: string
  specialty: string
}

export default function Courses() {
  const queryClient = useQueryClient()
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses')
      return response.data.data || response.data
    },
  })

  const { data: trainers } = useQuery<Trainer[]>({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers')
      return response.data.data || response.data
    },
  })

  const filteredCourses = courses?.filter((course) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      course.title?.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||
      course.type?.toLowerCase().includes(query)
    )
  }) || []

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
    setOpenDetails(true)
  }

  const handleEditClick = () => {
    setOpenDetails(false)
    setOpenEdit(true)
  }

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/courses', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setOpenCreate(false)
      setSelectedCategory('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/courses/${selectedCourse?.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setOpenEdit(false)
      setSelectedCourse(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/courses/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setOpenDelete(false)
      setOpenDetails(false)
      setSelectedCourse(null)
    },
  })

  const handleCreateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const category = formData.get('category') as string
    const trainerId = formData.get('trainerId') as string
    
    createMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      category: category,
      durationMonths: parseInt(formData.get('durationMonths') as string),
      price: parseFloat(formData.get('price') as string),
      trainerId: trainerId ? parseInt(trainerId) : null,
    })
  }

  const handleUpdateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const trainerId = formData.get('trainerId') as string
    
    updateMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      durationMonths: parseInt(formData.get('durationMonths') as string),
      trainerId: trainerId ? parseInt(trainerId) : null,
    })
  }

  const handleDeleteClick = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCourse(course)
    setOpenDelete(true)
  }

  const handleConfirmDelete = () => {
    if (selectedCourse) {
      deleteMutation.mutate(selectedCourse.id)
    }
  }

  const handleEditClickFromCard = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCourse(course)
    setOpenEdit(true)
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
            Formations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Catalogue de formations disponibles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Ajouter une formation
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par titre, description ou catégorie..."
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

      <Grid container spacing={3}>
        {filteredCourses && filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                onClick={() => handleCourseClick(course)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {course.title}
                    </Typography>
                    <Chip
                      label={course.isActive ? 'Actif' : 'Inactif'}
                      color={course.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Chip label={course.type} size="small" sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {course.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Durée: {course.durationMonths} mois
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={600} mt={1}>
                    {course.price?.toLocaleString()} DA
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={(e) => handleEditClickFromCard(course, e)}>
                    Modifier
                  </Button>
                  <Button size="small" color="error" onClick={(e) => handleDeleteClick(course, e)}>
                    Supprimer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Aucune formation trouvée</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Dialog de détails formation */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Détails de la Formation</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {selectedCourse.title}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip label={selectedCourse.type} color="primary" size="small" />
                    <Chip
                      label={selectedCourse.isActive ? 'Actif' : 'Inactif'}
                      color={selectedCourse.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ID Formation
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{selectedCourse.id}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
                <Typography variant="body1">{selectedCourse.type}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Durée
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedCourse.durationMonths} mois
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Prix Total
                </Typography>
                <Typography variant="h6" color="success.main" fontWeight={600}>
                  {selectedCourse.price?.toLocaleString()} DA
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                  <Typography variant="body2">{selectedCourse.description}</Typography>
                </Paper>
              </Grid>
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

      {/* Dialog de modification formation */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleUpdateCourse}>
          <DialogTitle>
            <Typography variant="h6">Modifier la Formation</Typography>
          </DialogTitle>
          <DialogContent>
            {selectedCourse && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Titre"
                    name="title"
                    defaultValue={selectedCourse.title}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    name="description"
                    defaultValue={selectedCourse.description}
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Durée (mois)"
                    name="durationMonths"
                    defaultValue={selectedCourse.durationMonths}
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={"Prix (DA)"}
                    name="price"
                    defaultValue={selectedCourse.price}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Formateur"
                    name="trainerId"
                    defaultValue={selectedCourse.trainerId || ''}
                    SelectProps={{ native: true }}
                    helperText="Sélectionnez le formateur (optionnel)"
                  >
                    <option value="">-- Aucun formateur assigné --</option>
                    {trainers?.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.firstName} {trainer.lastName} - {trainer.specialty}
                      </option>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Catégorie"
                    name="category"
                    defaultValue={selectedCourse.category}
                    disabled
                    helperText="La catégorie ne peut pas être modifiée"
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

      {/* Dialog de création formation */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateCourse}>
          <DialogTitle>
            <Typography variant="h6">Créer une Nouvelle Formation</Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Titre"
                  name="title"
                  required
                  placeholder="Ex: Développement Web Fullstack"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  required
                  placeholder="Description détaillée de la formation..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Catégorie"
                  name="category"
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="">-- Choisir une catégorie --</option>
                  <option value="Formation professionnelle">Formation professionnelle</option>
                  <option value="Soutien scolaire">Soutien scolaire</option>
                  <option value="Développement personnel">Développement personnel</option>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Formateur"
                  name="trainerId"
                  SelectProps={{ native: true }}
                  helperText="Sélectionnez le formateur qui assurera cette formation (optionnel)"
                >
                  <option value="">-- Aucun formateur assigné --</option>
                  {trainers?.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.firstName} {trainer.lastName} - {trainer.specialty}
                    </option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Durée (mois)"
                  name="durationMonths"
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={
                    selectedCategory === 'Formation professionnelle'
                      ? 'Prix de la formation (DA)'
                      : selectedCategory === 'Soutien scolaire'
                      ? 'Prix par mois (DA)'
                      : selectedCategory === 'Développement personnel'
                      ? 'Prix par séance (DA)'
                      : 'Prix (DA)'
                  }
                  name="price"
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText={
                    selectedCategory === 'Formation professionnelle'
                      ? 'Prix total de la formation'
                      : selectedCategory === 'Soutien scolaire'
                      ? 'Abonnement mensuel'
                      : selectedCategory === 'Développement personnel'
                      ? 'Prix pour une séance'
                      : 'Montant à payer'
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenCreate(false); setSelectedCategory('') }} disabled={createMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer la formation'}
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
            Êtes-vous sûr de vouloir supprimer cette formation ?
          </Typography>
          {selectedCourse && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'error.50' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedCourse.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedCourse.description}
              </Typography>
            </Paper>
          )}
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            ⚠️ Cette action est irréversible. L'affichage de cette formation chez les étudiants inscrits sera affecté, mais les étudiants eux-mêmes ne seront pas supprimés.
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
    </Box >
  )
}
