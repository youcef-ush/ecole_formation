import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material'
import SchoolIcon from '@mui/icons-material/School'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password })
      console.log('Login response:', response.data)
      
      // L'API renvoie { success: true, data: { accessToken, user } }
      const { data } = response.data
      const { accessToken, user } = data
      
      setAuth(accessToken, user)
      navigate('/')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'background.default',
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(245, 166, 35, 0.2) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(255, 201, 71, 0.2) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(0, 0, 0, 0.1) 0px, transparent 50%)
          `,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box 
              component="img" 
              src="/logo.png" 
              alt="Inspired Academy" 
              sx={{ 
                width: 150, 
                height: 'auto', 
                mb: 2 
              }} 
            />
            <Typography component="h1" variant="h5" fontWeight={600} textAlign="center">
              Inspired Academy by Nana
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Centre de Formation Bouinan, Blida
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Connectez-vous à votre compte
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
