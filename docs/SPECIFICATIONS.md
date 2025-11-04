# 📋 Spécifications Fonctionnelles - École de Formation V1

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Modules Fonctionnels](#modules-fonctionnels)
3. [Cas d'usage](#cas-dusage)
4. [Règles Métier](#règles-métier)
5. [Interface Utilisateur](#interface-utilisateur)
6. [Roadmap V2+](#roadmap-v2)

---

## Vue d'ensemble

### Objectif

Fournir une solution SaaS administrative complète pour gérer les opérations quotidiennes d'une école de formation, incluant :
- Gestion des utilisateurs (étudiants, formateurs)
- Catalogue de formations
- Planning des sessions
- Inscriptions et paiements manuels
- Suivi via dashboard

### Utilisateurs Cibles

- **Administrateurs** : Personnel administratif de l'école
- **Directeurs** : Direction de l'école
- **Secrétaires** : Personnel d'accueil et gestion

---

## Modules Fonctionnels

### 1. Dashboard

#### Description
Vue d'ensemble centralisée des indicateurs clés de performance (KPI).

#### Fonctionnalités
- **Statistiques en temps réel** :
  - 👥 Nombre total d'étudiants
  - 📚 Nombre de formations actives
  - 📝 Nombre d'inscriptions en cours
  - 💰 Revenus totaux (paiements validés)

- **Graphiques** :
  - Évolution des inscriptions (mensuel)
  - Taux de remplissage des sessions
  - Répartition des paiements (En attente / Payé / Annulé)
  - Revenus mensuels

- **Alertes** :
  - ⚠️ Sessions bientôt complètes
  - ⚠️ Paiements en attente depuis > 7 jours
  - ⚠️ Sessions commençant dans 48h

#### Accès
- ✅ Administrateurs : Tous les indicateurs
- ❌ Autres rôles : Non disponible en V1

---

### 2. Gestion des Étudiants

#### Description
Module complet pour créer, modifier, rechercher et suivre les étudiants.

#### Fonctionnalités

**2.1 Liste des Étudiants**
- Affichage tabulaire avec pagination (20 par page)
- Colonnes : ID, Nom, Prénom, Email, Téléphone, Date d'inscription, Actions
- **Recherche** : Par nom, prénom, email, téléphone
- **Filtres** : Par date d'inscription, statut
- **Tri** : Par nom, date d'inscription
- **Actions en masse** : Export CSV/Excel

**2.2 Création d'Étudiant**
- Formulaire avec validation :
  - Nom* (requis, 2-50 caractères)
  - Prénom* (requis, 2-50 caractères)
  - Date de naissance* (requis, > 16 ans)
  - Email* (requis, format email valide, unique)
  - Téléphone* (requis, format international)
  - Adresse complète (optionnel)
- Boutons : Enregistrer / Annuler

**2.3 Modification d'Étudiant**
- Formulaire pré-rempli
- Modification de tous les champs
- Historique des modifications (qui, quand)

**2.4 Profil Étudiant**
- Informations personnelles
- **Historique des inscriptions** :
  - Liste des formations suivies
  - Dates, statuts, montants
- **Historique des paiements** :
  - Détails des transactions
- **Documents** : (V2+)

**2.5 Suppression**
- Suppression logique (soft delete)
- Confirmation obligatoire
- Impossibilité de supprimer si inscriptions actives

#### Règles Métier
- Email unique dans le système
- Âge minimum : 16 ans
- Téléphone obligatoire pour contact

---

### 3. Gestion des Formateurs

#### Description
Module pour gérer les formateurs et leurs compétences.

#### Fonctionnalités

**3.1 Liste des Formateurs**
- Affichage tabulaire
- Colonnes : ID, Nom, Prénom, Spécialités, Email, Téléphone, Actions
- Recherche et filtres

**3.2 Création de Formateur**
- Formulaire :
  - Nom* (requis)
  - Prénom* (requis)
  - Email* (requis, unique)
  - Téléphone* (requis)
  - Spécialités* (multi-sélection)
    - Soutien scolaire (Maths, Français, Sciences, etc.)
    - Formations professionnelles (Cuisine, Informatique, etc.)
  - Disponibilités (jours et horaires)

**3.3 Profil Formateur**
- Informations personnelles
- Liste des spécialités
- **Sessions assignées** :
  - Sessions passées
  - Sessions en cours
  - Sessions à venir

**3.4 Planning Formateur**
- Calendrier des sessions
- Disponibilités et conflits

#### Règles Métier
- Email unique
- Au moins une spécialité requise
- Vérification des conflits de planning

---

### 4. Catalogue de Formations

#### Description
Gestion du catalogue complet des formations proposées.

#### Fonctionnalités

**4.1 Liste des Formations**
- Vue grille ou liste
- Cartes affichant : Titre, Catégorie, Durée, Prix, Statut (Active/Inactive)
- Filtres par catégorie
- Recherche par titre

**4.2 Création de Formation**
- Formulaire :
  - Titre* (requis, 3-100 caractères)
  - Description* (requis, texte enrichi)
  - Catégorie* (requis)
    - Soutien scolaire
    - Formation professionnelle
    - Développement personnel
    - Autre
  - Durée en heures* (requis, nombre)
  - Prix en euros* (requis, nombre décimal)
  - Prérequis (optionnel, texte)
  - Image de couverture (optionnel) - V2+
  - Statut : Active / Inactive

**4.3 Détails Formation**
- Vue complète
- Description longue
- Sessions disponibles
- Nombre d'inscrits
- Taux de satisfaction - V3+

**4.4 Modification**
- Tous les champs modifiables
- Historique des modifications

**4.5 Archivage**
- Désactivation (ne supprime pas)
- N'apparaît plus dans les listes actives
- Conserve l'historique

#### Règles Métier
- Titre unique
- Prix > 0
- Durée > 0
- Impossible de supprimer si sessions actives

---

### 5. Sessions et Groupes

#### Description
Planification et gestion des sessions de cours.

#### Fonctionnalités

**5.1 Calendrier**
- Vue : Jour / Semaine / Mois
- Affichage des sessions
- Couleurs par catégorie de formation
- Clic pour voir détails

**5.2 Liste des Sessions**
- Affichage tabulaire
- Colonnes : ID, Formation, Formateur, Dates, Capacité, Inscrits, Statut, Actions
- Filtres : Par formation, formateur, dates, statut
- Statut : À venir / En cours / Terminée / Annulée

**5.3 Création de Session**
- Formulaire :
  - Formation* (requis, sélection)
  - Formateur* (requis, sélection)
  - Date de début* (requis, date future)
  - Date de fin* (requis, > date début)
  - Horaires (début et fin)
  - Capacité* (requis, nombre > 0)
  - Lieu/Salle* (requis, texte)
  - Remarques (optionnel)

**5.4 Détails Session**
- Informations complètes
- **Liste des inscrits** :
  - Nom, prénom, statut paiement
  - Actions : Voir profil, Gérer paiement
- Taux de remplissage (visuel)
- Actions : Modifier / Annuler / Clôturer

**5.5 Modification**
- Tous les champs modifiables
- Notifications aux inscrits si changement majeur - V2+

**5.6 Annulation**
- Confirmation requise
- Raison d'annulation (texte)
- Gestion des remboursements - V2+

#### Règles Métier
- Date de fin > Date de début
- Capacité >= Nombre d'inscrits
- Vérification des disponibilités du formateur
- Vérification de la disponibilité de la salle

---

### 6. Gestion des Inscriptions

#### Description
Processus complet d'inscription des étudiants aux sessions.

#### Fonctionnalités

**6.1 Liste des Inscriptions**
- Affichage tabulaire
- Colonnes : ID, Étudiant, Formation, Session, Date d'inscription, Statut, Actions
- Filtres : Par statut, étudiant, formation, dates
- Tri par date, statut

**6.2 Nouvelle Inscription**
- Formulaire :
  - Étudiant* (requis, sélection ou création rapide)
  - Formation* (requis, sélection)
  - Session* (requis, sélection parmi sessions disponibles)
  - Remarques (optionnel)
- Vérification automatique :
  - Places disponibles
  - Pas de doublon (étudiant déjà inscrit)
- Création automatique du paiement en statut "En attente"

**6.3 Détails Inscription**
- Informations complètes
- Étudiant : Nom, contact
- Session : Formation, dates, formateur
- Statut de l'inscription
- Historique des paiements

**6.4 Validation du Paiement**
- Formulaire :
  - Montant reçu* (requis, pré-rempli avec prix formation)
  - Mode de paiement* (requis)
    - Espèces
    - Chèque
    - Virement bancaire
    - Carte bancaire (manuel)
  - Date de paiement* (requis, date <= aujourd'hui)
  - Référence (optionnel, ex: numéro de chèque)
  - Notes (optionnel)
- Action : Valider le paiement
- Mise à jour automatique du statut : En attente → Payé

**6.5 Annulation d'Inscription**
- Confirmation requise
- Raison d'annulation (optionnel)
- Statut : En attente ou Payé → Annulé
- Gestion du remboursement - V2+

**6.6 Statuts**

| Statut | Couleur | Signification | Actions possibles |
|--------|---------|---------------|-------------------|
| 🟡 **En attente** | Jaune | Inscription créée, paiement non reçu | Valider paiement / Annuler |
| 🟢 **Payé** | Vert | Paiement confirmé, inscription active | Annuler (avec remboursement) |
| 🔴 **Annulé** | Rouge | Inscription annulée | Aucune (historique) |

#### Règles Métier
- Vérification de places disponibles
- Pas de doublon (étudiant + session)
- Validation du montant (>= prix formation)
- Impossibilité de modifier un paiement validé (créer un avoir) - V2+

---

### 7. Gestion des Paiements

#### Description
Suivi manuel des paiements (V1 = validation manuelle uniquement).

#### Fonctionnalités

**7.1 Historique des Paiements**
- Liste de tous les paiements
- Colonnes : Date, Étudiant, Formation, Montant, Mode, Statut
- Filtres : Par statut, mode, dates
- Export CSV/Excel

**7.2 Modes de Paiement (V1)**
- ✅ Espèces
- ✅ Chèque
- ✅ Virement bancaire
- ✅ Carte bancaire (saisie manuelle)

**7.3 Tableau de Bord Paiements**
- 💰 Total des paiements reçus
- 🟡 Paiements en attente
- 📊 Répartition par mode de paiement

#### V2+ : Paiement en ligne
- Intégration Stripe / PayPal
- Paiements automatiques
- Génération de factures
- Remboursements automatisés

---

## Cas d'usage

### CU-01 : Inscrire un Nouvel Étudiant à une Formation

**Acteur** : Administrateur

**Préconditions** :
- L'administrateur est connecté
- La formation existe
- Une session est disponible avec places libres

**Scénario Principal** :
1. L'admin accède au module "Inscriptions"
2. Clique sur "Nouvelle Inscription"
3. Sélectionne l'étudiant (ou en crée un nouveau)
4. Sélectionne la formation
5. Sélectionne la session
6. Ajoute des remarques (optionnel)
7. Valide le formulaire
8. Le système :
   - Vérifie les places disponibles
   - Vérifie l'absence de doublon
   - Crée l'inscription (statut : En attente)
   - Crée un paiement associé (statut : En attente)
9. Confirmation affichée

**Scénario Alternatif 1 : Pas de places disponibles**
- 8a. Le système affiche "Session complète"
- 8b. Proposer une autre session

**Scénario Alternatif 2 : Étudiant déjà inscrit**
- 8a. Le système affiche "Étudiant déjà inscrit à cette session"
- 8b. Retour au formulaire

---

### CU-02 : Valider un Paiement

**Acteur** : Administrateur

**Préconditions** :
- Une inscription existe avec statut "En attente"
- Le paiement a été reçu physiquement

**Scénario Principal** :
1. L'admin accède à "Inscriptions"
2. Filtre par statut "En attente"
3. Sélectionne l'inscription
4. Clique sur "Valider Paiement"
5. Remplit le formulaire :
   - Montant reçu
   - Mode de paiement
   - Date de paiement
   - Référence (si applicable)
6. Valide
7. Le système :
   - Enregistre le paiement
   - Met à jour le statut : En attente → Payé
   - Met à jour les KPI du dashboard
8. Confirmation affichée

---

### CU-03 : Planifier une Nouvelle Session

**Acteur** : Administrateur

**Préconditions** :
- La formation existe
- Un formateur est disponible

**Scénario Principal** :
1. L'admin accède à "Sessions"
2. Clique sur "Nouvelle Session"
3. Sélectionne la formation
4. Sélectionne le formateur
5. Définit les dates (début, fin)
6. Définit la capacité
7. Indique le lieu
8. Valide
9. Le système :
   - Vérifie la disponibilité du formateur
   - Vérifie la disponibilité de la salle
   - Crée la session
10. Confirmation affichée

**Scénario Alternatif : Conflit de planning**
- 9a. Le système détecte un conflit
- 9b. Affiche "Formateur indisponible à ces dates"
- 9c. Propose d'autres formateurs ou dates

---

## Règles Métier

### Étudiants
- ✅ Âge minimum : 16 ans
- ✅ Email unique dans le système
- ✅ Téléphone obligatoire
- ✅ Un étudiant ne peut pas s'inscrire deux fois à la même session

### Formateurs
- ✅ Email unique
- ✅ Au moins une spécialité requise
- ✅ Pas de conflit de planning (deux sessions en même temps)

### Formations
- ✅ Titre unique
- ✅ Prix > 0 €
- ✅ Durée > 0 heures
- ✅ Impossible de supprimer si sessions actives

### Sessions
- ✅ Date de fin > Date de début
- ✅ Capacité >= Nombre d'inscrits
- ✅ Formateur disponible aux dates choisies
- ✅ Salle disponible aux dates choisies

### Inscriptions
- ✅ Places disponibles dans la session
- ✅ Pas de doublon (étudiant + session)
- ✅ Montant du paiement >= Prix de la formation

### Paiements
- ✅ Date de paiement <= Date du jour
- ✅ Montant > 0
- ✅ Une fois validé, un paiement ne peut être modifié (créer un avoir) - V2+

---

## Interface Utilisateur

### Design System

- **Bibliothèque UI** : Material-UI (MUI) ou Ant Design
- **Thème** : Moderne, professionnel, épuré
- **Couleurs** :
  - Primaire : Bleu (#1976D2)
  - Secondaire : Vert (#4CAF50)
  - Erreur : Rouge (#F44336)
  - Avertissement : Orange (#FF9800)
  - Info : Bleu clair (#2196F3)

### Composants Standards

- **Tables** : Pagination, tri, recherche, filtres
- **Formulaires** : Validation en temps réel, messages d'erreur clairs
- **Modales** : Confirmations, détails rapides
- **Notifications** : Succès, erreur, avertissement (Toasts)
- **Loaders** : Indicateurs de chargement

### Responsive Design

- ✅ Desktop (1920x1080)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ⚠️ Mobile (375x667) : Lecture seule en V1, édition en V2+

---

## Roadmap V2+

### Version 2 (V2) - Paiement en ligne
- 💳 Intégration Stripe / PayPal
- 📧 Notifications email automatiques
- 📄 Génération de factures PDF
- 🔄 Gestion des remboursements

### Version 3 (V3) - Portail Étudiant (LMS)
- 🎓 Espace étudiant dédié
- 📚 Ressources pédagogiques (PDF, vidéos)
- 📊 Suivi de progression
- 💬 Messagerie interne
- 📅 Calendrier personnel

### Version 4 (V4) - Évaluations et Certifications
- ✅ Quiz et examens en ligne
- 📊 Notation automatisée
- 🏆 Génération de certificats
- 📈 Rapports de performance

### Version 5+ (V5+) - IA et Analytics
- 🤖 Recommandations personnalisées (IA)
- 📊 Analyses prédictives (taux d'abandon, etc.)
- 🎯 Parcours d'apprentissage adaptatifs
- 📱 Application mobile native (iOS/Android)

---

**Document vivant** | **Version 1.0.0** | **Dernière mise à jour : Novembre 2025**
