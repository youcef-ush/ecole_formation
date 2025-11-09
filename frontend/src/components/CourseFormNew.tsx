import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface Trainer {
  id: number;
  firstName: string;
  lastName: string;
  specialties: string;
}

interface TimeSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  user: { email: string };
}

interface CourseFormProps {
  open: boolean;
  onClose: () => void;
}

const courseTypes = [
  { value: 'TUTORING_GROUP', label: '👥 Cours de Soutien (Groupe)' },
  { value: 'TUTORING_INDIVIDUAL', label: '👤 Cours Individuel' },
  { value: 'QUALIFYING', label: '🎓 Formation Qualifiante' },
];

const schoolLevels = [
  { value: '1AP', label: '1ère année primaire', category: 'primaire' },
  { value: '2AP', label: '2ème année primaire', category: 'primaire' },
  { value: '3AP', label: '3ème année primaire', category: 'primaire' },
  { value: '4AP', label: '4ème année primaire', category: 'primaire' },
  { value: '5AP', label: '5ème année primaire', category: 'primaire' },
  { value: '1AM', label: '1ère année collège', category: 'college' },
  { value: '2AM', label: '2ème année collège', category: 'college' },
  { value: '3AM', label: '3ème année collège', category: 'college' },
  { value: '4AM', label: '4ème année collège (BEM)', category: 'college' },
  { value: '1AS', label: '1ère année secondaire', category: 'lycee' },
  { value: '2AS', label: '2ème année secondaire', category: 'lycee' },
  { value: '3AS', label: '3ème année secondaire (BAC)', category: 'lycee' },
];

const lyceeBranches = [
  // 1ère année secondaire (1AS) - Tronc commun
  { value: 'S', label: 'Sciences et Technologie', fullName: 'Sciences et Technologie', for: ['1AS'] },
  { value: 'L', label: 'Lettres et Langues Étrangères', fullName: 'Lettres et Langues Étrangères', for: ['1AS'] },
  // 2ème et 3ème année secondaire (2AS/3AS) - Spécialisation
  { value: 'SE', label: 'Sciences Expérimentales', fullName: 'Sciences Expérimentales', for: ['2AS', '3AS'] },
  { value: 'MATH', label: 'Mathématiques', fullName: 'Mathématiques', for: ['2AS', '3AS'] },
  { value: 'MT', label: 'Techniques Mathématiques', fullName: 'Techniques Mathématiques', for: ['2AS', '3AS'] },
  { value: 'GESTION', label: 'Gestion et Économie', fullName: 'Gestion et Économie', for: ['2AS', '3AS'] },
  { value: 'FILO', label: 'Lettres et Philosophie', fullName: 'Lettres et Philosophie', for: ['2AS', '3AS'] },
  { value: 'ESP', label: 'Espagnol', fullName: 'Espagnol', for: ['2AS', '3AS'] },
  { value: 'ALM', label: 'Allemand', fullName: 'Allemand', for: ['2AS', '3AS'] },
];

const subjectModules = [
  { value: 'MATH', label: 'Mathématiques', shortCode: 'MATH' },
  { value: 'Physique', label: 'Physique', shortCode: 'PHYS' },
 
  { value: 'Sciences', label: 'Sciences Naturelles', shortCode: 'SVT' },
  { value: 'Arabe', label: 'Arabe', shortCode: 'AR' },
  { value: 'Français', label: 'Français', shortCode: 'FR' },
  { value: 'Anglais', label: 'Anglais', shortCode: 'ANG' },
  { value: 'Histoire-Géographie', label: 'Histoire-Géographie', shortCode: 'HG' },
  { value: 'Philosophie', label: 'Philosophie', shortCode: 'FILO' },
  { value: 'Éducation Islamique', label: 'Éducation Islamique', shortCode: 'ISLAM' },
];

