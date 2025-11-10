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
  TextField,
  MenuItem,
  Grid,
  Alert,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SearchIcon from '@mui/icons-material/Search'
import api from '../services/api'

interface Session {
  id: number
  course: { title: string }
  trainer: { firstName: string; lastName: string }
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  capacity: number
  enrolledCount: number
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  monthLabel?: string
  price?: number
  location?: string
  notes?: string
}

interface Course {
  id: number
  title: string
  type: string
}

interface Trainer {
  id: number
  firstName: string
  lastName: string
}

interface GenerateSessionsForm {
  courseId: string
  trainerId: string
  schoolYear: string
  monthlyPrice: string
  startTime: string
  endTime: string
  capacity: string
  location: string
  daysOfWeek: string[]
}

export default function Sessions() {
  const queryClient = useQueryClient()
  const [openGenerator, setOpenGenerator] = useState(false)
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  
  const [formData, setFormData] = useState<GenerateSessionsForm>({
    courseId: '',
    trainerId: '',
    schoolYear: '2025-2026',
    monthlyPrice: '5000',
    startTime: '14:00',
    endTime: '16:00',
    capacity: '15',
    location: '',
    daysOfWeek: [],
  })

  const { data: sessionsResponse, isLoading } = useQuery({
    queryKey: ['sessions', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get(`/sessions?month=${selectedMonth}&year=${selectedYear}`)
      return response.data
    },
  })

  const sessions = sessionsResponse?.data || []
  const filterInfo = sessionsResponse?.filter

  // Filtrer les sessions par recherche
  const filteredSessions = sessions.filter((session: Session) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      session.course?.title?.toLowerCase().includes(query) ||
      session.trainer?.firstName?.toLowerCase().includes(query) ||
      session.trainer?.lastName?.toLowerCase().includes(query) ||
      session.location?.toLowerCase().includes(query) ||
      session.monthLabel?.toLowerCase().includes(query)
    )
  })

  const { data: courses } = useQuery<Course[]>({
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

  const generateMutation = useMutation({
    mutationFn: async (data: GenerateSessionsForm) => {
      const response = await api.post('/sessions/generate-monthly', {
        courseId: parseInt(data.courseId),
        trainerId: data.trainerId ? parseInt(data.trainerId) : undefined,
        schoolYear: data.schoolYear,
        monthlyPrice: parseFloat(data.monthlyPrice),
        startTime: data.startTime,
        endTime: data.endTime,
        capacity: parseInt(data.capacity),
        location: data.location || undefined,
        daysOfWeek: data.daysOfWeek.length > 0 ? data.daysOfWeek.join(',') : undefined,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setOpenGenerator(false)
      setFormData({
        courseId: '',
        trainerId: '',
        schoolYear: '2025-2026',
        monthlyPrice: '5000',
        startTime: '14:00',
        endTime: '16:00',
        capacity: '15',
        location: '',
        daysOfWeek: [],
      })
    },
  })

  const handleGenerateSessions = () => {
    generateMutation.mutate(formData)
  }

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleRowClick = (session: Session) => {
    setSelectedSession(session)
    setOpenDetails(true)
  }

  const handleEditClick = () => {
    setOpenDetails(false)
    setOpenEdit(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/sessions/${selectedSession?.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setOpenEdit(false)
      setSelectedSession(null)
    },
  })

  const handleUpdateSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      capacity: parseInt(formData.get('capacity') as string),
      location: formData.get('location'),
      price: parseFloat(formData.get('price') as string),
      notes: formData.get('notes'),
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'info'
      case 'ongoing':
        return 'success'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planifiée'
      case 'ongoing':
        return 'En cours'
      case 'completed':
        return 'Terminée'
      case 'cancelled':
        return 'Annulée'
      default:
        return status
    }
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
            Sessions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Planning des sessions de formation
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setOpenGenerator(true)}
          >
            Générer Sessions Mensuelles
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Créer une session
          </Button>
        </Box>
      </Box>

      {/* Filtre de mois */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <IconButton onClick={handlePreviousMonth} color="primary">
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ minWidth: 200, textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {filterInfo?.monthLabel || `${selectedMonth}/${selectedYear}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''} ce mois
          </Typography>
        </Box>
        <IconButton onClick={handleNextMonth} color="primary">
          <ChevronRightIcon />
        </IconButton>
      </Paper>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par formation, formateur, lieu ou mois..."
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

      {generateMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {generateMutation.data.message}
        </Alert>
      )}

      {generateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors de la génération des sessions
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Formateur</TableCell>
              <TableCell>Mois</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date fin</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Capacité</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSessions && filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <TableRow
                  key={session.id}
                  hover
                  onClick={() => handleRowClick(session)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{session.course?.title}</TableCell>
                  <TableCell>
                    {session.trainer?.firstName} {session.trainer?.lastName}
                  </TableCell>
                  <TableCell>
                    {session.monthLabel && (
                      <Chip label={session.monthLabel} size="small" color="primary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(session.startDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Date(session.endDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {session.price ? `${session.price.toLocaleString()} DA` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${session.enrolledCount || 0} / ${session.capacity}`}
                      color={
                        (session.enrolledCount || 0) >= session.capacity 
                          ? 'error' 
                          : (session.enrolledCount || 0) >= session.capacity * 0.8 
                            ? 'warning' 
                            : 'success'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(session.status)}
                      color={getStatusColor(session.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Aucune session trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog pour générer les sessions mensuelles */}
      <Dialog open={openGenerator} onClose={() => setOpenGenerator(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="secondary" />
            <Typography variant="h6">Générer Sessions Mensuelles Automatiquement</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Cette fonctionnalité crée automatiquement 10 sessions mensuelles (Septembre à Juin) pour une formation.
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              ✨ Nouvelles fonctionnalités:
            </Typography>
            <Typography variant="body2" component="div">
              • Le <strong>formateur</strong> est pris automatiquement de la formation (optionnel)
              <br />
              • La <strong>salle</strong> est sélectionnée automatiquement depuis la base de données
              <br />
              • Vous pouvez spécifier les <strong>jours de la semaine</strong> (ex: Lundi, Mercredi, Vendredi)
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Formation"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                required
              >
                <MenuItem value="">
                  <em>Sélectionner une formation</em>
                </MenuItem>
                {courses?.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title} ({course.type})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Formateur (optionnel - pris de la formation si vide)"
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Utiliser le formateur de la formation</em>
                </MenuItem>
                {trainers?.map((trainer) => (
                  <MenuItem key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Année scolaire"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                placeholder="2025-2026"
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Prix mensuel (DA)"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="time"
                label="Heure de début"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="time"
                label="Heure de fin"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Jours de la semaine</InputLabel>
                <Select
                  multiple
                  value={formData.daysOfWeek}
                  onChange={(e) => setFormData({ ...formData, daysOfWeek: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                  input={<OutlinedInput label="Jours de la semaine" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                    <MenuItem key={day} value={day}>
                      <Checkbox checked={formData.daysOfWeek.indexOf(day) > -1} />
                      <ListItemText primary={day} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Capacité maximale"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Lieu (optionnel)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Salle sera choisie automatiquement"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerator(false)} disabled={generateMutation.isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleGenerateSessions}
            variant="contained"
            color="secondary"
            disabled={
              generateMutation.isPending ||
              !formData.courseId
            }
            startIcon={generateMutation.isPending ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {generateMutation.isPending ? 'Génération...' : 'Générer 10 Sessions'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de détails de session */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Détails de la Session</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {selectedSession.course?.title}
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedSession.status)}
                    color={getStatusColor(selectedSession.status) as any}
                    size="small"
                  />
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ID Session
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{selectedSession.id}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Mois
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedSession.monthLabel || '-'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date de début
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedSession.startDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date de fin
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedSession.endDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Horaires
                </Typography>
                <Typography variant="body1">
                  {selectedSession.startTime || '-'} - {selectedSession.endTime || '-'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Lieu
                </Typography>
                <Typography variant="body1">{selectedSession.location || '-'}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Formateur
                </Typography>
                <Typography variant="body1">
                  {selectedSession.trainer?.firstName} {selectedSession.trainer?.lastName}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Prix mensuel
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  {selectedSession.price ? `${selectedSession.price.toLocaleString()} DA` : '-'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Capacité
                </Typography>
                <Typography variant="body1">
                  {selectedSession.currentEnrollments || 0} / {selectedSession.capacity} étudiants
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Places disponibles
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={
                    (selectedSession.capacity || 0) - (selectedSession.currentEnrollments || 0) > 0
                      ? 'success.main'
                      : 'error.main'
                  }
                >
                  {(selectedSession.capacity || 0) - (selectedSession.currentEnrollments || 0)} places
                </Typography>
              </Grid>

              {selectedSession.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                    <Typography variant="body2">{selectedSession.notes}</Typography>
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

      {/* Dialog de modification de session */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleUpdateSession}>
          <DialogTitle>
            <Typography variant="h6">Modifier la Session</Typography>
          </DialogTitle>
          <DialogContent>
            {selectedSession && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Formation: <strong>{selectedSession.course?.title}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mois: <strong>{selectedSession.monthLabel}</strong>
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Heure de début"
                    name="startTime"
                    defaultValue={selectedSession.startTime || ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Heure de fin"
                    name="endTime"
                    defaultValue={selectedSession.endTime || ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Capacité"
                    name="capacity"
                    defaultValue={selectedSession.capacity}
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Prix (DA)"
                    name="price"
                    defaultValue={selectedSession.price || ''}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Lieu"
                    name="location"
                    defaultValue={selectedSession.location || ''}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    name="notes"
                    defaultValue={selectedSession.notes || ''}
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
