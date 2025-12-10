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
  durationMonths: number
  totalPrice: number
  isActive: boolean
}

export default function Courses() {
  const queryClient = useQueryClient()
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses')
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

  const handleUpdateCourse = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      totalPrice: parseFloat(formData.get('totalPrice') as string),
      durationMonths: parseInt(formData.get('durationMonths') as string),
      type: formData.get('type'),
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
            Formations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Catalogue de formations disponibles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled
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
                    {course.totalPrice?.toLocaleString()} DA
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Modifier</Button>
                  <Button size="small" color="error">
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
                  {selectedCourse.totalPrice?.toLocaleString()} DA
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
                    label="Prix Total (DA)"
                    name="totalPrice"
                    defaultValue={selectedCourse.totalPrice}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Type"
                    name="type"
                    defaultValue={selectedCourse.type}
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
    </Box >
  )
}
