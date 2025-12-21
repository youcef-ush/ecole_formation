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
  enrollmentId: number;
  qrCode: string;
  badgeQrCode?: string;
  badgeExpiry?: string;
  isActive: boolean;
  status: string;
  courseId: number;
  paymentPlanId?: number;
  createdAt: string;
  enrollment: {
    id: number;
    firstName: string;
    lastName: string;
    birthDate?: string;
    phone: string;
    email?: string;
    address?: string;
    courseId?: number;
    courseTitle?: string;
    registrationFee: string;
    isRegistrationFeePaid: boolean;
    registrationFeePaidAt?: string;
    createdAt: string;
  };
  course: {
    id: number;
    title: string;
    description?: string;
    trainerId?: number;
    type?: string;
    priceModel?: string;
    category?: string;
    durationMonths?: number;
    price?: string;
  };
  paymentPlan?: any;
  payments?: any[];
  accessLogs?: any[];
  totalPaid?: number;
  nextInstallment?: {
    dueDate: string;
    amount: number;
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
                {student.enrollment?.firstName?.[0] || 'E'}{student.enrollment?.lastName?.[0] || 'T'}
              </Avatar>
              <Typography variant="h5">
                {student.enrollment?.firstName} {student.enrollment?.lastName}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {student.enrollment?.email || 'Pas d\'email'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {student.enrollment?.birthDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date de naissance
                </Typography>
                <Typography variant="body1">
                  {new Date(student.enrollment.birthDate).toLocaleDateString('fr-FR')}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Téléphone
              </Typography>
              <Typography variant="body1">{student.enrollment?.phone}</Typography>
            </Box>

            {student.enrollment?.address && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Adresse
                </Typography>
                <Typography variant="body1">{student.enrollment.address}</Typography>
              </Box>
            )}

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
              <School /> Formation inscrite
            </Typography>

            {student.course ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {student.course.title}
                </Typography>
                {student.course.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {student.course.description}
                  </Typography>
                )}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Catégorie
                    </Typography>
                    <Chip
                      label={student.course.category || 'Non défini'}
                      size="small"
                      color="primary"
                      sx={{ display: 'block', mt: 0.5 }}
                    />
                  </Grid>
                  {student.course.type && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Type
                      </Typography>
                      <Chip
                        label={student.course.type}
                        size="small"
                        variant="outlined"
                        sx={{ display: 'block', mt: 0.5 }}
                      />
                    </Grid>
                  )}
                  {student.course.durationMonths && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Durée
                      </Typography>
                      <Typography variant="body2">
                        {student.course.durationMonths} mois
                      </Typography>
                    </Grid>
                  )}
                  {student.course.price && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Prix
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {parseFloat(student.course.price).toLocaleString('fr-FR')} DA
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date d'inscription
                    </Typography>
                    <Typography variant="body2">
                      {new Date(student.enrollment.createdAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Statut
                    </Typography>
                    <Chip
                      label={student.status}
                      size="small"
                      color={student.status === 'ACTIVE' ? 'success' : 'default'}
                      sx={{ display: 'block', mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Aucune formation enregistrée
              </Typography>
            )}
          </Paper>

          {/* Statut des Paiements */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💰 Statut des Paiements
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Payé
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight={600}>
                  {student.totalPaid ? `${student.totalPaid.toLocaleString('fr-FR')} DA` : '0 DA'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prochaine Échéance
                </Typography>
                {student.nextInstallment ? (
                  <Box>
                    <Typography variant="h6" color="error.main" fontWeight={600}>
                      {new Date(student.nextInstallment.dueDate).toLocaleDateString('fr-FR')}
                    </Typography>
                    <Typography variant="body1">
                      {student.nextInstallment.amount.toLocaleString('fr-FR')} DA
                    </Typography>
                  </Box>
                ) : (
                  <Chip label="À jour" color="success" variant="outlined" />
                )}
              </Grid>
            </Grid>
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
            margin: 0,
            overflow: 'hidden',
            '@media print': {
              boxShadow: 'none',
              margin: '0 !important',
              padding: '0 !important',
              width: '105mm !important',
              height: '148mm !important',
              maxWidth: '105mm !important',
              maxHeight: '148mm !important',
              overflow: 'hidden !important',
            },
          },
        }}
      >
        <BadgeCard student={student} />
      </Dialog>
    </Box>
  );
}

