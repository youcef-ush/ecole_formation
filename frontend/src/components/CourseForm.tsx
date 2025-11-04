import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface CourseFormProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { value: 'Soutien scolaire', label: 'Soutien scolaire' },
  { value: 'Formation professionnelle', label: 'Formation professionnelle' },
  { value: 'Développement personnel', label: 'Développement personnel' },
  { value: 'Langues', label: 'Langues' },
  { value: 'Cuisine', label: 'Cuisine' },
  { value: 'Couture', label: 'Couture' },
  { value: 'Informatique', label: 'Informatique' },
  { value: 'Autre', label: 'Autre' },
];

const courseTypes = [
  { value: 'Formation Qualifiante', label: '🎓 Formation Qualifiante (École Privée)' },
  { value: 'Soutien Scolaire (Groupe)', label: '👥 Soutien Scolaire en Groupe' },
  { value: 'Soutien Scolaire (Individuel)', label: '👤 Soutien Scolaire Individuel' },
  { value: 'Soutien Scolaire (En ligne)', label: '💻 Soutien Scolaire en Ligne' },
];

const certificates = [
  { value: 'Certificat école', label: "Certificat de l'école" },
  { value: 'CQP', label: 'CQP (Certificat de Qualification Professionnelle)' },
  { value: 'Diplôme État', label: "Diplôme d'État" },
  { value: 'Aucun', label: 'Aucun' },
];

const schoolLevels = [
  { value: '1ère année primaire', label: '1ère année primaire' },
  { value: '2ème année primaire', label: '2ème année primaire' },
  { value: '3ème année primaire', label: '3ème année primaire' },
  { value: '4ème année primaire', label: '4ème année primaire' },
  { value: '5ème année primaire', label: '5ème année primaire' },
  { value: '1ère année collège', label: '1ère année collège' },
  { value: '2ème année collège', label: '2ème année collège' },
  { value: '3ème année collège', label: '3ème année collège' },
  { value: '4ème année collège (BEM)', label: '4ème année collège (BEM)' },
  { value: '1ère année secondaire', label: '1ère année secondaire' },
  { value: '2ème année secondaire', label: '2ème année secondaire' },
  { value: '3ème année secondaire (BAC)', label: '3ème année secondaire (BAC)' },
];

const lyceeBranches = [
  { value: 'Sciences Expérimentales', label: 'Sciences Expérimentales' },
  { value: 'Mathématiques', label: 'Mathématiques' },
  { value: 'Techniques Mathématiques', label: 'Techniques Mathématiques' },
  { value: 'Gestion et Économie', label: 'Gestion et Économie' },
  { value: 'Lettres et Philosophie', label: 'Lettres et Philosophie' },
  { value: 'Langues Étrangères', label: 'Langues Étrangères' },
];

const subjectModules = [
  { value: 'Mathématiques', label: 'Mathématiques' },
  { value: 'Physique', label: 'Physique' },
  { value: 'Chimie', label: 'Chimie' },
  { value: 'Sciences Naturelles', label: 'Sciences Naturelles' },
  { value: 'Arabe', label: 'Arabe' },
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Histoire-Géographie', label: 'Histoire-Géographie' },
  { value: 'Philosophie', label: 'Philosophie' },
  { value: 'Éducation Islamique', label: 'Éducation Islamique' },
  { value: 'Éducation Civique', label: 'Éducation Civique' },
];

