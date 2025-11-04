# 💻 Spécifications Détaillées - Application de Gestion d'École de Formation

## Vue d'ensemble

Application centralisée pour la gestion administrative, pédagogique et financière de l'école. Interface basée sur un menu latéral avec 7 modules principaux.

---

## I. 📊 Tableau de Bord (Page d'Accueil)

### Cockpit de Pilotage

**Indicateurs Clés (KPI) - 4 Cartes:**
- 🎓 **Étudiants** : Total des étudiants inscrits et validés
- 👨‍🏫 **Formateurs** : Nombre de formateurs actifs
- 📚 **Formations** : Total des formations créées
- 💰 **Revenu Total** : Montant total encaissé

**Widget Activités du Jour:**
- Liste des cours planifiés pour la journée en cours
- Affichage par ligne :
  - Titre du Créneau/Cours
  - Nom de la Salle
  - Nom du Professeur
  - Heures de début et fin

**Statuts Rapides - 2 Cartes:**
- 📝 **Inscriptions Actives** : En attente de validation financière
- 🗓️ **Sessions à Venir** : Programmées pour les jours/semaines suivants

---

## II. 🎓 Gestion des Étudiants

### Répertoire des Apprenants

**Affichage:**
- Tableau principal listant UNIQUEMENT les étudiants dont l'inscription est **validée par le service financier**

**Filtres Avancés:**
- 🔍 Par **Nom** (recherche textuelle)
- 📚 Par **Formation** (liste déroulante)
- ✅ Par **Statut** (Actif, Suspendu, Abandon)
- 💳 **"Paiement à Jour ce Mois"** (Oui/Non)

**Boutons d'Action:**
- ❌ **AUCUN bouton "Ajouter un étudiant"** direct
- ✅ L'ajout se fait UNIQUEMENT via la page "Inscriptions"
- 👁️ **Détails** : Consultation des informations
- ✏️ **Modifier** : Après clic sur le nom

---

## III. 🧑‍🏫 Gestion des Formateurs/Professeurs

### Ressources Humaines Pédagogiques

**Affichage:**
- Tableau listant tous les formateurs
- Colonnes :
  - Informations personnelles
  - Modules enseignés
  - Formations/Groupes encadrés actuellement

**Boutons d'Action:**
- ➕ **"Créer Professeur"** (en haut du tableau)
- ✏️ **"Modifier"** (par ligne) : Mise à jour des infos et modules d'expertise
- 🗑️ **"Supprimer"** (par ligne)

---

## IV. 📚 Gestion des Formations (Création des Offres)

### A. Cours de Soutien (Collectif)

**Formulaire de Création:**
- 📝 **Nom de la Formation/Cours** (ex: Soutien Math)
- 📅 **Année Scolaire** (ex: Terminale)
- 👥 **Groupe** (ex: Groupe A)
- 🎯 **Spécialité** (UNIQUEMENT pour Lycée) : Sciences, Économie, etc.
- 👨‍🏫 **Professeur** (sélection dans la liste)
- 📖 **Module** (liste RESTREINTE aux modules que le professeur sélectionné est habilité à enseigner)
- 💰 **Prix** (Mensuel)
- 🏫 **Salle** (sélection)
- ⏰ **Créneau** (sélection avec vérification de disponibilité)

### B. Cours Individuel (One-to-One)

