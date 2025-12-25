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
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface SidebarProps {
  drawerWidth: number
  mobileOpen: boolean
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

export default function Sidebar({ drawerWidth, mobileOpen, onDrawerToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || '')
  )

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center', py: 1 }}>
          <img src="/logo.png" alt="Inspired Academy" style={{ maxHeight: '50px', maxWidth: '100%' }} />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (mobileOpen) onDrawerToggle()
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}
