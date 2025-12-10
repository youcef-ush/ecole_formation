import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  IconButton,
  Dialog,
} from '@mui/material';
import {
  ArrowBack,
  School,
  Print,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  address: string;
  email: string;
  qrCode: string;
  badgeQrCode?: string; // QR code image depuis backend
  badgeExpiry?: string; // Date d'expiration
  enrollments?: Enrollment[];
}

interface Enrollment {
  id: number;
  enrollmentDate: string;
  status: string;
  course: {
    id: number;
    title: string;
    type: string;
    category: string;
    pricePerMonth: number;
    durationMonths: number;
    schoolLevels: string;
    lyceeBranches: string;
    subjectModule: string;
  };
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);

  const { data: student, isLoading, refetch } = useQuery<Student>({
    queryKey: ['student', id],
    queryFn: async () => {
      const response = await api.get(`/students/${id}`);
      return response.data.data || response.data;
    },
  });

  const handlePrintBadge = () => {
    setBadgeOpen(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleRenewBadge = async () => {
    if (!window.confirm('Voulez-vous vraiment renouveler le badge de cet étudiant ? (Validité: 12 mois)')) {
      return;
    }
    
    setRenewLoading(true);
    try {
      await api.post(`/students/${id}/generate-badge`, { validityMonths: 12 });
      alert('Badge renouvelé avec succès !');
      refetch(); // Recharger les données
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du renouvellement du badge');
    } finally {
      setRenewLoading(false);
    }
  };

  const handleRevokeBadge = async () => {
    if (!window.confirm('Voulez-vous vraiment révoquer le badge de cet étudiant ?')) {
      return;
    }
    
    try {
      await api.put(`/students/${id}/revoke-badge`);
      alert('Badge révoqué avec succès');
      refetch(); // Recharger les données
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la révocation du badge');
    }
  };

  if (isLoading) return <Typography>Chargement...</Typography>;
  if (!student) return <Typography>Étudiant non trouvé</Typography>;

  const enrollments = student.enrollments || [];
  const schoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/students')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Détails de l'étudiant
        </Typography>
        <Button
          variant="contained"
          startIcon={<BadgeIcon />}
          onClick={handlePrintBadge}
        >
          Voir Badge
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Informations de l'étudiant */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
              >
                {student.firstName[0]}{student.lastName[0]}
              </Avatar>
              <Typography variant="h5">
                {student.firstName} {student.lastName}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {student.email}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Date de naissance
              </Typography>
              <Typography variant="body1">
                {new Date(student.birthDate).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Téléphone
              </Typography>
              <Typography variant="body1">{student.phone}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Adresse
              </Typography>
              <Typography variant="body1">{student.address}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Badge QR Code depuis backend */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Badge QR Code
              </Typography>
              {student.badgeQrCode ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={student.badgeQrCode} 
                    alt="Badge QR Code" 
                    style={{ width: 150, height: 150, border: '1px solid #ddd', borderRadius: 4 }} 
                  />
                  {student.badgeExpiry && (
                    <Typography 
                      variant="caption" 
                      display="block" 
                      sx={{ 
                        mt: 1,
                        color: new Date(student.badgeExpiry) < new Date() ? 'error.main' : 'text.secondary'
                      }}
                    >
                      {new Date(student.badgeExpiry) < new Date() ? '❌ Expiré le ' : '✅ Valide jusqu\'au '}
                      {new Date(student.badgeExpiry).toLocaleDateString('fr-FR')}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleRenewBadge}
                      disabled={renewLoading}
                      fullWidth
                    >
                      {renewLoading ? 'Renouvellement...' : 'Renouveler'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={handleRevokeBadge}
                      fullWidth
                    >
                      Révoquer
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Aucun badge généré
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleRenewBadge}
                    disabled={renewLoading}
                  >
                    {renewLoading ? 'Génération...' : 'Générer Badge'}
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Formations inscrites */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School /> Formations inscrites
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Formation</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date inscription</TableCell>
                    <TableCell>Prix mensuel</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {enrollment.course.title}
                        </Typography>
                        {enrollment.course.subjectModule && (
                          <Typography variant="caption" color="text.secondary">
                            {enrollment.course.subjectModule}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            enrollment.course.type === 'TUTORING_GROUP'
                              ? 'Soutien Groupe'
                              : enrollment.course.type === 'TUTORING_INDIVIDUAL'
                              ? 'Soutien Individuel'
                              : 'Formation Qualifiante'
                          }
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{enrollment.course.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={enrollment.status}
                          size="small"
                          color={enrollment.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(enrollment.enrollmentDate).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{enrollment.course.pricePerMonth} DA</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {enrollments.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Aucune formation inscrite
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Badge */}
      <Dialog
        open={badgeOpen}
        onClose={() => setBadgeOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 'auto',
            maxWidth: 'none',
            '@media print': {
              boxShadow: 'none',
              margin: 0,
              width: '85.6mm',
            },
          },
        }}
      >
        <BadgeCard student={student} enrollments={enrollments} schoolYear={schoolYear} />
      </Dialog>
    </Box>
  );
}

// Composant Badge à imprimer
function BadgeCard({
  student,
  enrollments,
  schoolYear,
}: {
  student: Student;
  enrollments: Enrollment[];
  schoolYear: string;
}) {
  // Utiliser le badgeQrCode depuis le backend au lieu de le générer
  const badgeQrCode = student.badgeQrCode;

  return (
    <Box
      sx={{
        width: '85.6mm', // Format carte bancaire (85.6mm x 53.98mm)
        height: 'auto',
        backgroundColor: 'white',
        border: '2px solid #1976d2',
        borderRadius: 2,
        overflow: 'hidden',
        '@media print': {
          border: '1px solid #000',
          boxShadow: 'none',
          pageBreakAfter: 'always',
        },
      }}
    >
      {/* Header du badge */}
      <Box sx={{ 
        textAlign: 'center', 
        bgcolor: 'primary.main', 
        color: 'white', 
        py: 0.5,
        px: 1
      }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
          INSPIRED ACADEMY BY NANA
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
          {schoolYear}
        </Typography>
      </Box>

      {/* Contenu principal */}
      <Box sx={{ p: 1.5 }}>
        {/* Photo et Infos */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
              border: '2px solid #1976d2',
            }}
          >
            {student.firstName[0]}{student.lastName[0]}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
              Né(e) : {new Date(student.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              ID: {student.id}
            </Typography>
          </Box>
        </Box>

        {/* Formations (compact) */}
        <Box sx={{ mb: 1, bgcolor: '#f5f5f5', p: 0.5, borderRadius: 1 }}>
          <Typography variant="caption" fontWeight="bold" color="primary" sx={{ fontSize: '0.7rem' }}>
            Formations:
          </Typography>
          {enrollments.slice(0, 2).map((enrollment) => (
            <Typography key={enrollment.id} variant="caption" display="block" sx={{ fontSize: '0.65rem', ml: 0.5 }}>
              • {enrollment.course.title}
            </Typography>
          ))}
          {enrollments.length > 2 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', ml: 0.5 }}>
              +{enrollments.length - 2} autre(s)
            </Typography>
          )}
          {enrollments.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', ml: 0.5 }}>
              Aucune formation
            </Typography>
          )}
        </Box>

        {/* QR Code */}
        <Box sx={{ textAlign: 'center', borderTop: '1px dashed #ccc', pt: 1 }}>
          {badgeQrCode ? (
            <>
              <img src={badgeQrCode} alt="Badge QR Code" style={{ width: 70, height: 70 }} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.55rem', mt: 0.5 }}>
                Scanner pour identifier
              </Typography>
              {student.badgeExpiry && (
                <Typography 
                  variant="caption" 
                  display="block" 
                  sx={{ 
                    fontSize: '0.5rem', 
                    color: new Date(student.badgeExpiry) < new Date() ? 'red' : 'green',
                    fontWeight: 'bold'
                  }}
                >
                  Valide jusqu'au {new Date(student.badgeExpiry).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="caption" color="error" sx={{ fontSize: '0.6rem' }}>
              ⚠️ Badge non généré
            </Typography>
          )}
        </Box>
      </Box>

      {/* Bouton d'impression (masqué à l'impression) */}
      <Box sx={{ textAlign: 'center', p: 1, '@media print': { display: 'none' } }}>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<Print />} 
          onClick={() => window.print()}
          fullWidth
        >
          Imprimer
        </Button>
      </Box>
    </Box>
  );
}
