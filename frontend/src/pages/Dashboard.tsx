import { useQuery } from '@tanstack/react-query'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import BookIcon from '@mui/icons-material/Book'
import PaidIcon from '@mui/icons-material/Paid'
import EventIcon from '@mui/icons-material/Event'
import AssignmentIcon from '@mui/icons-material/Assignment'
import api from '../services/api'

interface DashboardStats {
  totalStudents: number
  totalTrainers: number
  totalCourses: number
  totalRevenue: number
  activeEnrollments: number
  upcomingSessions: number
}

interface TodaySession {
  id: number
  startTime: string
  endTime: string
  course: {
    title: string
  }
  trainer: {
    firstName: string
    lastName: string
  }
  status: string
}

interface PendingRegistration {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  course: {
    title: string
  }
  createdAt: string
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      console.log('Dashboard stats response:', response.data)
      // L'API renvoie { success: true, data: {...stats} }
      return response.data.data || response.data
    },
  })

  // Sessions du jour
  const { data: todaySessions } = useQuery<TodaySession[]>({
    queryKey: ['today-sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions')
      const sessions = response.data.data || response.data
      const today = new Date().toISOString().split('T')[0]
      return sessions.filter((s: any) => {
        const sessionDate = new Date(s.startDate).toISOString().split('T')[0]
        return sessionDate === today
      }).slice(0, 5)
    },
  })

  // Inscriptions en attente
  const { data: pendingRegistrations } = useQuery<PendingRegistration[]>({
    queryKey: ['pending-registrations'],
    queryFn: async () => {
      const response = await api.get('/registrations?status=En attente de paiement')
      const registrations = response.data.data || response.data
      return registrations.slice(0, 5)
    },
  })

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">Erreur lors du chargement des statistiques</Typography>
      </Box>
    )
  }

  const cards = [
    {
      title: 'Étudiants',
      value: stats?.totalStudents || 0,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Formateurs',
      value: stats?.totalTrainers || 0,
      icon: <PersonIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Formations',
      value: stats?.totalCourses || 0,
      icon: <BookIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Revenu Total',
      value: `${stats?.totalRevenue || 0} DA`,
      icon: <PaidIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Tableau de bord
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Vue d'ensemble de votre école de formation
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Inscriptions actives
              </Typography>
              <Typography variant="h3" color="primary" fontWeight={600}>
                {stats?.activeEnrollments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Étudiants actuellement inscrits
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Sessions à venir
              </Typography>
              <Typography variant="h3" color="secondary" fontWeight={600}>
                {stats?.upcomingSessions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sessions programmées
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sessions du jour */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EventIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Sessions du jour
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Heure</TableCell>
                      <TableCell>Formation</TableCell>
                      <TableCell>Formateur</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaySessions && todaySessions.length > 0 ? (
                      todaySessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            {session.startTime} - {session.endTime}
                          </TableCell>
                          <TableCell>{session.course?.title || 'N/A'}</TableCell>
                          <TableCell>
                            {session.trainer?.firstName} {session.trainer?.lastName}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={session.status}
                              size="small"
                              color={session.status === 'Planifiée' ? 'primary' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucune session aujourd'hui
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Inscriptions en attente */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <AssignmentIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>
                  Tâches en attente
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidat</TableCell>
                      <TableCell>Formation</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRegistrations && pendingRegistrations.length > 0 ? (
                      pendingRegistrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>
                            {registration.firstName} {registration.lastName}
                          </TableCell>
                          <TableCell>{registration.course?.title || 'N/A'}</TableCell>
                          <TableCell>{registration.phone}</TableCell>
                          <TableCell>
                            {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Aucune tâche en attente
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
