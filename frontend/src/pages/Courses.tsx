import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import api from '../services/api'
import CourseForm from '../components/CourseForm'

interface Course {
  id: number
  title: string
  description: string
  category: string
  duration: number
  price: number
  isActive: boolean
}

export default function Courses() {
  const [openForm, setOpenForm] = useState(false)
  
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses')
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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Formations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Catalogue de formations disponibles
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Ajouter une formation
        </Button>
      </Box>

      <CourseForm open={openForm} onClose={() => setOpenForm(false)} />

      <Grid container spacing={3}>
        {courses && courses.length > 0 ? (
          courses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {course.title}
                    </Typography>
                    <Chip
                      label={course.isActive ? 'Actif' : 'Inactif'}
                      color={course.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Chip label={course.category} size="small" sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {course.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Durée: {course.duration} heures
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={600} mt={1}>
                    {course.price.toLocaleString()} DA
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Modifier</Button>
                  <Button size="small" color="error">
                    Supprimer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Aucune formation trouvée</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
