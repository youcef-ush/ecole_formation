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
  TableSortLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import api from '../services/api'

interface Student {
  id: number
  enrollmentId: number
  qrCode: string
  badgeQrCode?: string
  isActive: boolean
  status: string
  courseId: number
  paymentPlanId?: number
  createdAt: string
  enrollment: {
    id: number
    firstName: string
    lastName: string
    birthDate?: string
    phone: string
    email?: string
    address?: string
    courseId?: number
    courseTitle?: string
    registrationFee: string
    isRegistrationFeePaid: boolean
    registrationFeePaidAt?: string
    createdAt: string
  }
  course: {
    id: number
    title: string
    description?: string
    trainerId?: number
    type?: string
    priceModel?: string
    category?: string
    price?: string
  }
  studentPaymentPlans?: Array<{
    id: number
    paymentPlanId: number
    totalAmount: number
    remainingSessions?: number
    status: string
    paymentPlan: {
      id: number
      name: string
      type: string
      description?: string
    }
  }>
  studentAssignments?: Array<{
    id: number
    courseId: number
    paymentPlanId: number
    status: string
    course: {
      id: number
      title: string
    }
    paymentPlan: {
      id: number
      name: string
    }
  }>
  // Aliases pour compatibilité
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  totalPaid?: number
  nextInstallment?: {
    dueDate: string
    amount: number
  }
}

