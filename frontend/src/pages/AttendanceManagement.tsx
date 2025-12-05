import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Edit,
  Refresh,
  CheckCircle,
  Cancel,
  AccessTime,
  EventAvailable,
  Person,
  CalendarToday,
  TrendingUp,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import api from '../services/api';

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
  badgeExpiry?: string;
}

interface Attendance {
  id: number;
  studentId: number;
  sessionId: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  scanMethod: 'qr_scan' | 'manual';
  scanTimestamp: string;
  note?: string;
  recordedById?: number;
  student?: Student;
}

interface AttendanceReport {
  session: Session;
  date: Date;
  statistics: {
    totalExpected: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  };
  attendances: Attendance[];
}

const AttendanceManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);

  // Dialog présence manuelle
  const [manualDialog, setManualDialog] = useState(false);
  const [manualForm, setManualForm] = useState({
    studentId: '',
    status: 'present' as 'present' | 'absent' | 'late' | 'excused',
    note: '',
  });
  const [students, setStudents] = useState<Student[]>([]);

  // Charger les sessions au démarrage
  useEffect(() => {
    loadSessions();
  }, []);

  // Charger le rapport quand session/date change
  useEffect(() => {
    if (selectedSession) {
      loadAttendanceReport();
    }
  }, [selectedSession, selectedDate]);

  const loadSessions = async () => {
    try {
      const response = await api.get('/sessions');
      setSessions(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      setError('Impossible de charger les sessions');
    }
  };

  const loadAttendanceReport = async () => {
    if (!selectedSession) return;

    setLoading(true);
    setError('');

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get(
        `/attendance/sessions/${selectedSession}/attendance?date=${dateStr}`
      );

      setReport(response.data.data);
    } catch (err: any) {
      console.error('Erreur chargement rapport:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du rapport');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForSession = async () => {
    if (!selectedSession) return;

    try {
      // Charger les étudiants inscrits à cette session via le cours
      const sessionData = sessions.find(s => s.id === selectedSession);
      if (!sessionData) return;

      // Récupérer les enrollments du cours
      const response = await api.get('/enrollments', {
        params: { courseId: sessionData.courseId },
      });

      const enrollments = response.data.data || [];
      const studentsList = enrollments.map((e: any) => e.student).filter(Boolean);
      setStudents(studentsList);
    } catch (err) {
      console.error('Erreur chargement étudiants:', err);
    }
  };

  const openManualDialog = async () => {
    await loadStudentsForSession();
    setManualDialog(true);
  };

  const handleManualAttendance = async () => {
    if (!selectedSession || !manualForm.studentId) {
      setError('Veuillez sélectionner un étudiant');
      return;
    }

    try {
      await api.post(
        '/attendance/manual',
        {
          sessionId: selectedSession,
          studentId: parseInt(manualForm.studentId),
          status: manualForm.status,
          note: manualForm.note,
        }
      );

      setSuccess('Présence enregistrée avec succès');
      setManualDialog(false);
      setManualForm({ studentId: '', status: 'present', note: '' });

      // Recharger le rapport
      await loadAttendanceReport();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'excused':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Présent';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'En retard';
      case 'excused':
        return 'Excusé';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'absent':
        return <Cancel color="error" />;
      case 'late':
        return <AccessTime color="warning" />;
      case 'excused':
        return <EventAvailable color="info" />;
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestion des Présences
        </Typography>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  select
                  fullWidth
                  label="Session"
                  value={selectedSession || ''}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Sélectionner une session</em>
                  </MenuItem>
                  {sessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                      {session.courseTitle || `Formation #${session.courseId}`} -{' '}
                      {session.monthLabel} {session.year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <DatePicker
                  label="Date"
                  value={selectedDate}
                  onChange={(newValue) => newValue && setSelectedDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={loadAttendanceReport}
                    disabled={!selectedSession || loading}
                    fullWidth
                  >
                    Actualiser
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Chargement */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Rapport */}
        {!loading && report && (
          <>
            {/* Statistiques */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{report.statistics.totalExpected}</Typography>
                    <Typography variant="body2">Étudiants Attendus</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{report.statistics.present}</Typography>
                    <Typography variant="body2">Présents</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <CardContent>
                    <Typography variant="h4">{report.statistics.absent}</Typography>
                    <Typography variant="body2">Absents</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp />
                      <Typography variant="h4">
                        {report.statistics.attendanceRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Typography variant="body2">Taux de Présence</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Onglets */}
            <Card>
              <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
                <Tab label="Liste des Présences" />
                <Tab label="Résumé" />
              </Tabs>

              <Divider />

              <CardContent>
                {/* Tab 0: Liste des présences */}
                {tabValue === 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">
                        Présences du {new Date(selectedDate).toLocaleDateString('fr-FR')}
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Edit />}
                        onClick={openManualDialog}
                      >
                        Marquer Présence
                      </Button>
                    </Box>

                    {report.attendances.length === 0 ? (
                      <Alert severity="info">Aucune présence enregistrée pour cette date</Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Étudiant</TableCell>
                              <TableCell>Téléphone</TableCell>
                              <TableCell>Statut</TableCell>
                              <TableCell>Heure</TableCell>
                              <TableCell>Méthode</TableCell>
                              <TableCell>Note</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {report.attendances.map((attendance) => (
                              <TableRow key={attendance.id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getStatusIcon(attendance.status)}
                                    <Typography>
                                      {attendance.student?.firstName} {attendance.student?.lastName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{attendance.student?.phone || '-'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={getStatusLabel(attendance.status)}
                                    color={getStatusColor(attendance.status)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {new Date(attendance.scanTimestamp).toLocaleTimeString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={attendance.scanMethod === 'qr_scan' ? 'QR Scan' : 'Manuel'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>{attendance.note || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}

                {/* Tab 1: Résumé */}
                {tabValue === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Statistiques Détaillées
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Présents"
                            secondary={`${report.statistics.present} étudiants`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Cancel color="error" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Absents"
                            secondary={`${report.statistics.absent} étudiants`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AccessTime color="warning" />
                          </ListItemIcon>
                          <ListItemText
                            primary="En retard"
                            secondary={`${report.statistics.late} étudiants`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <EventAvailable color="info" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Excusés"
                            secondary={`${report.statistics.excused} étudiants`}
                          />
                        </ListItem>
                      </List>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Informations Session
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday />
                          </ListItemIcon>
                          <ListItemText
                            primary="Formation"
                            secondary={report.session.courseTitle || `Formation #${report.session.courseId}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday />
                          </ListItemIcon>
                          <ListItemText
                            primary="Période"
                            secondary={`${report.session.monthLabel} ${report.session.year}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday />
                          </ListItemIcon>
                          <ListItemText
                            primary="Dates"
                            secondary={`Du ${new Date(report.session.startDate).toLocaleDateString('fr-FR')} au ${new Date(report.session.endDate).toLocaleDateString('fr-FR')}`}
                          />
                        </ListItem>
                      </List>

                      {report.statistics.absent > 0 && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>{report.statistics.absent} étudiant(s) absent(s)</strong>
                          </Typography>
                          <Typography variant="caption">
                            Pensez à vérifier les absences répétées
                          </Typography>
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog Présence Manuelle */}
        <Dialog open={manualDialog} onClose={() => setManualDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Marquer Présence Manuellement</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Étudiant"
                value={manualForm.studentId}
                onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Sélectionner un étudiant</em>
                </MenuItem>
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Statut"
                value={manualForm.status}
                onChange={(e) =>
                  setManualForm({ ...manualForm, status: e.target.value as any })
                }
              >
                <MenuItem value="present">Présent</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="late">En retard</MenuItem>
                <MenuItem value="excused">Excusé</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Note (optionnel)"
                value={manualForm.note}
                onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManualDialog(false)}>Annuler</Button>
            <Button onClick={handleManualAttendance} variant="contained" color="primary">
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceManagement;
