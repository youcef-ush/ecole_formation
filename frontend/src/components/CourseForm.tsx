import { useState } from "react";
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
} from "@mui/material";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "../services/api";

interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
}

interface TimeSlot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface Trainer {
  id: number;
  firstName: string;
  lastName: string;
  specialty: string;
  phone: string;
}

interface CourseFormProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { value: "Formation professionnelle", label: "Formation professionnelle" },
  { value: "Soutien scolaire", label: "Soutien scolaire" },
  { value: "Atelier", label: "Atelier" },
];

const courseTypes = [
  { value: "TUTORING_GROUP", label: "👥 Cours de Soutien (Groupe)" },
  { value: "TUTORING_INDIVIDUAL", label: "👤 Cours Individuel" },
  { value: "QUALIFYING", label: "🎓 Formation Qualifiante" },
];

const certificates = [
  { value: "Certificat école", label: "Certificat de l'école" },
  { value: "CQP", label: "CQP (Certificat de Qualification Professionnelle)" },
  { value: "Diplôme État", label: "Diplôme d'État" },
  { value: "Aucun", label: "Aucun" },
];

const schoolLevels = [
  // Primaire
  { value: "1AP", label: "1ère année primaire", category: "primaire" },
  { value: "2AP", label: "2ème année primaire", category: "primaire" },
  { value: "3AP", label: "3ème année primaire", category: "primaire" },
  { value: "4AP", label: "4ème année primaire", category: "primaire" },
  { value: "5AP", label: "5ème année primaire", category: "primaire" },
  // Collège
  { value: "1AM", label: "1ère année collège", category: "college" },
  { value: "2AM", label: "2ème année collège", category: "college" },
  { value: "3AM", label: "3ème année collège", category: "college" },
  { value: "4AM", label: "4ème année collège (BEM)", category: "college" },
  // Lycée
  { value: "1AS", label: "1ère année secondaire", category: "lycee" },
  { value: "2AS", label: "2ème année secondaire", category: "lycee" },
  { value: "3AS", label: "3ème année secondaire (BAC)", category: "lycee" },
];

const lyceeBranches = [
  {
    value: "Sciences Expérimentales",
    label: "Sciences Expérimentales",
    for: ["2AS", "3AS"],
  },
  { value: "Mathématiques", label: "Mathématiques", for: ["2AS", "3AS"] },
  {
    value: "Techniques Mathématiques",
    label: "Techniques Mathématiques",
    for: ["2AS", "3AS"],
  },
  {
    value: "Gestion et Économie",
    label: "Gestion et Économie",
    for: ["2AS", "3AS"],
  },
  {
    value: "Lettres et Philosophie",
    label: "Lettres et Philosophie",
    for: ["2AS", "3AS"],
  },
  {
    value: "Langues Étrangères",
    label: "Langues Étrangères",
    for: ["2AS", "3AS"],
  },
];

const subjectModules = [
  { value: "Mathématiques", label: "Mathématiques" },
  { value: "Physique", label: "Physique" },
  { value: "Chimie", label: "Chimie" },
  { value: "Sciences Naturelles", label: "Sciences Naturelles" },
  { value: "Arabe", label: "Arabe" },
  { value: "Français", label: "Français" },
  { value: "Anglais", label: "Anglais" },
  { value: "Histoire-Géographie", label: "Histoire-Géographie" },
  { value: "Philosophie", label: "Philosophie" },
  { value: "Éducation Islamique", label: "Éducation Islamique" },
  { value: "Éducation Civique", label: "Éducation Civique" },
];

