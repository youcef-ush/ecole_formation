import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E3192', // Bleu profond (Inspired Academy)
      light: '#4449C1',
      dark: '#1B1D56',
    },
    secondary: {
      main: '#00AEEF', // Bleu clair / Cyan
      light: '#33BEF2',
      dark: '#0079A6',
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
