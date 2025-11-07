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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import api from '../services/api'

interface Enrollment {
  id: number
  status: string
  notes?: string
  enrolledAt: string
  updatedAt: string
  studentId: number
  sessionId: number
  student: {
    id: number
    firstName: string
    lastName: string
    email?: string
  }
  session: {
    id: number
    startDate: string
    endDate: string
    monthLabel?: string
    course: {
      id: number
      title: string
      price: number
    }
  }
  payments?: Array<{
    id: number
    amount: number
    paymentDate: string
  }>
}

interface Student {
  id: number
  firstName: string
  lastName: string
  email?: string
}

interface Session {
  id: number
  startDate: string
  endDate: string
  monthLabel: string
  course: {
    id: number
    title: string
    price: number
  }
}

export default function Enrollments() {
  const queryClient = useQueryClient()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openNewEnrollment, setOpenNewEnrollment] = useState(false)
  const [newEnrollmentData, setNewEnrollmentData] = useState({
    sessionId: '',
    notes: '',
  })
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await api.get('/enrollments')
      return response.data.data || response.data
    },
  })

  // Récupérer les sessions disponibles pour l'ajout
  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions')
      return response.data.data || response.data
    },
  })

  // Récupérer les inscriptions d'un étudiant spécifique
  const { data: studentEnrollments } = useQuery<Enrollment[]>({
    queryKey: ['student-enrollments', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return []
      const response = await api.get('/enrollments')
      const allEnrollments = response.data.data || response.data
      return allEnrollments.filter((e: Enrollment) => e.studentId === selectedStudent.id)
    },
    enabled: !!selectedStudent,
  })

  // Mutation pour ajouter une inscription
  const addEnrollmentMutation = useMutation({
    mutationFn: async (data: { studentId: number; sessionId: number; notes: string }) => {
      const response = await api.post('/enrollments', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] })
      setOpenNewEnrollment(false)
      setNewEnrollmentData({ sessionId: '', notes: '' })
    },
  })

  // Mutation pour supprimer une inscription
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await api.delete(`/enrollments/${enrollmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] })
    },
  })

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedStudent(null)
  }

  const handleAddEnrollment = () => {
    if (selectedStudent && newEnrollmentData.sessionId) {
      addEnrollmentMutation.mutate({
        studentId: selectedStudent.id,
        sessionId: parseInt(newEnrollmentData.sessionId),
        notes: newEnrollmentData.notes,
      })
    }
  }

  const handleDeleteEnrollment = (enrollmentId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
      deleteEnrollmentMutation.mutate(enrollmentId)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'warning'
      case 'Payé':
        return 'success'
      case 'Annulé':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    return status
  }

  // Calculer le montant total et payé
  const getTotalAmount = (enrollment: Enrollment) => {
    return enrollment.session?.course?.price || 0
  }

  const getPaidAmount = (enrollment: Enrollment) => {
    if (!enrollment.payments || enrollment.payments.length === 0) return 0
    return enrollment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
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
            Inscriptions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les inscriptions des étudiants
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nouvelle inscription
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Étudiant</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell>Montant total</TableCell>
              <TableCell>Montant payé</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments && enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} hover>
                  <TableCell>{enrollment.id}</TableCell>
                  <TableCell>
                    <Button
                      variant="text"
                      onClick={() => handleViewStudent(enrollment.student)}
                      sx={{ textTransform: 'none' }}
                    >
                      {enrollment.student?.firstName} {enrollment.student?.lastName}
                    </Button>
                  </TableCell>
                  <TableCell>{enrollment.session?.course?.title || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolledAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{getTotalAmount(enrollment).toLocaleString()} DA</TableCell>
                  <TableCell>{getPaidAmount(enrollment).toLocaleString()} DA</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(enrollment.status)}
                      color={getStatusColor(enrollment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Voir les formations de l'étudiant">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewStudent(enrollment.student)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Aucune inscription trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog pour voir toutes les formations d'un étudiant */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Formations de {selectedStudent?.firstName} {selectedStudent?.lastName}
        </DialogTitle>
        <DialogContent>
          {studentEnrollments && studentEnrollments.length > 0 ? (
            <Box>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Formation</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Date d'inscription</TableCell>
                      <TableCell>Montant</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.session?.course?.title}</TableCell>
                        <TableCell>
                          {enrollment.session?.monthLabel || 
                           new Date(enrollment.session?.startDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {new Date(enrollment.enrolledAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {enrollment.session?.course?.price?.toLocaleString()} DA
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={enrollment.status}
                            color={getStatusColor(enrollment.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Supprimer l'inscription">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteEnrollment(enrollment.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenNewEnrollment(true)}
                  fullWidth
                >
                  Ajouter une nouvelle formation
                </Button>
              </Box>

              {openNewEnrollment && (
                <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Nouvelle inscription
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    label="Session"
                    value={newEnrollmentData.sessionId}
                    onChange={(e) =>
                      setNewEnrollmentData({ ...newEnrollmentData, sessionId: e.target.value })
                    }
                    margin="normal"
                    size="small"
                  >
                    {sessions?.map((session) => (
                      <MenuItem key={session.id} value={session.id}>
                        {session.course?.title} - {session.monthLabel || 
                         new Date(session.startDate).toLocaleDateString('fr-FR')}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    label="Notes (optionnel)"
                    value={newEnrollmentData.notes}
                    onChange={(e) =>
                      setNewEnrollmentData({ ...newEnrollmentData, notes: e.target.value })
                    }
                    margin="normal"
                    size="small"
                    multiline
                    rows={2}
                  />
                  <Box mt={2} display="flex" gap={1}>
                    <Button
                      variant="contained"
                      onClick={handleAddEnrollment}
                      disabled={!newEnrollmentData.sessionId}
                      size="small"
                    >
                      Ajouter
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setOpenNewEnrollment(false)
                        setNewEnrollmentData({ sessionId: '', notes: '' })
                      }}
                      size="small"
                    >
                      Annuler
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Aucune formation pour cet étudiant
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
