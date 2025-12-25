import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Avatar,
  IconButton,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import BookIcon from '@mui/icons-material/Book'
import AppRegistrationIcon from '@mui/icons-material/AppRegistration'
import PaymentIcon from '@mui/icons-material/Payment'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { alpha, useTheme } from '@mui/material/styles'

interface SidebarProps {
  drawerWidth: number
  mobileOpen: boolean
  desktopOpen?: boolean
  onDrawerToggle: () => void
}

const menuItems = [
  { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Scanner Accès', icon: <QrCodeScannerIcon />, path: '/qr-scanner', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Inscriptions', icon: <AppRegistrationIcon />, path: '/enrollments', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Paiements', icon: <PaymentIcon />, path: '/payments', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Plans de Paiement', icon: <AccountBalanceIcon />, path: '/payment-plans', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Finances', icon: <AccountBalanceWalletIcon />, path: '/finances', roles: ['ADMIN'] },
  { text: 'Étudiants', icon: <SchoolIcon />, path: '/students', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Formateurs', icon: <PersonIcon />, path: '/trainers', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Formations', icon: <BookIcon />, path: '/courses', roles: ['ADMIN', 'RECEPTION', 'STAFF'] },
  { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/users', roles: ['ADMIN'] },
]

export default function Sidebar({ drawerWidth, mobileOpen, desktopOpen = true, onDrawerToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const theme = useTheme()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  )

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', py: 2 }}>
          <img src="/logo.png" alt="Inspired Academy" style={{ maxHeight: '40px', maxWidth: '100%' }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
            Inspired<br/>Academy
          </Typography>
        </Box>
      </Toolbar>
      
      <List sx={{ flexGrow: 1, px: 2 }}>
        {filteredMenuItems.map((item) => {
          const isSelected = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path)
                  if (mobileOpen) onDrawerToggle()
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    '& .MuiListItemIcon-root': {
                      color: theme.palette.primary.main,
                    },
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.text.primary, 0.05),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isSelected ? theme.palette.primary.main : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: isSelected ? 600 : 400 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
            {user?.firstName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap fontWeight="bold">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {user?.role}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} sx={{ ml: 'auto' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ 
        width: { sm: desktopOpen ? drawerWidth : 0 }, 
        flexShrink: { sm: 0 },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', boxShadow: 3 },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="persistent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(0,0,0,0.08)' },
        }}
        open={desktopOpen}
      >
        {drawer}
      </Drawer>
    </Box>
  )
}
