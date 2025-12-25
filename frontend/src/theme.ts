import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#F5A623', // Jaune-Orange (Couleur principale)
      light: '#FFC947',
      dark: '#BC7800',
      contrastText: '#000000',
    },
    secondary: {
      main: '#000000', // Noir (Couleur secondaire)
      light: '#2C2C2C',
      dark: '#000000',
      contrastText: '#F5A623',
    },
    success: {
      main: '#00A651', // Vert Inspired
    },
    error: {
      main: '#ED1C24', // Rouge Inspired
    },
    background: {
      default: '#F1F2F2',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
})

export default theme
