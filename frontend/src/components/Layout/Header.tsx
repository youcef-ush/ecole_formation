import { AppBar, Toolbar, IconButton, Typography, Box, Breadcrumbs, Link } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useAuthStore } from '../../stores/authStore'
import { useLocation, Link as RouterLink } from 'react-router-dom'

interface HeaderProps {
  drawerWidth: number
  onDrawerToggle: () => void
  isSidebarOpen?: boolean
}

const routeNameMap: Record<string, string> = {
  '': 'Tableau de bord',
  'qr-scanner': 'Scanner Accès',
  'enrollments': 'Inscriptions',
  'payments': 'Paiements',
  'payment-plans': 'Plans de Paiement',
  'finances': 'Finances',
  'students': 'Étudiants',
  'trainers': 'Formateurs',
  'courses': 'Formations',
  'users': 'Utilisateurs',
}

export default function Header({ drawerWidth, onDrawerToggle, isSidebarOpen = true }: HeaderProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={0}
      sx={{
        width: { sm: isSidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
        ml: { sm: isSidebarOpen ? `${drawerWidth}px` : 0 },
        transition: (theme) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        backgroundColor: 'background.default',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
            <Link component={RouterLink} underline="hover" color="inherit" to="/">
              Accueil
            </Link>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1
              const to = `/${pathnames.slice(0, index + 1).join('/')}`
              const name = routeNameMap[value] || value

              return last ? (
                <Typography color="text.primary" key={to} sx={{ fontWeight: 600 }}>
                  {name}
                </Typography>
              ) : (
                <Link component={RouterLink} underline="hover" color="inherit" to={to} key={to}>
                  {name}
                </Link>
              )
            })}
          </Breadcrumbs>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            {user?.role} Access
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
