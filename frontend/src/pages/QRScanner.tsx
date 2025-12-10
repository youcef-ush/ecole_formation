import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Fade,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Cancel,
  CreditCardOff,
  HowToReg,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import api from '../services/api';

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
`;

const fadeInScale = keyframes`
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
`;

const glowSuccess = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.4); }
  50% { box-shadow: 0 0 40px rgba(76, 175, 80, 0.8); }
`;

const glowError = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 40px rgba(244, 67, 54, 0.8); }
`;

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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastScanRef = useRef<string>('');

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Auto-focus input when course is selected
  useEffect(() => {
    if (selectedCourseId && inputRef.current && !showResult) {
      inputRef.current.focus();
    }
  }, [selectedCourseId, showResult]);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data || []);
    } catch (err) {
      setError('Erreur lors du chargement des formations');
    }
  };

  // AZERTY to QWERTY translation map
  // When a scanner sends QWERTY keystrokes on an AZERTY system, characters get translated wrong
  const azertyToQwerty: { [key: string]: string } = {
    '&': '1',
    'é': '2',
    '"': '3',
    "'": '4',
    '(': '5',
    '-': '6',  // AZERTY - key produces 6 in QWERTY context
    'è': '7',
    '_': '8',
    'ç': '9',
    'à': '0',
    ')': '-',  // AZERTY ) key is where QWERTY - is
    '=': '=',
  };

  // Function to translate from AZERTY-interpreted characters to actual QWERTY values
  const translateAzertyToQwerty = (input: string): string => {
    let result = '';
    for (const char of input) {
      result += azertyToQwerty[char] || char;
    }
    console.log('[QRScanner] Translated:', input, '->', result);
    return result;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[QRScanner] Form submitted, raw code:', manualCode);
    if (manualCode && manualCode.trim()) {
      // Translate AZERTY to QWERTY before processing
      const translatedCode = translateAzertyToQwerty(manualCode.trim());
      handleScan(translatedCode);
      setManualCode('');
    }
  };



  // Handle input change - auto-detect when scanner sends Enter
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('[QRScanner] Input changed:', value);
    setManualCode(value);
  };

  // Handle keydown to detect Enter key from scanner
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('[QRScanner] Enter pressed, raw code:', manualCode);
      if (manualCode && manualCode.trim()) {
        // Translate AZERTY to QWERTY before processing
        const translatedCode = translateAzertyToQwerty(manualCode.trim());
        handleScan(translatedCode);
        setManualCode('');
      }
    }
  };

  const handleScan = async (decodedText: string) => {
    console.log('[QRScanner] handleScan called with:', decodedText);

    // Prevent duplicate scans within short time
    if (decodedText === lastScanRef.current) {
      console.log('[QRScanner] Duplicate scan ignored');
      return;
    }
    lastScanRef.current = decodedText;

    // Clean the code
    const cleanCode = decodedText.trim();

    // Check if it's a valid QR code format
    if (!cleanCode) {
      setError('QR Code vide.');
      return;
    }

    console.log('[QRScanner] Processing code:', cleanCode);

    setLoading(true);
    setScanResult(null);
    setShowResult(false);
    setError(null);

    try {
      // Call the new Scan API
      console.log('[QRScanner] Calling API with:', { qrCode: cleanCode, courseId: selectedCourseId });
      const response = await api.post('/scan', {
        qrCode: cleanCode,
        courseId: selectedCourseId,
      });
      console.log('[QRScanner] API response:', response.data);

      setScanResult(response.data);
      setShowResult(true);

      // Play sound based on result
      playSound(response.data.allowed ? 'success' : 'error');

    } catch (err: any) {
      // Handle 403 Forbidden (Access Denied)
      if (err.response?.status === 403) {
        setScanResult(err.response.data);
        setShowResult(true);
        playSound('error');
      } else {
        console.error('[QRScanner] API error:', err);
        setError(err.response?.data?.message || 'Erreur lors du scan');
      }
    } finally {
      setLoading(false);
      // Reset after 4 seconds to allow next scan
      setTimeout(() => {
        lastScanRef.current = '';
        setShowResult(false);
        setScanResult(null);
        if (inputRef.current) inputRef.current.focus();
      }, 4000);
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

  const dismissResult = () => {
    setShowResult(false);
    setScanResult(null);
    lastScanRef.current = '';
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2, position: 'relative' }}>
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
              disabled={loading}
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
      <Card sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5' }}>
        <form onSubmit={handleManualSubmit}>
          <TextField
            fullWidth
            label="Scanner le code QR (ou saisir manuellement)"
            value={manualCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            disabled={!selectedCourseId || loading}
            autoFocus
            placeholder="Cliquez ici et scannez avec la douchette"
            helperText={!selectedCourseId ? "Sélectionnez une formation d'abord" : "Le curseur doit être dans ce champ pour scanner"}
          />
          <Button type="submit" sx={{ display: 'none' }}>Scanner</Button>
        </form>
      </Card>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error */}
      <Fade in={!!error}>
        <Box
          sx={{
            mt: 2,
            p: 3,
            bgcolor: '#fff3e0',
            borderRadius: 2,
            border: '2px solid #ff9800',
            display: error ? 'block' : 'none',
          }}
        >
          <Typography color="warning.dark" variant="h6">
            ⚠️ {error}
          </Typography>
        </Box>
      </Fade>

      {/* Animated Scan Result - Full Screen Overlay */}
      {showResult && scanResult && (
        <Box
          onClick={dismissResult}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: scanResult.allowed ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 67, 54, 0.95)',
            zIndex: 9999,
            cursor: 'pointer',
            animation: `${fadeInScale} 0.3s ease-out`,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              color: 'white',
              p: 4,
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          >
            {/* Animated Icon */}
            <Box
              sx={{
                mb: 3,
                animation: scanResult.allowed
                  ? `${bounce} 1s ease-in-out`
                  : `${shake} 0.5s ease-in-out`,
              }}
            >
              {scanResult.allowed ? (
                <CheckCircle sx={{ fontSize: 150, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }} />
              ) : (
                <Cancel sx={{ fontSize: 150, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }} />
              )}
            </Box>

            {/* Status Text */}
            <Typography
              variant="h2"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: 2,
              }}
            >
              {scanResult.allowed ? 'ACCÈS ACCORDÉ' : 'ACCÈS REFUSÉ'}
            </Typography>

            {/* Student Name */}
            {scanResult.student && (
              <Typography
                variant="h4"
                sx={{
                  mb: 3,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {scanResult.student.firstName} {scanResult.student.lastName}
              </Typography>
            )}

            {/* Reason Box */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 4,
                px: 4,
                py: 2,
                backdropFilter: 'blur(10px)',
                animation: scanResult.allowed
                  ? `${glowSuccess} 2s ease-in-out infinite`
                  : `${glowError} 2s ease-in-out infinite`,
              }}
            >
              {scanResult.allowed ? (
                <HowToReg sx={{ fontSize: 40 }} />
              ) : (
                <CreditCardOff sx={{ fontSize: 40 }} />
              )}
              <Typography variant="h5" sx={{ fontWeight: 500 }}>
                {scanResult.allowed
                  ? 'Enregistré - Peut accéder'
                  : scanResult.reason || 'Paiement non effectué'}
              </Typography>
            </Box>

            {/* Tap to dismiss hint */}
            <Typography
              variant="body1"
              sx={{
                mt: 4,
                opacity: 0.7,
                animation: `${pulse} 2s ease-in-out infinite`,
              }}
            >
              Cliquez n'importe où pour continuer
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
