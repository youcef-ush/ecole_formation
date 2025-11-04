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
  student: { firstName: string; lastName: string }
  session: { course: { title: string } }
  enrollmentDate: string
  status: 'pending' | 'paid' | 'cancelled'
  totalAmount: number
  paidAmount: number
}

export default function Enrollments() {
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await api.get('/enrollments')
      return response.data
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'paid':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'paid':
        return 'Payé'
      case 'cancelled':
        return 'Annulé'
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
                  <TableCell>{enrollment.session?.course?.title}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrollmentDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{enrollment.totalAmount.toLocaleString()} DA</TableCell>
                  <TableCell>{enrollment.paidAmount.toLocaleString()} DA</TableCell>
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
