import { useQuery } from '@tanstack/react-query'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import BookIcon from '@mui/icons-material/Book'
import PaidIcon from '@mui/icons-material/Paid'
import api from '../services/api'

interface DashboardStats {
  totalStudents: number
  totalTrainers: number
  totalCourses: number
  totalRevenue: number
  activeEnrollments: number
  upcomingSessions: number
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
      </Grid>
    </Box>
  )
}
