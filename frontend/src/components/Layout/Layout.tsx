import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import Sidebar from './Sidebar'
import Header from './Header'

const drawerWidth = 240

export default function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setDesktopOpen(!desktopOpen)
    }
  }

  const isSidebarOpen = isMobile ? mobileOpen : desktopOpen

  return (
    <Box sx={{ display: 'flex' }}>
      <Header 
        drawerWidth={drawerWidth} 
        onDrawerToggle={handleDrawerToggle} 
        isSidebarOpen={isSidebarOpen} // Pass desktop state for margin calculations
      />
      <Sidebar
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        desktopOpen={desktopOpen}
        onDrawerToggle={handleDrawerToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: desktopOpen ? 0 : 0 }, // Margin is handled by flex layout usually, but let's check
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: '100vh',
          backgroundColor: 'background.default',
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(245, 166, 35, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(255, 201, 71, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(0, 0, 0, 0.05) 0px, transparent 50%)
          `,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
