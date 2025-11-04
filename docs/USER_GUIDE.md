# 📚 Guide Utilisateur - École de Formation V1

## Table des Matières

1. [Introduction](#introduction)
2. [Connexion](#connexion)
3. [Dashboard](#dashboard)
4. [Gestion des Étudiants](#gestion-des-étudiants)
5. [Gestion des Formateurs](#gestion-des-formateurs)
6. [Catalogue de Formations](#catalogue-de-formations)
7. [Sessions et Groupes](#sessions-et-groupes)
8. [Gestion des Inscriptions](#gestion-des-inscriptions)
9. [FAQ](#faq)

---

## Introduction

Bienvenue dans l'application **École de Formation V1** ! Ce guide vous accompagnera dans l'utilisation de toutes les fonctionnalités de l'application.

### Prérequis
- Accès internet
- Navigateur moderne (Chrome, Firefox, Edge, Safari)
- Identifiants administrateur

---

## Connexion

### Première Connexion

1. Accédez à l'URL de l'application : `https://votre-ecole.com`
2. Saisissez vos identifiants :
   - **Email** : votre.email@ecole.com
   - **Mot de passe** : (fourni par l'administrateur système)
3. Cliquez sur **Se connecter**

### Sécurité
- ✅ Changez votre mot de passe lors de la première connexion
- ✅ Utilisez un mot de passe fort (12+ caractères, majuscules, chiffres, symboles)
- ✅ Ne partagez jamais vos identifiants

---

## Dashboard

### Vue d'ensemble

Le **Dashboard** est votre point d'entrée principal. Il affiche :

#### Indicateurs Clés (KPI)
- 👥 **Nombre d'étudiants** : Total des étudiants enregistrés
- 📚 **Formations actives** : Formations disponibles
- 📝 **Inscriptions en cours** : Inscriptions actives
- 💰 **Revenus totaux** : Paiements validés

#### Graphiques
- 📈 Évolution des inscriptions
- 📊 Taux de remplissage des sessions
- 💵 Revenus mensuels

---

## Gestion des Étudiants

### Ajouter un Étudiant

1. Cliquez sur **Étudiants** dans le menu
2. Cliquez sur **+ Nouvel Étudiant**
3. Remplissez le formulaire :
   - **Informations personnelles** : Nom, Prénom, Date de naissance
   - **Contact** : Email, Téléphone
   - **Adresse** : Adresse complète
4. Cliquez sur **Enregistrer**

### Modifier un Étudiant

1. Recherchez l'étudiant (par nom, email)
2. Cliquez sur l'icône **✏️ Modifier**
3. Modifiez les informations
4. Cliquez sur **Enregistrer**

### Consulter l'Historique

1. Cliquez sur l'étudiant
2. Onglet **Historique**
   - Inscriptions passées
   - Paiements effectués
   - Formations suivies

---

## Gestion des Formateurs

### Ajouter un Formateur

1. Menu **Formateurs** → **+ Nouveau Formateur**
2. Remplissez :
   - **Identité** : Nom, Prénom
   - **Spécialités** : Domaines d'expertise
   - **Contact** : Email, Téléphone
   - **Disponibilités** : Jours et horaires
3. **Enregistrer**

### Assigner un Formateur à une Session

1. Allez dans **Sessions**
2. Sélectionnez la session
3. Champ **Formateur** : Sélectionnez dans la liste
4. **Enregistrer**

---

## Catalogue de Formations

### Créer une Formation

1. Menu **Formations** → **+ Nouvelle Formation**
2. Remplissez :
   - **Titre** : Nom de la formation
   - **Description** : Détails complets
   - **Catégorie** : Soutien scolaire / Formation professionnelle
   - **Durée** : Nombre d'heures
   - **Prix** : Tarif en euros
   - **Prérequis** : (optionnel)
3. **Enregistrer**

### Modifier une Formation

1. Liste des formations
2. Cliquez sur **✏️ Modifier**
3. Modifiez les champs
4. **Enregistrer**

### Archiver une Formation

1. Sélectionnez la formation
2. Menu **Actions** → **Archiver**
3. Confirmer

---

## Sessions et Groupes

### Créer une Session

1. Menu **Sessions** → **+ Nouvelle Session**
2. Remplissez :
   - **Formation** : Sélectionnez dans le catalogue
   - **Date de début** : JJ/MM/AAAA
   - **Date de fin** : JJ/MM/AAAA
   - **Formateur** : Sélectionnez
   - **Capacité** : Nombre de places
   - **Lieu** : Salle ou lieu
3. **Enregistrer**

### Consulter le Calendrier

1. Menu **Calendrier**
2. Vue : Jour / Semaine / Mois
3. Filtres : Par formateur, formation, salle

---

## Gestion des Inscriptions

### Inscrire un Étudiant

1. Menu **Inscriptions** → **+ Nouvelle Inscription**
2. Remplissez :
   - **Étudiant** : Sélectionnez ou créez
   - **Session** : Choisissez la session
   - **Statut** : En attente (par défaut)
3. **Enregistrer**

### Valider un Paiement

1. Liste des **Inscriptions**
2. Filtrer par **Statut : En attente**
3. Sélectionnez l'inscription
4. Cliquez sur **💰 Valider Paiement**
5. Saisissez :
   - **Montant reçu**
   - **Mode de paiement** : Espèces / Chèque / Virement
   - **Date de paiement**
   - **Notes** (optionnel)
6. **Confirmer**

### Annuler une Inscription

1. Sélectionnez l'inscription
2. Menu **Actions** → **Annuler**
3. Raison de l'annulation (optionnel)
4. **Confirmer**

### Statuts des Inscriptions

| Statut | Signification | Actions possibles |
|--------|---------------|-------------------|
| 🟡 **En attente** | Inscription créée, paiement non reçu | Valider paiement / Annuler |
| 🟢 **Payé** | Paiement confirmé, inscription active | Annuler (avec remboursement) |
| 🔴 **Annulé** | Inscription annulée | Aucune |

---

## FAQ

### Questions Fréquentes

**Q : Comment récupérer mon mot de passe ?**  
R : Cliquez sur "Mot de passe oublié" sur la page de connexion et suivez les instructions par email.

**Q : Puis-je modifier une inscription après validation du paiement ?**  
R : Oui, mais vous devrez annuler et recréer l'inscription pour un changement de session.

**Q : Combien d'étudiants puis-je enregistrer ?**  
R : Aucune limite dans la V1.

**Q : Les données sont-elles sauvegardées automatiquement ?**  
R : Oui, toutes les modifications sont enregistrées en temps réel.

**Q : Puis-je exporter les données ?**  
R : Oui, utilisez les boutons **Exporter** dans chaque module (CSV, Excel).

### Support Technique

- 📧 **Email** : support@ecole-formation.com
- 📞 **Téléphone** : +33 X XX XX XX XX
- 💬 **Chat en ligne** : Disponible dans l'application (V2+)

---

**Dernière mise à jour : Novembre 2025** | **Version : 1.0.0**
