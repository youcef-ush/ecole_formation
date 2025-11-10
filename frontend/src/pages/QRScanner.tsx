import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Cancel,
  Warning,
  Refresh,
  Stop,
  PlayArrow,
  Info,
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

interface Session {
  id: number;
  courseId: number;
  courseTitle?: string;
  startDate: string;
  endDate: string;
  month?: number;
  year?: number;
  monthLabel?: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  badgeExpiry?: string;
}

interface AccessStatus {
  allowed: boolean;
  status: 'granted' | 'warning' | 'denied';
  message: string;
}

interface Attendance {
  id: number;
  studentId: number;
  sessionId: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  scanMethod: 'qr_scan' | 'manual';
  scanTimestamp: string;
  accessStatus?: string;
  student?: Student;
}

interface ScanResult {
  success: boolean;
  attendance?: Attendance;
  accessStatus?: AccessStatus;
  student?: Student;
  message?: string;
}

const QRScanner: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'qr-reader';

  const steps = ['Sélectionner Session', 'Scanner Étudiants'];

  // Sons de feedback
  const playSound = (type: 'success' | 'error' | 'warning') => {
    const audio = new Audio(`/sounds/beep-${type}.mp3`);
    audio.play().catch(() => {
      // Si les sons ne sont pas disponibles, on ignore l'erreur
      console.log('Son non disponible');
    });
  };

  // Charger les sessions au démarrage
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSessions(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      setError('Impossible de charger les sessions');
    }
  };

  // Confirmer la session sélectionnée
  const confirmSession = async () => {
    if (!selectedSessionId) {
      setError('Veuillez sélectionner une session');
      return;
    }

    try {
      const response = await axios.get(`/api/sessions/${selectedSessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const sessionData = response.data.data;
      setSession(sessionData);
      setActiveStep(1);
      setAttendances([]);
      setError('');
      playSound('success');

      // Démarrer automatiquement le scanner
      setTimeout(() => startScanner(), 500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Session invalide';
      setError(errorMessage);
      playSound('error');
    }
  };

  // Initialiser le scanner
  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        undefined
      );

      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Erreur démarrage scanner:', err);
      setError('Impossible de démarrer la caméra. Vérifiez les permissions.');
    }
  };

  // Arrêter le scanner
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Erreur arrêt scanner:', err);
    }
  };

  // Gérer le scan QR
  const handleScan = async (decodedText: string) => {
    setCurrentScan(null);
    setError('');

    try {
      // Scanner uniquement les badges étudiants
      await validateStudentQr(decodedText);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
      setError(errorMessage);
      playSound('error');
    }
  };

  // Valider QR Étudiant et enregistrer présence
  const validateStudentQr = async (studentQrCode: string) => {
    try {
      if (!session || !session.id) {
        throw new Error('Veuillez sélectionner une session d\'abord');
      }

      // Générer le sessionQrCode à partir de l'ID de session
      // Format: SESSION-{id}-{date}-{timestamp}
      const timestamp = Date.now();
      const dateStr = new Date().toISOString().split('T')[0];
      const sessionQrCode = `SESSION-${session.id}-${dateStr}-${timestamp}`;

      // Appeler l'API de validation scan
      const response = await axios.post<{ success: boolean; data: ScanResult }>(
        '/api/attendance/validate-scan',
        {
          sessionQrCode,
          studentQrCode,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      const result = response.data.data;
      
      if (result.success) {
        // Succès ou warning
        const status = result.accessStatus?.status || 'granted';
        
        if (status === 'granted') {
          playSound('success');
        } else if (status === 'warning') {
          playSound('warning');
        } else {
          playSound('error');
        }

        // Ajouter à la liste des présences
        if (result.attendance) {
          setAttendances(prev => [result.attendance!, ...prev]);
        }

        setCurrentScan(result);
        
        // Effacer le message après 3 secondes
        setTimeout(() => setCurrentScan(null), 3000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement';
      setError(errorMessage);
      playSound('error');
      
      // Effacer l'erreur après 3 secondes
      setTimeout(() => setError(''), 3000);
    }
  };

  // Réinitialiser et recommencer
  const resetScanner = async () => {
    await stopScanner();
    setActiveStep(0);
    setSession(null);
    setSelectedSessionId(null);
    setAttendances([]);
    setCurrentScan(null);
    setError('');
  };

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Couleur selon statut
  const getStatusColor = (status: 'granted' | 'warning' | 'denied'): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'granted':
        return 'success';
      case 'warning':
        return 'warning';
      case 'denied':
        return 'error';
      default:
        return 'error';
    }
  };

  const getStatusIcon = (status: 'granted' | 'warning' | 'denied') => {
    switch (status) {
      case 'granted':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'denied':
        return <Cancel color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <QrCodeScanner sx={{ mr: 1, verticalAlign: 'middle' }} />
          Scanner Présences QR
        </Typography>
        <IconButton color="primary" onClick={() => setShowInfo(true)}>
          <Info />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Étape 1: Sélection Session */}
      {activeStep === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sélectionner une Session
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  select
                  fullWidth
                  label="Session"
                  value={selectedSessionId || ''}
                  onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Sélectionner une session</em>
                  </MenuItem>
                  {sessions.map((sess) => (
                    <MenuItem key={sess.id} value={sess.id}>
                      {sess.courseTitle || `Formation #${sess.courseId}`} -{' '}
                      {sess.monthLabel} {sess.year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={confirmSession}
                  disabled={!selectedSessionId}
                >
                  Confirmer Session
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Session Info */}
      {session && activeStep === 1 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6">Session Sélectionnée</Typography>
            <Typography variant="body1">
              <strong>{session.courseTitle || `Formation #${session.courseId}`}</strong>
            </Typography>
            <Typography variant="body2">
              {session.monthLabel && `${session.monthLabel} ${session.year}`}
            </Typography>
            <Typography variant="body2">
              Du {new Date(session.startDate).toLocaleDateString('fr-FR')} 
              {' au '} 
              {new Date(session.endDate).toLocaleDateString('fr-FR')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Feedback actuel */}
      {currentScan && currentScan.success && (
        <Alert 
          severity={getStatusColor(currentScan.accessStatus!.status)} 
          sx={{ mb: 3 }}
          icon={getStatusIcon(currentScan.accessStatus!.status)}
        >
          <AlertTitle>
            {currentScan.accessStatus!.status === 'granted' ? 'Présence Enregistrée ✓' : 
             currentScan.accessStatus!.status === 'warning' ? 'Avertissement Paiement ⚠' : 
             'Accès Refusé ✗'}
          </AlertTitle>
          {currentScan.attendance && (
            <Typography variant="body2">
              <strong>
                {currentScan.attendance.student?.firstName} {currentScan.attendance.student?.lastName}
              </strong>
            </Typography>
          )}
          <Typography variant="body2">{currentScan.accessStatus!.message}</Typography>
        </Alert>
      )}

      {/* Erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Étape 2: Scanner */}
      {activeStep === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center' }}>
              <div id={scannerElementId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }} />
              
              {isScanning && <LinearProgress sx={{ mt: 2 }} />}

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {!isScanning ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={startScanner}
                    size="large"
                  >
                    Démarrer Scanner
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopScanner}
                    size="large"
                  >
                    Arrêter Scanner
                  </Button>
                )}

                {session && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Refresh />}
                    onClick={resetScanner}
                    size="large"
                  >
                    Nouvelle Session
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Liste des présences enregistrées */}
      {attendances.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Présences Enregistrées ({attendances.length})
            </Typography>
            <List>
              {attendances.map((attendance, index) => (
                <React.Fragment key={attendance.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {attendance.accessStatus === 'granted' ? (
                        <CheckCircle color="success" />
                      ) : attendance.accessStatus === 'warning' ? (
                        <Warning color="warning" />
                      ) : (
                        <Cancel color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {attendance.student?.firstName} {attendance.student?.lastName}
                          </Typography>
                          <Chip
                            label={attendance.status}
                            size="small"
                            color={
                              attendance.status === 'present' ? 'success' :
                              attendance.status === 'late' ? 'warning' :
                              'default'
                            }
                          />
                        </Box>
                      }
                      secondary={new Date(attendance.scanTimestamp).toLocaleTimeString('fr-FR')}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Dialog Info */}
      <Dialog open={showInfo} onClose={() => setShowInfo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Comment utiliser le scanner QR</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            <strong>Étape 1 : Sélectionner la session</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            Sélectionnez la session dans la liste déroulante puis cliquez sur "Confirmer Session". 
            Le scanner se lancera automatiquement pour scanner les badges étudiants.
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>Étape 2 : Scanner les badges étudiants</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            Une fois la session sélectionnée, scannez les badges QR des étudiants un par un.
            Chaque scan enregistre automatiquement la présence.
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>Codes couleur :</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
              <ListItemText primary="Vert : Présence enregistrée, paiements à jour" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Warning color="warning" /></ListItemIcon>
              <ListItemText primary="Orange : Présence enregistrée, retard paiement (0-15 jours)" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Cancel color="error" /></ListItemIcon>
              <ListItemText primary="Rouge : Accès refusé, retard paiement >15 jours" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInfo(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRScanner;
