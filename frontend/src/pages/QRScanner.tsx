import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Cancel,
  PlayArrow,
  Stop,
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

interface Course {
  id: number;
  title: string;
  type: string;
  totalPrice: number;
}

interface ScanResult {
  allowed: boolean;
  status: 'GRANTED' | 'DENIED';
  reason: string;
  student?: {
    firstName: string;
    lastName: string;
  };
}

export default function QRScanner() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<string>('');

  // Load courses on mount
  useEffect(() => {
    loadCourses();
    return () => {
      stopScanner();
    };
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des formations');
    }
  };

  const startScanner = async () => {
    if (!selectedCourseId) {
      setError('Veuillez sélectionner une formation');
      return;
    }

    try {
      setScanResult(null);
      setError(null);

      scannerRef.current = new Html5Qrcode('qr-reader');
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        () => { } // Ignore errors during scanning
      );
      setIsScanning(true);
    } catch (err) {
      setError('Impossible d\'accéder à la caméra');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  };

  const handleScan = async (decodedText: string) => {
    // Prevent duplicate scans
    if (decodedText === lastScanRef.current) return;
    lastScanRef.current = decodedText;

    // Must be a student QR code
    if (!decodedText.startsWith('STUDENT-')) {
      setError('QR Code invalide. Utilisez un badge étudiant.');
      return;
    }

    setLoading(true);
    setScanResult(null);
    setError(null);

    try {
      // Call the new Scan API
      const response = await api.post('/scan', {
        qrCode: decodedText,
        courseId: selectedCourseId,
      });

      setScanResult(response.data);

      // Play sound based on result
      playSound(response.data.allowed ? 'success' : 'error');

    } catch (err: any) {
      // Handle 403 Forbidden (Access Denied)
      if (err.response?.status === 403) {
        setScanResult(err.response.data);
        playSound('error');
      } else {
        setError(err.response?.data?.message || 'Erreur lors du scan');
      }
    } finally {
      setLoading(false);
      // Reset after 3 seconds to allow next scan
      setTimeout(() => {
        lastScanRef.current = '';
        setScanResult(null);
      }, 3000);
    }
  };

  const playSound = (type: 'success' | 'error') => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = type === 'success' ? 800 : 300;
    oscillator.type = 'sine';
    gain.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScanner /> Scanner Accès
      </Typography>

      {/* Course Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Formation</InputLabel>
            <Select
              value={selectedCourseId || ''}
              label="Formation"
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              disabled={isScanning}
            >
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title} - {course.type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Scanner Controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color={isScanning ? 'error' : 'primary'}
          startIcon={isScanning ? <Stop /> : <PlayArrow />}
          onClick={isScanning ? stopScanner : startScanner}
          disabled={!selectedCourseId && !isScanning}
        >
          {isScanning ? 'Arrêter' : 'Démarrer Scanner'}
        </Button>
      </Stack>

      {/* QR Reader */}
      <Box
        id="qr-reader"
        sx={{
          width: '100%',
          height: 300,
          backgroundColor: 'grey.900',
          borderRadius: 2,
          overflow: 'hidden',
          display: isScanning ? 'block' : 'none',
        }}
      />

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Scan Result */}
      {scanResult && (
        <Alert
          severity={scanResult.allowed ? 'success' : 'error'}
          sx={{ mt: 2 }}
          icon={scanResult.allowed ? <CheckCircle /> : <Cancel />}
        >
          <AlertTitle>
            {scanResult.allowed ? 'ACCÈS ACCORDÉ' : 'ACCÈS REFUSÉ'}
          </AlertTitle>
          <Typography variant="body1">
            {scanResult.student && `${scanResult.student.firstName} ${scanResult.student.lastName}`}
          </Typography>
          <Chip
            label={scanResult.reason}
            color={scanResult.allowed ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Alert>
      )}
    </Box>
  );
}