export default function CourseForm({ open, onClose }: CourseFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Soutien scolaire',
    type: 'Formation Qualifiante',
    certificate: 'Certificat école',
    durationHours: 0,
    durationDescription: '',
    price: 0,
    pricePerSession: 0,
    prerequisites: '',
    minAge: 16,
    maxStudents: 0,
    practicalContent: '',
    // Champs pour cours de soutien
    teacherName: '',
    room: '',
    schedule: '',
    schoolLevels: [] as string[],
    lyceeBranches: [] as string[],
    subjectModule: '',
    isActive: true,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la création de la formation');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Soutien scolaire',
      type: 'Formation Qualifiante',
      certificate: 'Certificat école',
      durationHours: 0,
      durationDescription: '',
      price: 0,
      pricePerSession: 0,
      prerequisites: '',
      minAge: 16,
      maxStudents: 0,
      practicalContent: '',
      teacherName: '',
      room: '',
      schedule: '',
      schoolLevels: [],
      lyceeBranches: [],
      subjectModule: '',
      isActive: true,
    });
    setError(null);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const isTutoringType = formData.type.includes('Soutien Scolaire');
  const isGroupType = formData.type === 'Soutien Scolaire (Groupe)';
  const isIndividualType = formData.type === 'Soutien Scolaire (Individuel)';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={600}>
            Créer une Formation
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Type de Formation */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                required
                label="Type de Formation"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                helperText="Sélectionnez le type de formation proposée"
              >
                {courseTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Titre */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Titre de la Formation"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={
                  isTutoringType
                    ? 'Ex: Maths - Préparation BAC'
                    : 'Ex: Formation en Pâtisserie Fine'
                }
              />
            </Grid>

            {/* Catégorie */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Catégorie"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {categories.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Certificat (seulement pour formations qualifiantes) */}
            {!isTutoringType && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Certificat Délivré"
                  value={formData.certificate}
                  onChange={(e) => handleChange('certificate', e.target.value)}
                >
                  {certificates.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Décrivez le contenu et les objectifs de la formation..."
              />
            </Grid>

            {/* Durée */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={isTutoringType ? 'Durée (heures par mois)' : 'Durée totale (heures)'}
                value={formData.durationHours}
                onChange={(e) => handleChange('durationHours', parseInt(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description de la durée"
                value={formData.durationDescription}
                onChange={(e) => handleChange('durationDescription', e.target.value)}
                placeholder={isTutoringType ? 'Ex: 8h/mois' : 'Ex: 3 mois, 6 semaines'}
              />
            </Grid>

            {/* Prix */}
            <Grid item xs={12} sm={isIndividualType ? 6 : 12}>
              <TextField
                fullWidth
                required
                type="number"
                label={
                  isTutoringType
                    ? isIndividualType
                      ? 'Prix par mois (DA)'
                      : 'Abonnement mensuel (DA)'
                    : 'Prix total (DA)'
                }
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 100 }}
                helperText={
                  isGroupType
                    ? 'Prix mensuel pour cours en groupe'
                    : isIndividualType
                    ? 'Abonnement mensuel pour cours individuels'
                    : 'Prix total de la formation'
                }
              />
            </Grid>

            {/* Prix par séance (seulement pour cours individuels) */}
            {isIndividualType && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prix par séance (DA)"
                  value={formData.pricePerSession}
                  onChange={(e) => handleChange('pricePerSession', parseFloat(e.target.value))}
                  inputProps={{ min: 0, step: 100 }}
                  helperText="Prix pour une séance individuelle"
                />
              </Grid>
            )}

            {/* Champs spécifiques pour cours de soutien */}
            {isTutoringType && (
              <>
                {/* Matière/Module */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Matière/Module"
                    value={formData.subjectModule}
                    onChange={(e) => handleChange('subjectModule', e.target.value)}
                  >
                    {subjectModules.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Nom de l'enseignant */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Nom de l'enseignant"
                    value={formData.teacherName}
                    onChange={(e) => handleChange('teacherName', e.target.value)}
                    placeholder="Ex: M. Ahmed Benali"
                  />
                </Grid>

                {/* Salle */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Salle"
                    value={formData.room}
                    onChange={(e) => handleChange('room', e.target.value)}
                    placeholder="Ex: Salle 101, Bloc A"
                  />
                </Grid>

                {/* Horaires/Créneaux */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Horaires/Créneaux"
                    value={formData.schedule}
                    onChange={(e) => handleChange('schedule', e.target.value)}
                    placeholder="Ex: Lundi 14h-16h, Mercredi 10h-12h"
                  />
                </Grid>

                {/* Niveaux scolaires */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Niveaux scolaires acceptés"
                    value={formData.schoolLevels}
                    onChange={(e) => handleChange('schoolLevels', e.target.value)}
                    SelectProps={{
                      multiple: true,
                    }}
                    helperText="Sélectionnez un ou plusieurs niveaux"
                  >
                    {schoolLevels.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Branches du lycée (si niveau lycée sélectionné) */}
                {formData.schoolLevels.some(level => level.includes('secondaire')) && (
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Branches du lycée (optionnel)"
                      value={formData.lyceeBranches}
                      onChange={(e) => handleChange('lyceeBranches', e.target.value)}
                      SelectProps={{
                        multiple: true,
                      }}
                      helperText="Sélectionnez les branches/spécialités du lycée"
                    >
                      {lyceeBranches.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </>
            )}

            {/* Âge minimum et Capacité (SEULEMENT pour formations qualifiantes) */}
            {!isTutoringType && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Âge minimum"
                    value={formData.minAge}
                    onChange={(e) => handleChange('minAge', parseInt(e.target.value))}
                    inputProps={{ min: 10, max: 100 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Capacité maximale (étudiants)"
                    value={formData.maxStudents}
                    onChange={(e) => handleChange('maxStudents', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                    helperText="Nombre maximum d'étudiants"
                  />
                </Grid>
              </>
            )}

            {/* Prérequis */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Prérequis"
                value={formData.prerequisites}
                onChange={(e) => handleChange('prerequisites', e.target.value)}
                placeholder={
                  isTutoringType
                    ? 'Ex: Niveau 3ème année secondaire'
                    : 'Ex: Aucun prérequis nécessaire'
                }
              />
            </Grid>

            {/* Contenu pratique (pour formations qualifiantes) */}
            {!isTutoringType && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Contenu Pratique"
                  value={formData.practicalContent}
                  onChange={(e) => handleChange('practicalContent', e.target.value)}
                  placeholder="Ex: Stage pratique de 2 semaines, réalisation de 10 projets..."
                />
              </Grid>
            )}

            {/* Formation active */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                }
                label="Formation active (visible pour les étudiants)"
              />
            </Grid>
          </Grid>

          {/* Info box */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.dark">
              💡 <strong>Conseil:</strong>{' '}
              {isTutoringType
                ? 'Pour les cours de soutien, pensez à bien préciser la matière, le niveau et les horaires dans la description.'
                : 'Pour les formations qualifiantes, détaillez le programme et les compétences acquises.'}
            </Typography>
          </Box>
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
            {mutation.isPending ? 'Création...' : 'Créer la Formation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
