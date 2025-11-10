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
import EventIcon from '@mui/icons-material/Event'
import AppRegistrationIcon from '@mui/icons-material/AppRegistration'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ScheduleIcon from '@mui/icons-material/Schedule'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  drawerWidth: number
  mobileOpen: boolean
  onDrawerToggle: () => void
}

const menuItems = [
  { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/' },
  { text: 'Scanner Présences', icon: <QrCodeScannerIcon />, path: '/qr-scanner' },
  { text: 'Gestion Présences', icon: <CheckCircleIcon />, path: '/attendances' },
  { text: 'Inscriptions', icon: <AppRegistrationIcon />, path: '/registrations' },
  { text: 'Étudiants', icon: <SchoolIcon />, path: '/students' },
  { text: 'Formateurs', icon: <PersonIcon />, path: '/trainers' },
  { text: 'Formations', icon: <BookIcon />, path: '/courses' },
  { text: 'Sessions', icon: <EventIcon />, path: '/sessions' },
  { text: 'Échéanciers', icon: <ScheduleIcon />, path: '/payment-schedules' },
  { text: 'Retards de Paiement', icon: <WarningAmberIcon />, path: '/overdue-payments' },
  { text: 'Salles', icon: <MeetingRoomIcon />, path: '/rooms' },
  { text: 'Créneaux', icon: <AccessTimeIcon />, path: '/timeslots' },
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
