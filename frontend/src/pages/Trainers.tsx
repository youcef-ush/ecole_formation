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

interface Trainer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  specialties: string[]
  bio: string
}

export default function Trainers() {
  const { data: trainers, isLoading } = useQuery<Trainer[]>({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers')
      return response.data
    },
  })

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
        <Button variant="contained" startIcon={<AddIcon />}>
          Ajouter un formateur
        </Button>
      </Box>

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
            {trainers && trainers.length > 0 ? (
              trainers.map((trainer) => (
                <TableRow key={trainer.id} hover>
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
    </Box>
  )
}
