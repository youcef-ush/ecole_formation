import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Snackbar,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import api from '../services/api'

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  qrCode?: string
  createdAt: string
  enrollments?: Array<{
    id: number
    course: {
      title: string
    }
    session?: {
      id: number
    }
  }>
}

export default function Students() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openAffectationDialog, setOpenAffectationDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  
  // Snackbar notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  })

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students')
      return response.data.data || response.data
    },
  })

  // Récupérer les formations pour le select
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses')
      return response.data.data || response.data
    },
  })

  // Filtrer les étudiants par recherche
  const filteredStudents = students?.filter((student) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      student.firstName?.toLowerCase().includes(query) ||
      student.lastName?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.phone?.toLowerCase().includes(query)
    )
  }) || []

  // Fonction pour obtenir la formation de l'étudiant
  const getStudentCourse = (student: Student): string => {
    if (!student.enrollments || student.enrollments.length === 0) {
      return 'Autre formation'
    }
    // Retourner le titre de la première formation trouvée
    return student.enrollments[0]?.course?.title || 'Autre formation'
  }

  const handleRowClick = (student: Student) => {
    navigate(`/students/${student.id}`)
  }

  const handleEditClick = () => {
    setOpenDetails(false)
    setOpenEdit(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/students/${selectedStudent?.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setOpenEdit(false)
      setSelectedStudent(null)
      showNotification('✅ Étudiant modifié avec succès', 'success')
    },
    onError: (error: any) => {
      showNotification(`❌ Erreur: ${error.response?.data?.message || 'Erreur lors de la modification'}`, 'error')
    },
  })

  const affectationMutation = useMutation({
    mutationFn: async ({ studentId, courseId }: { studentId: number; courseId: string }) => {
      // Créer l'enrollment directement avec la formation
      const response = await api.post('/enrollments', {
        studentId,
        courseId: parseInt(courseId),
        notes: 'Affectation manuelle depuis la page étudiants',
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setOpenAffectationDialog(false)
      setSelectedCourseId('')
      showNotification('✅ Étudiant affecté à la formation avec succès', 'success')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'affectation'
      showNotification(`❌ ${errorMessage}`, 'error')
    },
  })

  const handleUpdateStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    })
  }

  const handleAffectation = () => {
    if (!selectedCourseId) {
      showNotification('⚠️ Veuillez sélectionner une formation', 'warning')
      return
    }
    if (selectedStudent) {
      affectationMutation.mutate({
        studentId: selectedStudent.id,
        courseId: selectedCourseId,
      })
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
            Étudiants
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les affectations de vos étudiants
          </Typography>
        </Box>
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom, email ou téléphone..."
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
              <TableCell>Téléphone</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>QR Code</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents && filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  hover
                  onClick={() => handleRowClick(student)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{student.id}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStudentCourse(student)} 
                      color={getStudentCourse(student) === 'Autre formation' ? 'default' : 'primary'}
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {student.qrCode || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Actif" color="success" size="small" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucun étudiant trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de détails étudiant */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Détails de l'Étudiant</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </Typography>
                  <Chip label="Actif" color="success" size="small" />
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ID Étudiant
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{selectedStudent.id}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date d'inscription
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedStudent.createdAt).toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{selectedStudent.email}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Téléphone
                </Typography>
                <Typography variant="body1">{selectedStudent.phone}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date de naissance
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Adresse
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                  <Typography variant="body2">{selectedStudent.address}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
          <Button 
            variant="outlined" 
            color="success" 
            onClick={() => {
              setOpenDetails(false)
              setOpenAffectationDialog(true)
            }}
          >
            ➕ Ajouter une affectation
          </Button>
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de modification étudiant */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleUpdateStudent}>
          <DialogTitle>
            <Typography variant="h6">Modifier l'Étudiant</Typography>
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="firstName"
                    defaultValue={selectedStudent.firstName}
                    required
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="lastName"
                    defaultValue={selectedStudent.lastName}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    defaultValue={selectedStudent.email}
                    disabled
                    helperText="L'email ne peut pas être modifié"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    name="phone"
                    defaultValue={selectedStudent.phone}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Adresse"
                    name="address"
                    defaultValue={selectedStudent.address}
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

      {/* Dialog d'affectation à une formation */}
      <Dialog open={openAffectationDialog} onClose={() => setOpenAffectationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">➕ Ajouter une Affectation</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, bgcolor: 'primary.50', mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Étudiant
                </Typography>
                <Typography variant="h6" color="primary">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: #{selectedStudent.id}
                </Typography>
              </Paper>

              <TextField
                select
                fullWidth
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                helperText="L'étudiant sera affecté à la première session active de cette formation"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">-- Sélectionner une formation --</option>
                {courses && courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.type})
                  </option>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAffectationDialog(false)
            setSelectedCourseId('')
          }} disabled={affectationMutation.isPending}>
            Annuler
          </Button>
          <Button 
            onClick={handleAffectation} 
            variant="contained" 
            color="success" 
            disabled={affectationMutation.isPending}
          >
            {affectationMutation.isPending ? 'Affectation...' : 'Affecter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
