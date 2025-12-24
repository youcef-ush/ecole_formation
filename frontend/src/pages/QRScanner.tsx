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
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Cancel,
  CreditCardOff,
  HowToReg,
  Search,
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

interface AccessLog {
  id: number;
  studentId: number;
  courseId: number;
  status: 'GRANTED' | 'DENIED';
  denialReason?: string;
  accessTime: string;
  student?: {
    qrCode?: string;
    enrollment: {
      firstName: string;
      lastName: string;
    };
  };
  course?: {
    title: string;
  };
}

export default function QRScanner() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<AccessLog[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historyCourse, setHistoryCourse] = useState('all');
  const [historyDate, setHistoryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lastScanRef = useRef<string>('');

  // Load courses and history on mount
  useEffect(() => {
    loadCourses();
    loadHistory();
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

  const loadHistory = async () => {
    try {
      const response = await api.get('/scan/history');
      setHistory(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
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

      // Refresh history
      loadHistory();

      // Play sound based on result
      playSound(response.data.allowed ? 'success' : 'error');

    } catch (err: any) {
      // Handle 403 Forbidden (Access Denied)
      if (err.response?.status === 403) {
        setScanResult(err.response.data);
        setShowResult(true);
        loadHistory(); // Refresh history even on denial
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
    <Box sx={{ p: 2, position: 'relative' }}>
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
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
      </Box>

      {/* Recent Scans History */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Historique des scans
        </Typography>

        {/* History Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher nom ou code QR..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={historyStatus}
                  label="Statut"
                  onChange={(e) => setHistoryStatus(e.target.value)}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="GRANTED">Accordé</MenuItem>
                  <MenuItem value="DENIED">Refusé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Formation</InputLabel>
                <Select
                  value={historyCourse}
                  label="Formation"
                  onChange={(e) => setHistoryCourse(e.target.value)}
                >
                  <MenuItem value="all">Toutes les formations</MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Date & Heure</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Code QR</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Formation</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Détail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const filteredHistory = history.filter((log) => {
                  const matchesSearch = !historySearch || 
                    `${log.student?.enrollment?.firstName} ${log.student?.enrollment?.lastName}`.toLowerCase().includes(historySearch.toLowerCase()) ||
                    log.student?.qrCode?.toLowerCase().includes(historySearch.toLowerCase());
                  
                  const matchesStatus = historyStatus === 'all' || log.status === historyStatus;
                  
                  const matchesCourse = historyCourse === 'all' || log.courseId.toString() === historyCourse;
                  
                  const matchesDate = !historyDate || new Date(log.accessTime).toISOString().split('T')[0] === historyDate;

                  return matchesSearch && matchesStatus && matchesCourse && matchesDate;
                });

                if (filteredHistory.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">Aucun scan ne correspond à vos critères</Typography>
                      </TableCell>
                    </TableRow>
                  );
                }

                return filteredHistory.map((log) => (
                  <TableRow 
                    key={log.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {new Date(log.accessTime).toLocaleDateString('fr-FR')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.accessTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {log.student?.enrollment 
                        ? `${log.student.enrollment.firstName} ${log.student.enrollment.lastName}`
                        : 'Étudiant inconnu'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f0f0f0', px: 1, py: 0.5, borderRadius: 1 }}>
                        {log.student?.qrCode || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.course?.title || 'Formation inconnue'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status === 'GRANTED' ? 'ACCORDÉ' : 'REFUSÉ'}
                        size="small"
                        color={log.status === 'GRANTED' ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold', minWidth: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      {log.status === 'GRANTED' ? (
                        <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 16 }} /> Accès autorisé
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                          <Cancel sx={{ fontSize: 16 }} /> {log.denialReason || 'Accès refusé'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

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
            bgcolor: scanResult.allowed ? 'rgba(0, 166, 81, 0.95)' : 'rgba(237, 28, 36, 0.95)',
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
                <CheckCircle sx={{ fontSize: 180, filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))' }} />
              ) : (
                <Cancel sx={{ fontSize: 180, filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.4))' }} />
              )}
            </Box>

            {/* Status Text */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                mb: 2,
                textShadow: '4px 4px 8px rgba(0,0,0,0.4)',
                letterSpacing: 4,
              }}
            >
              {scanResult.allowed ? 'ACCÈS ACCORDÉ' : 'ACCÈS REFUSÉ'}
            </Typography>

            {/* Student Name */}
            {scanResult.student && (
              <Typography
                variant="h3"
                sx={{
                  mb: 4,
                  fontWeight: 600,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
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
                gap: 3,
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 8,
                px: 6,
                py: 3,
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255,255,255,0.3)',
                animation: scanResult.allowed
                  ? `${glowSuccess} 2s ease-in-out infinite`
                  : `${glowError} 2s ease-in-out infinite`,
              }}
            >
              {scanResult.allowed ? (
                <HowToReg sx={{ fontSize: 60 }} />
              ) : (
                <CreditCardOff sx={{ fontSize: 60 }} />
              )}
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {scanResult.allowed
                  ? 'BIENVENUE'
                  : scanResult.reason || 'PAIEMENT REQUIS'}
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
