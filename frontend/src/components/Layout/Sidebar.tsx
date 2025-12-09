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
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  drawerWidth: number
  mobileOpen: boolean
  onDrawerToggle: () => void
}

const menuItems = [
  { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/' },
  { text: 'Scanner Accès', icon: <QrCodeScannerIcon />, path: '/qr-scanner' },
  { text: 'Inscriptions', icon: <AppRegistrationIcon />, path: '/enrollments' },
  { text: 'Paiements', icon: <PaymentIcon />, path: '/payments' },
  { text: 'Étudiants', icon: <SchoolIcon />, path: '/students' },
  { text: 'Formateurs', icon: <PersonIcon />, path: '/trainers' },
  { text: 'Formations', icon: <BookIcon />, path: '/courses' },
]

export default function Sidebar({ drawerWidth, mobileOpen, onDrawerToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          <ListItemText
            primary="Inspired Academy by Nana"
            primaryTypographyProps={{ fontWeight: 600, color: 'primary', fontSize: '0.9rem' }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
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