// Composant Badge à imprimer
function BadgeCard({
  student,
}: {
  student: Student;
}) {
  // Utiliser le badgeQrCode depuis le backend au lieu de le générer
  const badgeQrCode = student.badgeQrCode;

  return (
    <Box
      sx={{
        width: '105mm',
        height: '148mm',
        backgroundColor: 'white',
        border: '3px solid #000',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        '@media print': {
          border: '2px solid #000',
          boxShadow: 'none',
          overflow: 'hidden !important',
          margin: '0 !important',
          padding: '0 !important',
          width: '105mm !important',
          height: '148mm !important',
          maxWidth: '105mm !important',
          maxHeight: '148mm !important',
          '@page': {
            size: 'A6',
            margin: '0',
          },
        },
      }}
    >
      {/* Header avec infos école */}
      <Box sx={{ 
        bgcolor: 'white',
        color: '#000',
        p: 2,
        borderBottom: '3px solid #000',
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.3rem', mb: 0.5, textAlign: 'center' }}>
          📚 Inspired Academy By Nana
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', textAlign: 'center', mb: 1, fontWeight: 600 }}>
          Centre de Formation et d'Excellence
        </Typography>
        <Box sx={{ fontSize: '0.7rem', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
          <Box sx={{ mb: 0.3 }}>
            <strong>📍 Adresse:</strong> Annoussa - BLIDA
          </Box>
          <Box sx={{ mb: 0.3 }}>
            <strong>📞 Téléphone:</strong> 0213 770 02 94 25 / 26
          </Box>
          <Box>
            <strong>✉️ Email:</strong> Inspiredacademy@gmail.com
          </Box>
        </Box>
      </Box>

      {/* Contenu principal */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Infos de l'étudiant */}
        <Box sx={{ mb: 2, pb: 2, borderBottom: '2px solid #e0e0e0' }}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem', lineHeight: 1.3, mb: 1.5, textAlign: 'center' }}>
            {student.enrollment.firstName} {student.enrollment.lastName}
          </Typography>
          {student.enrollment.phone && (
            <Box sx={{ fontSize: '0.85rem', textAlign: 'center' }}>
              <strong>Tél:</strong> {student.enrollment.phone}
            </Box>
          )}
        </Box>

        {/* Formation inscrite */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.9rem', mb: 1, pb: 0.5, borderBottom: '2px solid #000' }}>
            📖 Formation inscrite
          </Typography>
          {student.course ? (
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                {student.course.title}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', display: 'block' }}>
                <strong>Inscrit le:</strong> {new Date(student.enrollment.createdAt).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Aucune formation enregistrée
            </Typography>
          )}
        </Box>

        {/* QR Code */}
        <Box sx={{ textAlign: 'center', mt: 'auto', pt: 2, pb: 2, borderTop: '2px dashed #000' }}>
          {(badgeQrCode || student.qrCode) ? (
            <>
              <img 
                src={badgeQrCode || student.qrCode} 
                alt="Badge QR Code" 
                style={{ 
                  width: 120, 
                  height: 120, 
                  border: '2px solid #000',
                  display: 'block',
                  margin: '0 auto'
                }} 
              />
              <Typography variant="caption" display="block" sx={{ fontSize: '0.75rem', mt: 1, fontWeight: 600 }}>
                Scanner pour identifier l'étudiant
              </Typography>
            </>
          ) : (
            <Box sx={{ p: 2, bgcolor: '#ffebee', border: '2px solid #f44336', borderRadius: 1 }}>
              <Typography variant="caption" color="error" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                ⚠️ Badge non généré
              </Typography>
            </Box>
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