export default function CourseFormNew({ open, onClose }: CourseFormProps) {
  const queryClient = useQueryClient();

  // Récupérer les données
  const { data: trainers } = useQuery<Trainer[]>({
    queryKey: ['trainers'],
    queryFn: async () => {
      const response = await api.get('/trainers');
      return response.data.data;
    },
    enabled: open,
  });

  const { data: timeSlots } = useQuery<TimeSlot[]>({
    queryKey: ['timeslots'],
    queryFn: async () => {
      const response = await api.get('/time-slots');
      return response.data.data;
    },
    enabled: open,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data.data;
    },
    enabled: open,
  });

  const [formData, setFormData] = useState({
    type: 'TUTORING_GROUP',
    // Cours de Soutien
    schoolLevel: '',
    lyceeBranch: '', // Pour 1AS (une seule branche)
    lyceeBranches: [] as string[], // Pour 2AS/3AS (toutes les branches)
    subjectModule: '',
    trainerId: '',
    groupNumber: 1,
    pricePerMonth: 3000,
    // Cours Individuel
    studentId: '',
    timeSlotId: '',
    pricePerHour: 500,
    // Formation Qualifiante
    title: '',
    durationMonths: 3,
    maxStudents: 15,
    price: 45000,
    description: '',
  });

  const [generatedTitle, setGeneratedTitle] = useState('');

  // Génération automatique du titre pour cours de soutien
  useEffect(() => {
    if (formData.type === 'TUTORING_GROUP' && formData.schoolLevel && formData.subjectModule) {
      const module = subjectModules.find(m => m.value === formData.subjectModule);
      
      // Format: MODULE COMPLET - [ANNÉE]BRANCHE
      let title = '';
      
      // Pour lycée
      if (['1AS', '2AS', '3AS'].includes(formData.schoolLevel)) {
        const yearNumber = formData.schoolLevel.charAt(0); // '1', '2', ou '3'
        
        if (formData.lyceeBranch) {
          // Une seule branche sélectionnée (1AS)
          const branch = lyceeBranches.find(b => b.value === formData.lyceeBranch);
          title = `${module?.label || formData.subjectModule} - ${yearNumber}${branch?.value || ''}`;
        } else if (formData.lyceeBranches.length > 0) {
          // Plusieurs branches sélectionnées (2AS/3AS)
          const branches = formData.lyceeBranches.map(b => {
            const branch = lyceeBranches.find(br => br.value === b);
            return branch?.value || b;
          }).join(',');
          title = `${module?.label || formData.subjectModule} - ${yearNumber}${branches}`;
        }
      } else {
        // Pour primaire/collège : MODULE - NIVEAU
        title = `${module?.label || formData.subjectModule} - ${formData.schoolLevel}`;
      }
      
      if (formData.groupNumber > 1) {
        title += ` - G${formData.groupNumber}`;
      }
      
      setGeneratedTitle(title);
    } else {
      setGeneratedTitle('');
    }
  }, [formData.type, formData.schoolLevel, formData.lyceeBranch, formData.lyceeBranches, formData.subjectModule, formData.groupNumber]);

  // Réinitialiser les branches lors du changement de niveau
  useEffect(() => {
    setFormData(prev => ({ ...prev, lyceeBranches: [], lyceeBranch: '' }));
  }, [formData.schoolLevel]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'TUTORING_GROUP',
      schoolLevel: '',
      lyceeBranch: '',
      lyceeBranches: [],
      subjectModule: '',
      trainerId: '',
      groupNumber: 1,
      pricePerMonth: 3000,
      studentId: '',
      timeSlotId: '',
      pricePerHour: 500,
      title: '',
      durationMonths: 3,
      maxStudents: 15,
      price: 45000,
      description: '',
    });
    setGeneratedTitle('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let payload: any = {
      type: formData.type,
      trainerId: formData.trainerId,
      isActive: true,
    };

    if (formData.type === 'TUTORING_GROUP') {
      payload = {
        ...payload,
        title: generatedTitle,
        category: 'Soutien scolaire',
        schoolLevels: [formData.schoolLevel],
        lyceeBranches: formData.schoolLevel === '1AS' && formData.lyceeBranch 
          ? [formData.lyceeBranch] 
          : formData.lyceeBranches,
        subjectModule: formData.subjectModule,
        pricePerMonth: formData.pricePerMonth,
        durationMonths: 12, // Année scolaire complète
        description: `Cours de soutien en ${formData.subjectModule} pour ${schoolLevels.find(l => l.value === formData.schoolLevel)?.label}`,
      };
    } else if (formData.type === 'TUTORING_INDIVIDUAL') {
      const student = students?.find(s => s.id === Number(formData.studentId));
      payload = {
        ...payload,
        title: `Cours Individuel - ${formData.subjectModule} - ${student?.firstName} ${student?.lastName}`,
        category: 'Soutien scolaire',
        subjectModule: formData.subjectModule,
        timeSlotId: formData.timeSlotId,
        pricePerSession: formData.pricePerHour,
        description: `Cours individuel de ${formData.subjectModule}`,
      };
    } else if (formData.type === 'QUALIFYING') {
      payload = {
        ...payload,
        title: formData.title,
        category: 'Formation professionnelle',
        durationMonths: formData.durationMonths,
        maxStudents: formData.maxStudents,
        price: formData.price,
        description: formData.description,
        certificate: 'Certificat école',
      };
    }

    mutation.mutate(payload);
  };

  const showBranchSelection = formData.schoolLevel === '1AS';
  const showAllBranches = ['2AS', '3AS'].includes(formData.schoolLevel);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={600}>
            ➕ Créer une Formation
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {/* Type de formation */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                required
                label="Type de Formation"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {courseTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* ========== COURS DE SOUTIEN (GROUPE) ========== */}
            {formData.type === 'TUTORING_GROUP' && (
              <>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Le nom de la formation sera généré automatiquement
                  </Alert>
                </Grid>

                {/* Niveau scolaire */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Niveau Scolaire"
                    value={formData.schoolLevel}
                    onChange={(e) => setFormData({ ...formData, schoolLevel: e.target.value })}
                  >
                    {schoolLevels.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Branche (pour 1AS seulement) */}
                {showBranchSelection && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Branche (1ère AS)"
                      value={formData.lyceeBranch}
                      onChange={(e) => setFormData({ ...formData, lyceeBranch: e.target.value })}
                      helperText="Tronc commun 1AS : 2 branches"
                    >
                      {lyceeBranches
                        .filter(b => b.for.includes('1AS'))
                        .map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>
                )}

                {/* Branches pour 2AS/3AS (sélection manuelle) */}
                {showAllBranches && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Branches"
                      value={formData.lyceeBranches}
                      onChange={(e) => setFormData({ ...formData, lyceeBranches: typeof e.target.value === 'string' ? [e.target.value] : e.target.value })}
                      SelectProps={{
                        multiple: true,
                        renderValue: (selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => {
                              const branch = lyceeBranches.find(b => b.value === value);
                              return <Chip key={value} label={`${branch?.value || value}`} size="small" />;
                            })}
                          </Box>
                        ),
                      }}
                      helperText="Sélectionnez une ou plusieurs branches"
                    >
                      {lyceeBranches
                        .filter(b => b.for.includes(formData.schoolLevel))
                        .map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>
                )}

                {/* Module/Matière */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Module/Matière"
                    value={formData.subjectModule}
                    onChange={(e) => setFormData({ ...formData, subjectModule: e.target.value })}
                  >
                    {subjectModules.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Prof */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Professeur"
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  >
                    {trainers?.map((trainer) => (
                      <MenuItem key={trainer.id} value={trainer.id}>
                        {trainer.firstName} {trainer.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Numéro de groupe */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Numéro de Groupe"
                    value={formData.groupNumber}
                    onChange={(e) => setFormData({ ...formData, groupNumber: parseInt(e.target.value) || 1 })}
                    inputProps={{ min: 1 }}
                    helperText="Par défaut: 1"
                  />
                </Grid>

                {/* Prix par mois */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Prix par Mois (DA)"
                    value={formData.pricePerMonth}
                    onChange={(e) => setFormData({ ...formData, pricePerMonth: parseFloat(e.target.value) })}
                    inputProps={{ min: 0, step: 100 }}
                  />
                </Grid>

                {/* Aperçu du nom généré */}
                {generatedTitle && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary.dark" gutterBottom>
                        📝 Nom de la formation :
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="primary.dark">
                        {generatedTitle}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}

            {/* ========== COURS INDIVIDUEL ========== */}
            {formData.type === 'TUTORING_INDIVIDUAL' && (
              <>
                {/* Étudiant */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Étudiant"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  >
                    {students?.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.user.email}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Prof */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Professeur"
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  >
                    {trainers?.map((trainer) => (
                      <MenuItem key={trainer.id} value={trainer.id}>
                        {trainer.firstName} {trainer.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Module */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Module/Matière"
                    value={formData.subjectModule}
                    onChange={(e) => setFormData({ ...formData, subjectModule: e.target.value })}
                  >
                    {subjectModules.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Créneau */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Créneau Horaire"
                    value={formData.timeSlotId}
                    onChange={(e) => setFormData({ ...formData, timeSlotId: e.target.value })}
                  >
                    {timeSlots?.map((slot) => (
                      <MenuItem key={slot.id} value={slot.id}>
                        {slot.dayOfWeek} : {slot.startTime} - {slot.endTime}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Prix par heure */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Prix par Heure (DA)"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) })}
                    inputProps={{ min: 0, step: 100 }}
                  />
                </Grid>
              </>
            )}

            {/* ========== FORMATION QUALIFIANTE ========== */}
            {formData.type === 'QUALIFYING' && (
              <>
                {/* Nom de formation */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nom de la Formation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Développement Web Fullstack"
                  />
                </Grid>

                {/* Prof */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Formateur"
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  >
                    {trainers?.map((trainer) => (
                      <MenuItem key={trainer.id} value={trainer.id}>
                        {trainer.firstName} {trainer.lastName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Durée en mois */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Durée (mois)"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {/* Nombre de places */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Nombre de Places"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                {/* Prix total */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Prix de la Formation (DA)"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    inputProps={{ min: 0, step: 1000 }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={4}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le contenu de la formation..."
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            sx={{ minWidth: 120 }}
          >
            {mutation.isPending ? 'Création...' : 'Créer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
