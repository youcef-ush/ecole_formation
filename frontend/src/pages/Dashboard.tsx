import { useQuery } from '@tanstack/react-query'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import BookIcon from '@mui/icons-material/Book'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface DashboardStats {
  totalStudents: number
  activeCourses: number
  activeEnrollments: number
  totalRevenue: number
}

interface AccessStats {
  grantedCount: number
  deniedCount: number
}

interface PaymentAlert {
  id: number
  studentName: string
  courseTitle: string
  amount: number
  dueDate: string
  daysRemaining: number
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data.data || response.data
    },
  })

  const { data: accessStats } = useQuery<AccessStats>({
    queryKey: ['access-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/attendance-stats')
      return response.data.data || { grantedCount: 0, deniedCount: 0 }
    },
  })

  const { data: paymentAlerts } = useQuery<PaymentAlert[]>({
    queryKey: ['payment-alerts'],
    queryFn: async () => {
      const response = await api.get('/dashboard/payment-alerts')
      return response.data.data || []
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
      title: 'Formations Actives',
      value: stats?.activeCourses || 0,
      icon: <BookIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Inscriptions',
      value: stats?.activeEnrollments || 0,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Tableau de bord
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Vue d'ensemble de Inspired Academy by Nana
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
        📍 Centre de Formation Bouinan, Blida | 📞 +213 770 029 426 / +213 770 029 425
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

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Actions Rapides
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={() => navigate('/qr-scanner')}
                >
                  Scanner Accès
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/enrollments')}
                >
                  Nouvelle Inscription
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/payments')}
                >
                  Enregistrer Paiement
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Access Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Statistiques d'Accès
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  <Typography variant="h4" color="success.main" fontWeight={600}>
                    {accessStats?.grantedCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accès Accordés
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  <Typography variant="h4" color="error.main" fontWeight={600}>
                    {accessStats?.deniedCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accès Refusés
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Alerts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} color="warning.main">
                ⚠️ Paiements à venir et en retard
              </Typography>
              {paymentAlerts && paymentAlerts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Étudiant</TableCell>
                        <TableCell>Formation</TableCell>
                        <TableCell>Montant</TableCell>
                        <TableCell>Échéance</TableCell>
                        <TableCell>Jours restants</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{alert.studentName}</TableCell>
                          <TableCell>{alert.courseTitle}</TableCell>
                          <TableCell>{alert.amount} DA</TableCell>
                          <TableCell>{new Date(alert.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={
                                alert.daysRemaining === 0 ? "Aujourd'hui" :
                                alert.daysRemaining < 0 ? `Retard J+${Math.abs(alert.daysRemaining)}` :
                                `J-${alert.daysRemaining}`
                              } 
                              color={alert.daysRemaining <= 3 ? "error" : "warning"} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun paiement à venir dans les 7 prochains jours.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
