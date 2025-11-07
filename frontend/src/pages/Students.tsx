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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import api from '../services/api'

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  createdAt: string
}

export default function Students() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [openDetails, setOpenDetails] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students')
      return response.data.data || response.data
    },
  })

  // Filtrer les étudiants par recherche
  const filteredStudents = students?.filter((student) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      student.firstName?.toLowerCase().includes(query) ||
      student.lastName?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.phone?.toLowerCase().includes(query)
    )
  }) || []

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student)
    setOpenDetails(true)
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
            Gérez la liste de vos étudiants
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Ajouter un étudiant
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom, email ou téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom complet</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Date de naissance</TableCell>
              <TableCell>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents && filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow
                  key={student.id}
                  hover
                  onClick={() => handleRowClick(student)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>{student.id}</TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Chip label="Actif" color="success" size="small" />
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
                    {selectedStudent.firstName} {selectedStudent.lastName}
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
                <Typography variant="body1">{selectedStudent.email}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Téléphone
                </Typography>
                <Typography variant="body1">{selectedStudent.phone}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Date de naissance
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR')}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Adresse
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                  <Typography variant="body2">{selectedStudent.address}</Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Fermer</Button>
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
                    defaultValue={selectedStudent.address}
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
    </Box>
  )
}
