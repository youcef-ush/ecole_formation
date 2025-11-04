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

interface Session {
  id: number
  course: { title: string }
  trainer: { firstName: string; lastName: string }
  startDate: string
  endDate: string
  capacity: number
  currentEnrollments: number
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
}

export default function Sessions() {
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions')
      return response.data
    },
  })

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
        <Button variant="contained" startIcon={<AddIcon />}>
          Créer une session
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Formateur</TableCell>
              <TableCell>Date début</TableCell>
              <TableCell>Date fin</TableCell>
              <TableCell>Capacité</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions && sessions.length > 0 ? (
              sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{session.course?.title}</TableCell>
                  <TableCell>
                    {session.trainer?.firstName} {session.trainer?.lastName}
                  </TableCell>
                  <TableCell>
                    {new Date(session.startDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Date(session.endDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {session.currentEnrollments || 0} / {session.capacity}
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
                <TableCell colSpan={7} align="center">
                  Aucune session trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
