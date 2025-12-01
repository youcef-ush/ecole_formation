# 🔄 Guide de Réinitialisation de la Base de Données

## ⚠️ ATTENTION

**Ce processus supprime TOUTES les données de la base de données !**

Utilisez uniquement pour :
- Tests et développement
- Correction de problèmes de migration
- Démarrage d'un environnement propre

## 🚀 Méthode Rapide (PowerShell)

```powershell
.\reset-database.ps1
```

Le script vous demandera confirmation avant de procéder. Tapez `OUI` en majuscules pour confirmer.

## 🔧 Méthode Manuelle (PostgreSQL)

### Option 1: Via psql

```bash
psql -h localhost -p 5432 -U postgres -d ecole_formation -f backend/migrations/reset_database.sql
```

### Option 2: Via pgAdmin

1. Ouvrir pgAdmin
2. Connecter à la base `ecole_formation`
3. Ouvrir Query Tool
4. Copier/coller le contenu de `backend/migrations/reset_database.sql`
5. Exécuter (F5)

## 📋 Ce que fait le script

1. **Désactive les contraintes** de clés étrangères temporairement
2. **Supprime toutes les tables** dans l'ordre inverse des dépendances :
   - attendance_reports
   - attendances
   - installment_payments
   - payment_schedules
   - payment_transactions
   - session_payments
   - payments
   - enrollments
   - sessions
   - tutoring_sessions
   - registrations
   - students
   - time_slots
   - rooms
   - courses
   - trainers
   - users

3. **Recrée les types ENUM** :
   - user_role
   - course_type
   - course_category
   - enrollment_status
   - payment_status
   - registration_status
   - scan_method
   - attendance_status

4. **Recrée toutes les tables** avec leur structure complète

5. **Crée les index** pour les performances :
   - Index sur les clés étrangères
   - Index sur les dates
   - Index sur les statuts

6. **Réactive les contraintes**

## 🔄 Workflow Complet après Réinitialisation

### 1. Réinitialiser la base de données

```powershell
.\reset-database.ps1
```

### 2. Créer l'utilisateur admin

```bash
cd backend
npm run seed:admin
```

Cela crée :
- Email: `admin@inspiredacademy.com`
- Password: `admin123`
- Role: `admin`

### 3. (Optionnel) Insérer des données de test

```bash
npm run seed
```

Cela crée :
- 2 formateurs
- 3 formations (tutoring, qualifying_long, qualifying_short)
- 5 étudiants avec inscriptions
- Sessions auto-générées
- Calendriers de paiement
- **Badges QR générés automatiquement** pour tous les étudiants

### 4. Démarrer le backend

```bash
npm run dev
```

### 5. Démarrer le frontend

```bash
cd ../frontend
npm run dev
```

## 🧪 Tests après Réinitialisation

### Test 1: Connexion Admin
1. Aller sur http://localhost:5173
2. Se connecter avec `admin@inspiredacademy.com` / `admin123`
3. Vérifier accès au dashboard

### Test 2: Badges Étudiants (Tâche 31)
1. Aller dans **Étudiants** → Sélectionner un étudiant
2. Vérifier que le badge QR est affiché
3. Vérifier la date d'expiration (doit être +12 mois)
4. Tester le bouton "Renouveler"
5. Tester le bouton "Révoquer"

### Test 3: Scanner QR (Tâche 34)
1. Aller dans **Scanner Présences**
2. Sélectionner une session dans le dropdown
3. Cliquer sur "Confirmer Session"
4. Scanner un badge étudiant (utiliser le badge affiché dans StudentDetail)
5. Vérifier que la présence est enregistrée

### Test 4: Gestion Présences (Tâche 40)
1. Aller dans **Gestion Présences**
2. Sélectionner une session
3. Sélectionner une date
4. Vérifier les statistiques affichées
5. Tester la présence manuelle

### Test 5: Dashboard Stats (Tâches 28-29)
1. Aller sur le **Dashboard**
2. Vérifier le widget "Taux Présence Global"
3. Vérifier le widget "Alertes Absences Répétées"
4. Vérifier que les données sont cohérentes

## 📊 Structure des Données Après Seed

```
Users: 1 admin + 2 trainers + 5 students = 8 users
Trainers: 2 formateurs
Courses: 3 formations (1 tutoring + 1 qualifying_long + 1 qualifying_short)
Students: 5 étudiants
Enrollments: 5 inscriptions
Sessions: ~15 sessions auto-générées
Payment Schedules: ~50 échéances
Badges: 5 badges QR (1 par étudiant, validité 12 mois)
```

## ❌ En cas de problème

### Erreur: "Cannot connect to database"
- Vérifier que PostgreSQL est démarré
- Vérifier les identifiants dans le script PowerShell

### Erreur: "Permission denied"
- Exécuter PowerShell en tant qu'administrateur
- Vérifier que psql est dans le PATH

### Erreur: "Database does not exist"
- Créer la base de données d'abord :
  ```sql
  CREATE DATABASE ecole_formation;
  ```

## 📝 Notes

- Les données de test sont cohérentes avec l'année scolaire en cours (Septembre-Juin)
- Les badges QR sont générés automatiquement à la validation des inscriptions
- Les sessions sont générées selon le type de formation :
  - **TUTORING**: 10 sessions (Septembre → Juin)
  - **QUALIFYING_LONG**: N sessions (selon durationMonths)
  - **QUALIFYING_SHORT**: 1-2 sessions

## 🔗 Fichiers Associés

- `backend/migrations/reset_database.sql` : Script SQL de réinitialisation
- `reset-database.ps1` : Script PowerShell d'exécution
- `backend/src/seed-admin.ts` : Création utilisateur admin
- `backend/src/seed-data.ts` : Création données de test