export default function CourseForm({ open, onClose }: CourseFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [openTrainerDialog, setOpenTrainerDialog] = useState(false);
  const [newTrainerData, setNewTrainerData] = useState({
    firstName: "",
    lastName: "",
    specialty: "",
    phone: "",
    email: "",
  });

  // Récupérer les salles depuis la base de données
  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await api.get("/rooms");
      return response.data.data;
    },
    enabled: open, // Charger seulement quand le dialog est ouvert
  });

  // Récupérer les créneaux depuis la base de données
  const { data: timeSlots } = useQuery<TimeSlot[]>({
    queryKey: ["timeslots"],
    queryFn: async () => {
      const response = await api.get("/time-slots");
      return response.data.data;
    },
    enabled: open, // Charger seulement quand le dialog est ouvert
  });

  // Récupérer les formateurs depuis la base de données
  const { data: trainers } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: async () => {
      const response = await api.get("/trainers");
      return response.data.data;
    },
    enabled: open, // Charger seulement quand le dialog est ouvert
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Soutien scolaire",
    type: "Formation Qualifiante",
    certificate: "Certificat école",
    durationHours: 0,
    durationDescription: "",
    price: 0,
    pricePerSession: 0,
    prerequisites: "",
    minAge: 16,
    maxStudents: 0,
    practicalContent: "",
    workshopDate: "",
    // Champs pour cours de soutien
    trainerId: "", // Changé de 'teacherName' à 'trainerId'
    roomId: "", // Changé de 'room' à 'roomId'
    timeSlotId: "", // Changé de 'schedule' à 'timeSlotId'
    schoolLevels: [] as string[],
    lyceeBranches: [] as string[],
    subjectModule: "",
    isActive: true,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post("/courses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la création de la formation"
      );
    },
  });

  // Mutation pour créer un nouveau formateur
  const createTrainerMutation = useMutation({
    mutationFn: async (data: typeof newTrainerData) => {
      const response = await api.post("/trainers", data);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      setOpenTrainerDialog(false);
      // Sélectionner automatiquement le nouveau formateur créé
      setFormData((prev) => ({ ...prev, trainerId: response.data.id }));
      // Réinitialiser le formulaire formateur
      setNewTrainerData({
        firstName: "",
        lastName: "",
        specialty: "",
        phone: "",
        email: "",
      });
    },
    onError: (err: any) => {
      alert(
        err.response?.data?.message || "Erreur lors de la création du formateur"
      );
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Soutien scolaire",
      type: "Formation Qualifiante",
      certificate: "Certificat école",
      durationHours: 0,
      durationDescription: "",
      price: 0,
      pricePerSession: 0,
      prerequisites: "",
      minAge: 16,
      maxStudents: 0,
      practicalContent: "",
      workshopDate: "",
      trainerId: "",
      roomId: "",
      timeSlotId: "",
      schoolLevels: [],
      lyceeBranches: [],
      subjectModule: "",
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

  const isTutoringType = formData.type.includes("Soutien Scolaire");

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            <Typography variant="h5" fontWeight={600}>
              Créer une Formation
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {/* Alerte si cours de soutien et pas de salles/créneaux */}
            {isTutoringType &&
              (!rooms ||
                rooms.length === 0 ||
                !timeSlots ||
                timeSlots.length === 0) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    ⚠️ Configuration requise pour les cours de soutien
                  </Typography>
                  {(!rooms || rooms.length === 0) && (
                    <Typography variant="body2">
                      • Vous devez d'abord créer des <strong>Salles</strong>{" "}
                      (menu Salles)
                    </Typography>
                  )}
                  {(!timeSlots || timeSlots.length === 0) && (
                    <Typography variant="body2">
                      • Vous devez d'abord créer des{" "}
                      <strong>Créneaux Horaires</strong> (menu Créneaux)
                    </Typography>
                  )}
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
                  onChange={(e) => handleChange("type", e.target.value)}
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
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder={
                    isTutoringType
                      ? "Ex: Maths - Préparation BAC"
                      : "Ex: Formation en Pâtisserie Fine"
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
                  onChange={(e) => handleChange("category", e.target.value)}
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
                    onChange={(e) =>
                      handleChange("certificate", e.target.value)
                    }
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
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Décrivez le contenu et les objectifs de la formation..."
                />
              </Grid>

              {/* Durée ou Date selon la catégorie */}
              {formData.category !== "Atelier" ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label={
                        isTutoringType
                          ? "Durée (heures par mois)"
                          : "Durée totale (heures)"
                      }
                      value={formData.durationHours}
                      onChange={(e) =>
                        handleChange("durationHours", parseInt(e.target.value))
                      }
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Description de la durée"
                      value={formData.durationDescription}
                      onChange={(e) =>
                        handleChange("durationDescription", e.target.value)
                      }
                      placeholder={
                        isTutoringType
                          ? "Ex: 8h/mois"
                          : "Ex: 3 mois, 6 semaines"
                      }
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Date de l'atelier"
                    value={formData.workshopDate || ""}
                    onChange={(e) =>
                      handleChange("workshopDate", e.target.value)
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText="Sélectionnez la date de l'atelier d'une journée"
                  />
                </Grid>
              )}

              {/* Prix selon la catégorie */}
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label={
                    formData.category === "Formation professionnelle"
                      ? "Prix de la formation (DA)"
                      : formData.category === "Soutien scolaire"
                      ? "Prix par mois (DA)"
                      : formData.category === "Atelier"
                      ? "Prix par séance (DA)"
                      : "Prix (DA)"
                  }
                  value={formData.price}
                  onChange={(e) =>
                    handleChange("price", parseFloat(e.target.value))
                  }
                  inputProps={{ min: 0, step: 100 }}
                  helperText={
                    formData.category === "Formation professionnelle"
                      ? "Prix total de la formation"
                      : formData.category === "Soutien scolaire"
                      ? "Abonnement mensuel pour le soutien scolaire"
                      : formData.category === "Atelier"
                      ? "Prix pour une séance d'atelier"
                      : "Montant à payer"
                  }
                />
              </Grid>

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
                      onChange={(e) =>
                        handleChange("subjectModule", e.target.value)
                      }
                    >
                      {subjectModules.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Formateur/Enseignant */}
                  <Grid item xs={12}>
                    <Box
                      sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                    >
                      <TextField
                        select
                        fullWidth
                        required
                        label="Formateur/Enseignant"
                        value={formData.trainerId}
                        onChange={(e) =>
                          handleChange("trainerId", e.target.value)
                        }
                        helperText={
                          !trainers || trainers.length === 0
                            ? "⚠️ Aucun formateur disponible"
                            : "Sélectionnez un formateur"
                        }
                        disabled={!trainers || trainers.length === 0}
                      >
                        {trainers?.map((trainer) => (
                          <MenuItem key={trainer.id} value={trainer.id}>
                            {trainer.firstName} {trainer.lastName} -{" "}
                            {trainer.specialty}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="outlined"
                        onClick={() => setOpenTrainerDialog(true)}
                        sx={{ minWidth: "150px", height: "56px" }}
                      >
                        ➕ Nouveau
                      </Button>
                    </Box>
                  </Grid>

                  {/* Salle */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Salle"
                      value={formData.roomId}
                      onChange={(e) => handleChange("roomId", e.target.value)}
                      helperText={
                        !rooms || rooms.length === 0
                          ? "⚠️ Aucune salle disponible. Créez d'abord des salles."
                          : "Sélectionnez une salle"
                      }
                      disabled={!rooms || rooms.length === 0}
                    >
                      {rooms?.map((room) => (
                        <MenuItem key={room.id} value={room.id}>
                          {room.name} - {room.type} ({room.capacity} places)
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Horaires/Créneaux */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Créneau Horaire"
                      value={formData.timeSlotId}
                      onChange={(e) =>
                        handleChange("timeSlotId", e.target.value)
                      }
                      helperText={
                        !timeSlots || timeSlots.length === 0
                          ? "⚠️ Aucun créneau disponible. Créez d'abord des créneaux."
                          : "Sélectionnez un créneau"
                      }
                      disabled={!timeSlots || timeSlots.length === 0}
                    >
                      {timeSlots?.map((slot) => (
                        <MenuItem key={slot.id} value={slot.id}>
                          {slot.dayOfWeek} : {slot.startTime} - {slot.endTime}
                          {slot.label && ` (${slot.label})`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Niveaux scolaires */}
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Niveaux scolaires acceptés"
                      value={formData.schoolLevels}
                      onChange={(e) =>
                        handleChange("schoolLevels", e.target.value)
                      }
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
                  {formData.schoolLevels.some((level) =>
                    level.includes("secondaire")
                  ) && (
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Branches du lycée (optionnel)"
                        value={formData.lyceeBranches}
                        onChange={(e) =>
                          handleChange("lyceeBranches", e.target.value)
                        }
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
                      onChange={(e) =>
                        handleChange("minAge", parseInt(e.target.value))
                      }
                      inputProps={{ min: 10, max: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Capacité maximale (étudiants)"
                      value={formData.maxStudents}
                      onChange={(e) =>
                        handleChange("maxStudents", parseInt(e.target.value))
                      }
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
                  onChange={(e) =>
                    handleChange("prerequisites", e.target.value)
                  }
                  placeholder={
                    isTutoringType
                      ? "Ex: Niveau 3ème année secondaire"
                      : "Ex: Aucun prérequis nécessaire"
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
                    onChange={(e) =>
                      handleChange("practicalContent", e.target.value)
                    }
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
                      onChange={(e) =>
                        handleChange("isActive", e.target.checked)
                      }
                    />
                  }
                  label="Formation active (visible pour les étudiants)"
                />
              </Grid>
            </Grid>

            {/* Info box */}
            <Box sx={{ mt: 3, p: 2, bgcolor: "info.light", borderRadius: 1 }}>
              <Typography variant="body2" color="info.dark">
                💡 <strong>Conseil:</strong>{" "}
                {isTutoringType
                  ? "Pour les cours de soutien, pensez à bien préciser la matière, le niveau et les horaires dans la description."
                  : "Pour les formations qualifiantes, détaillez le programme et les compétences acquises."}
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
              {mutation.isPending ? "Création..." : "Créer la Formation"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog pour créer un nouveau formateur */}
      <Dialog
        open={openTrainerDialog}
        onClose={() => setOpenTrainerDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Créer un Nouveau Formateur</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Le formateur sera créé et automatiquement sélectionné pour cette
            formation.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Prénom"
                value={newTrainerData.firstName}
                onChange={(e) =>
                  setNewTrainerData({
                    ...newTrainerData,
                    firstName: e.target.value,
                  })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Nom"
                value={newTrainerData.lastName}
                onChange={(e) =>
                  setNewTrainerData({
                    ...newTrainerData,
                    lastName: e.target.value,
                  })
                }
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Spécialité"
                value={newTrainerData.specialty}
                onChange={(e) =>
                  setNewTrainerData({
                    ...newTrainerData,
                    specialty: e.target.value,
                  })
                }
                margin="normal"
                placeholder="Ex: Mathématiques, Informatique, Cuisine..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Téléphone"
                value={newTrainerData.phone}
                onChange={(e) =>
                  setNewTrainerData({
                    ...newTrainerData,
                    phone: e.target.value,
                  })
                }
                margin="normal"
                placeholder="Ex: 0555123456"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newTrainerData.email}
                onChange={(e) =>
                  setNewTrainerData({
                    ...newTrainerData,
                    email: e.target.value,
                  })
                }
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrainerDialog(false)}>Annuler</Button>
          <Button
            onClick={() => {
              if (
                !newTrainerData.firstName ||
                !newTrainerData.lastName ||
                !newTrainerData.specialty ||
                !newTrainerData.phone
              ) {
                alert("Veuillez remplir tous les champs obligatoires");
                return;
              }
              createTrainerMutation.mutate(newTrainerData);
            }}
            variant="contained"
            color="primary"
            disabled={createTrainerMutation.isPending}
          >
            {createTrainerMutation.isPending
              ? "Création..."
              : "Créer le Formateur"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