export default function Students() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [formationFilter, setFormationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'id',
    direction: 'desc',
  })
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openAffectationDialog, setOpenAffectationDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedPaymentPlanId, setSelectedPaymentPlanId] = useState('')

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

  // Récupérer les plans de paiement pour le select
  const { data: paymentPlans } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      const response = await api.get('/payment-plans')
      return response.data.data || response.data
    },
  })

  // Récupérer les affectations de l'étudiant sélectionné
  const { data: studentAssignments } = useQuery({
    queryKey: ['student-assignments', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return []
      const response = await api.get(`/students/${selectedStudent.id}/assignments`)
      return response.data.data || response.data
    },
    enabled: !!selectedStudent?.id && openDetails,
  })

  // Fonction pour obtenir la formation de l'étudiant
  const getStudentCourse = (student: Student): string => {
    if (student.studentAssignments && student.studentAssignments.length > 0) {
      return student.studentAssignments.map(a => a.course?.title).filter(Boolean).join(', ')
    }
    return student.course?.title || student.enrollment?.courseTitle || 'Sans formation'
  }

  // Filtrer et trier les étudiants
  const filteredStudents = (students || [])
    .filter((student) => {
      // Filtre par recherche textuelle
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || (
        student.enrollment?.firstName?.toLowerCase().includes(query) ||
        student.enrollment?.lastName?.toLowerCase().includes(query) ||
        student.enrollment?.email?.toLowerCase().includes(query) ||
        student.enrollment?.phone?.toLowerCase().includes(query)
      )

      // Filtre par formation
      const matchesFormation = formationFilter === 'all' || 
        (student.studentAssignments?.some(a => a.courseId.toString() === formationFilter)) ||
        (student.courseId?.toString() === formationFilter)

      // Filtre par statut
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter

      // Filtre par date
      const matchesDate = !dateFilter || new Date(student.createdAt).toISOString().split('T')[0] === dateFilter

      return matchesSearch && matchesFormation && matchesStatus && matchesDate
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig
      let valA: any = ''
      let valB: any = ''

      if (key === 'id') {
        valA = a.id
        valB = b.id
      } else if (key === 'name') {
        valA = `${a.enrollment?.firstName} ${a.enrollment?.lastName}`.toLowerCase()
        valB = `${b.enrollment?.firstName} ${b.enrollment?.lastName}`.toLowerCase()
      } else if (key === 'course') {
        valA = getStudentCourse(a).toLowerCase()
        valB = getStudentCourse(b).toLowerCase()
      } else if (key === 'nextInstallment') {
        valA = a.nextInstallment?.dueDate ? new Date(a.nextInstallment.dueDate).getTime() : Infinity
        valB = b.nextInstallment?.dueDate ? new Date(b.nextInstallment.dueDate).getTime() : Infinity
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1
      if (valA > valB) return direction === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Fonction pour obtenir le plan de paiement de l'étudiant
  const getStudentPaymentPlan = (student: Student): string => {
    if (student.studentAssignments && student.studentAssignments.length > 0) {
      return student.studentAssignments.map(a => a.paymentPlan?.name).filter(Boolean).join(', ')
    }
    if (student.studentPaymentPlans && student.studentPaymentPlans.length > 0) {
      const activePlan = student.studentPaymentPlans.find(plan => plan.status === 'ACTIVE')
      if (activePlan && activePlan.paymentPlan) {
        return activePlan.paymentPlan.name
      }
    }
    return 'Aucun plan'
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
    mutationFn: async ({ studentId, courseId, paymentPlanId }: { studentId: number; courseId: string; paymentPlanId: string }) => {
      // Créer une nouvelle affectation avec la nouvelle API
      const response = await api.post(`/students/${studentId}/assignments`, {
        courseId: parseInt(courseId),
        paymentPlanId: parseInt(paymentPlanId),
      })

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student-assignments', selectedStudent?.id] })
      setOpenAffectationDialog(false)
      setSelectedCourseId('')
      setSelectedPaymentPlanId('')
      showNotification('✅ Étudiant affecté avec formation et plan de paiement', 'success')
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
    if (!selectedPaymentPlanId) {
      showNotification('⚠️ Veuillez sélectionner un plan de paiement', 'warning')
      return
    }
    if (selectedStudent) {
      affectationMutation.mutate({
        studentId: selectedStudent.id,
        courseId: selectedCourseId,
        paymentPlanId: selectedPaymentPlanId,
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

      {/* Barre de recherche et Filtres */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tous les statuts</MenuItem>
                <MenuItem value="ACTIVE">Actif</MenuItem>
                <MenuItem value="INACTIVE">Inactif</MenuItem>
                <MenuItem value="COMPLETED">Terminé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrer par Formation</InputLabel>
              <Select
                value={formationFilter}
                label="Filtrer par Formation"
                onChange={(e) => setFormationFilter(e.target.value)}
              >
                <MenuItem value="all">Toutes les formations</MenuItem>
                {courses?.map((course: any) => (
                  <MenuItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date d'inscription"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'id'}
                  direction={sortConfig.key === 'id' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'name'}
                  direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Nom complet
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'course'}
                  direction={sortConfig.key === 'course' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('course')}
                >
                  Formation
                </TableSortLabel>
              </TableCell>
              <TableCell>Plan de paiement</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'nextInstallment'}
                  direction={sortConfig.key === 'nextInstallment' ? sortConfig.direction : 'asc'}
                  onClick={() => handleSort('nextInstallment')}
                >
                  Prochaine Échéance
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents && filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  hover
                  sx={{ '&:hover': { backgroundColor: 'action.hover' }, cursor: 'pointer' }}
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <TableCell>{student.id}</TableCell>
                  <TableCell>
                    {student.enrollment?.firstName} {student.enrollment?.lastName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStudentCourse(student)}
                      color={getStudentCourse(student) === 'Sans formation' ? 'default' : 'primary'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStudentPaymentPlan(student)}
                      color={getStudentPaymentPlan(student) === 'Aucun plan' ? 'warning' : 'info'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {student.nextInstallment ? (
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="error.main">
                          {new Date(student.nextInstallment.dueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.nextInstallment.amount} DA
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="À jour" color="success" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStudent(student)
                          setOpenAffectationDialog(true)
                        }}
                      >
                        ➕ Affecter
                      </Button>
                    </Box>
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
                    {selectedStudent.enrollment?.firstName || selectedStudent.firstName} {selectedStudent.enrollment?.lastName || selectedStudent.lastName}
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
                <Typography variant="body1">{selectedStudent.enrollment?.email || selectedStudent.email}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Téléphone
                </Typography>
                <Typography variant="body1">{selectedStudent.enrollment?.phone || selectedStudent.phone}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date de naissance
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedStudent.enrollment?.birthDate || '').toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Adresse
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                  <Typography variant="body2">{selectedStudent.enrollment?.address || 'Adresse non disponible'}</Typography>
                </Paper>
              </Grid>

              {/* Section Affectations */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                  📚 Affectations aux formations
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  {studentAssignments && studentAssignments.length > 0 ? (
                    <Box>
                      {studentAssignments.map((assignment: any) => (
                        <Box key={assignment.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={4}>
                              <Typography variant="subtitle2" color="primary">
                                {assignment.course?.title || 'Formation inconnue'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {assignment.course?.category || ''}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2">
                                💰 {assignment.paymentPlan?.name || 'Plan inconnu'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {assignment.paymentPlan?.type || ''}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.totalAmount ? `${assignment.totalAmount}€` : 'Prix non défini'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Chip
                                label={assignment.status === 'ACTIVE' ? 'Active' : assignment.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
                                color={assignment.status === 'ACTIVE' ? 'success' : assignment.status === 'COMPLETED' ? 'primary' : 'error'}
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary" display="block">
                                Créée le {new Date(assignment.createdAt).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Aucune affectation trouvée pour cet étudiant
                    </Typography>
                  )}
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
                    defaultValue={selectedStudent.enrollment?.address || ''}
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
          <Typography variant="h6">➕ Créer une Affectation (Formation + Plan de paiement)</Typography>
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

              {/* Affichages des affectations existantes */}
              {selectedStudent.studentPaymentPlans && selectedStudent.studentPaymentPlans.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Affectations existantes
                  </Typography>
                  {selectedStudent.studentPaymentPlans.map((affectation) => (
                    <Box key={affectation.id} sx={{ mb: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Formation:</strong> {selectedStudent.course?.title || 'N/A'} | 
                        <strong>Plan:</strong> {affectation.paymentPlan?.name || 'N/A'} | 
                        <strong>Montant:</strong> {affectation.totalAmount}€ | 
                        <strong>Statut:</strong> {affectation.status}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}

              <TextField
                select
                fullWidth
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                helperText="L'étudiant sera affecté à la première session active de cette formation"
                SelectProps={{
                  native: true,
                }}
                sx={{ mb: 2 }}
              >
                <option value="">-- Sélectionner une formation --</option>
                {courses && courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.title} ({course.type})
                  </option>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                value={selectedPaymentPlanId}
                onChange={(e) => setSelectedPaymentPlanId(e.target.value)}
                helperText="Sélectionner un plan de paiement pour cette affectation"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">-- Sélectionner un plan de paiement --</option>
                {paymentPlans && paymentPlans.map((plan: any) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.type})
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
            setSelectedPaymentPlanId('')
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