**Formulaire de Création:**
- 👨‍🏫 **Professeur** (sélection)
- 🎓 **Étudiant** (sélection)
- 🏫 **Salle** (sélection)
- ⏰ **Créneau** (avec vérification de disponibilité immédiate)
- 💰 **Prix** (À l'heure ou forfait)

### C. Formations Classiques (Cuisine/Couture)

**Formulaire de Création:**
- 📝 **Nom de la Formation**
- 👨‍🏫 **Formateur**
- ⏱️ **Durée** (en mois/heures)
- 💰 **Prix**
- ⏰ **Créneau** (sélection)
- 🏫 **Salle** (sélection)

---

## V. 📝 Gestion des Inscriptions

### Gestion des Demandes Entrantes

**Formulaire d'Inscription (Simple):**
- 👤 **Nom** de l'étudiant
- 👤 **Prénom** de l'étudiant
- 📚 **Formation** désirée (sélection)

**Affichage:**
- Tableau listant toutes les demandes d'inscription reçues

**Colonnes du Tableau:**
- Nom et Prénom
- Formation demandée
- Date de demande
- **État** (badge coloré) :
  - 🟡 "En attente de paiement"
  - 🟢 "Validée par Finance"
  - 🔴 "Refusée"

**Workflow:**
1. Inscription créée → État "En attente de paiement"
2. Finance valide le paiement → État "Validée par Finance"
3. Étudiant apparaît dans le module "Étudiants"

---

## VI. 💸 Gestion Financière (Module Finance)

### Suivi de la Santé Financière

**A. Paiements Généraux**

**Tableau Central:**
- Tous les étudiants inscrits
- Colonnes :
  - Nom de l'étudiant
  - Formation
  - **État du paiement** (badge) :
    - 🟢 "Paiement effectué"
    - 🔴 "Non payé"
  - **Bouton "Valider Paiement"** (par ligne)

**Actions:**
- Clic sur "Valider Paiement" :
  - Change l'état à "Payé"
  - Débloque l'accès aux cours
  - Si c'était une première inscription → Étudiant visible dans module "Étudiants"

**B. Suivi Mensuel (Cours de Soutien)**

**Tableau Spécifique:**
- Dédié aux étudiants des Cours de Soutien
- Lignes : Un étudiant par ligne
- Colonnes : Les **Mois de l'année scolaire**
  - Septembre | Octobre | Novembre | Décembre | Janvier | Février | Mars | Avril | Mai | Juin

**Cellules:**
- 🟢 Payé
- 🔴 Impayé
- Clic sur cellule → Popup pour valider le paiement du mois

---

## VII. 🏗️ Gestion des Salles (Classes)

### Configuration de l'Infrastructure

**Affichage:**
- Tableau des Salles
- Colonnes :
  - 🏫 **Nom de la Salle** (ex: "Salle A", "Atelier Cuisine 1")
  - 👥 **Capacité** maximale
  - 🏷️ **Type** (Théorique, Pratique, Informatique)

**Boutons d'Action:**
- ➕ **"Ajouter une Salle"** (en haut)
- ✏️ **"Modifier"** (par ligne)
- 🗑️ **"Supprimer"** (par ligne, avec vérification qu'aucune session active n'y est liée)

---

## VIII. ⏰ Gestion des Créneaux Horaires

### Configuration des Blocs Horaires

**Affichage:**
- Tableau des Créneaux
- Colonnes :
  - 📅 **Jour de la Semaine** (Lundi, Mardi, etc.)
  - 🕐 **Heure de Début** (ex: 10:00)
  - 🕐 **Heure de Fin** (ex: 12:00)

**Boutons d'Action:**
- ➕ **"Définir un Créneau"** (en haut)
- ✏️ **"Modifier"** (par ligne)
- 🗑️ **"Supprimer"** (par ligne)

---

## IX. 🗓️ Gestion des Sessions

### Planning et Occupation

**Utilisation Conjointe Salles + Créneaux:**

**Création de Session:**
1. Sélectionner une **Formation**
2. Sélectionner un **Professeur**
3. Sélectionner un **Groupe** (si applicable)
4. Sélectionner une **Salle** (liste des salles disponibles)
5. Sélectionner un **Créneau** (liste des créneaux définis)

**Vérification Automatique en Temps Réel:**
- ✅ Si (Salle + Créneau) libre → Session enregistrée
- ❌ Si (Salle + Créneau) occupé → Message d'erreur "Créneau non disponible pour cette salle"
- Occupation bloquée dans le planning général

**Affichage du Planning:**
- Vue calendrier avec toutes les sessions
- Filtres par :
  - Salle
  - Professeur
  - Formation
  - Date

---

## X. 🔐 Gestion des Accès et Rôles

### Administrateur
- Accès complet à tous les modules
- Gestion des utilisateurs

### Finance
- Module Finance uniquement
- Validation des paiements
- Consultation des rapports

### Formateur
- Consultation de son planning
- Gestion des présences (future fonctionnalité)

---

## XI. 📋 Règles de Gestion

### Règles Critiques

1. **Inscription → Étudiant:**
   - Un étudiant N'APPARAÎT PAS dans "Étudiants" tant que son paiement n'est pas validé par Finance

2. **Disponibilité Salle + Créneau:**
   - Vérification OBLIGATOIRE avant création de session
   - Une salle ne peut avoir qu'UNE session par créneau

3. **Module du Professeur:**
   - Un professeur ne peut enseigner QUE les modules pour lesquels il est qualifié
   - La liste des modules se filtre automatiquement selon le professeur sélectionné

4. **Spécialité Lycée:**
   - Le champ "Spécialité" n'apparaît QUE si le niveau scolaire est "Lycée"

5. **Paiements Mensuels (Soutien):**
   - Suivi mensuel OBLIGATOIRE
   - Alerte si impayé > 1 mois

---

## XII. 🎨 Interface Utilisateur

### Menu Latéral (Permanent)
1. 📊 Tableau de Bord
2. 🎓 Étudiants
3. 🧑‍🏫 Formateurs
4. 📚 Formations
5. 📝 Inscriptions
6. 🗓️ Sessions
7. 💸 Finance
8. ⚙️ Configuration
   - 🏫 Salles
   - ⏰ Créneaux

### Codes Couleur (Badges)
- 🟢 Vert : Validé, Payé, Actif
- 🟡 Jaune : En attente, Suspendu
- 🔴 Rouge : Refusé, Impayé, Inactif
- 🔵 Bleu : Information, Programmé

---

## XIII. 🔄 Workflows Principaux

### Workflow 1: Inscription d'un Étudiant
1. Page "Inscriptions" → Clic "Nouvelle Inscription"
2. Formulaire : Nom, Prénom, Formation → Soumettre
3. État: "En attente de paiement"
4. Finance → Module Finance → Trouve l'inscription → "Valider Paiement"
5. État: "Validée par Finance"
6. **Étudiant apparaît dans module "Étudiants"**

### Workflow 2: Création d'un Cours de Soutien
1. Page "Formations" → Clic "Créer Formation"
2. Type: "Cours de Soutien (Collectif)"
3. Remplir: Nom, Année, Groupe, Spécialité (si lycée)
4. Sélectionner Professeur → La liste des modules se filtre automatiquement
5. Choisir Module, Prix
6. Sélectionner Salle et Créneau → Vérification automatique
7. Si disponible → Formation créée
8. Si occupé → Message d'erreur, choisir autre combinaison

### Workflow 3: Planification d'une Session
1. Page "Sessions" → Clic "Nouvelle Session"
2. Sélectionner Formation, Professeur, Groupe
3. Choisir Date
4. Sélectionner Salle → Affichage des créneaux disponibles UNIQUEMENT
5. Choisir Créneau libre
6. Enregistrer → Session créée et visible dans le planning

---

## XIV. 📊 Rapports et Statistiques

### Tableau de Bord
- Évolution du nombre d'étudiants (graphique)
- Répartition par formation (camembert)
- Taux de présence (barre)
- Revenus mensuels (courbe)

### Module Finance
- État des paiements global
- Revenus par formation
- Impayés en cours
- Export Excel

---

**Version:** 1.0  
**Date:** 04 Novembre 2025  
**Statut:** Spécifications Complètes
