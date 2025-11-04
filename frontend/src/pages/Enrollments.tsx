import { useQuery } from '@tanstack/react-query'
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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
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
  }
  session: {
    id: number
    startDate: string
    endDate: string
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

export default function Enrollments() {
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await api.get('/enrollments')
      return response.data.data || response.data
    },
  })

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
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments && enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} hover>
                  <TableCell>{enrollment.id}</TableCell>
                  <TableCell>
                    {enrollment.student?.firstName} {enrollment.student?.lastName}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucune inscription trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
