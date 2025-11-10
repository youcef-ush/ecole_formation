# 📊 PROJECT PLAN - Système de Gestion Scolaire INSPIRED ACADEMY

## 🎯 ÉTAT DES MODULES ACTUELS

### ✅ MODULES COMPLETS (100%)

| Module | Backend | Frontend | Base de Données | Tests | Statut |
|--------|---------|----------|-----------------|-------|---------|
| **1. Authentification** | ✅ auth.routes.ts | ✅ Login.tsx | ✅ users table | ✅ | **COMPLET** |
| **2. Formations (Courses)** | ✅ courses.routes.ts | ✅ Courses.tsx | ✅ courses table | ✅ | **COMPLET** |
| **3. Salles** | ✅ rooms.routes.ts | ✅ Rooms.tsx | ✅ rooms table | ✅ | **COMPLET** |
| **4. Créneaux Horaires** | ✅ timeslots.routes.ts | ✅ TimeSlots.tsx | ✅ time_slots table | ✅ | **COMPLET** |
| **5. Formateurs** | ✅ trainers.routes.ts | ✅ Trainers.tsx | ✅ trainers table | ✅ | **COMPLET** |
| **6. Sessions** | ✅ sessions.routes.ts | ✅ Sessions.tsx | ✅ sessions table (avec enrolledCount) | ✅ | **COMPLET** |

### 🟡 MODULES PARTIELLEMENT COMPLETS (60-90%)

| Module | Backend | Frontend | Base de Données | Tests | Statut | Ce qui manque |
|--------|---------|----------|-----------------|-------|---------|---------------|
| **7. Inscriptions** | ✅ registrations.routes.ts | ✅ Registrations.tsx | ✅ registrations table | ⚠️ | **90%** | Génération badge QR backend |
| **8. Étudiants** | ✅ students.routes.ts | ✅ Students.tsx + StudentDetail.tsx | ⚠️ students table (manque champs QR) | ⚠️ | **85%** | Champs QR backend, badge expiry |
| **9. Affectations (Enrollments)** | ✅ enrollments.routes.ts | ⚠️ Enrollments.tsx | ✅ enrollments table | ⚠️ | **85%** | Page frontend à nettoyer |
| **10. Échéanciers de Paiement** | ✅ payment-schedules.routes.ts | ✅ PaymentSchedules.tsx | ✅ payment_schedules table | ✅ | **95%** | Auto-génération lors validation inscription |
| **11. Paiements** | ✅ payments.routes.ts | ✅ Finance.tsx, FinanceNew.tsx | ✅ payment_transactions table | ⚠️ | **80%** | Nettoyage pages doublons |
| **12. Retards de Paiement** | ✅ Dans payment-schedules | ✅ OverduePayments.tsx | ✅ | ⚠️ | **90%** | Tests complets |
| **13. Dashboard** | ✅ dashboard.routes.ts | ✅ Dashboard.tsx | N/A | ⚠️ | **70%** | Widgets présences manquants |

### ❌ MODULES À CRÉER (0%)

| Module | Backend | Frontend | Base de Données | Documentation | Priorité |
|--------|---------|----------|-----------------|---------------|----------|
| **14. Système QR Code** | ❌ Aucun | ❌ QR frontend seulement | ❌ Champs manquants | ❌ | **HAUTE** |
| **15. Gestion des Présences** | ❌ Aucun | ❌ Aucun | ❌ attendance table | ❌ | **HAUTE** |
| **16. Scan QR Présences** | ❌ Aucun | ❌ Aucun | ❌ | ❌ | **HAUTE** |
| **17. Rapports Présences** | ❌ Aucun | ❌ Aucun | ❌ attendance_reports table | ❌ | **MOYENNE** |

---

## 📋 PLAN PROJET - FORMAT EXCEL

### COPIER/COLLER DANS EXCEL (Séparateurs TAB)

```
ID	Module	Sous-Module	Tâche	Type	Composant	Fichier	Dépendances	Durée (h)	Priorité	Statut	Notes
1	QR Code & Présences	1. Base de Données	Modifier Student.entity.ts - Ajouter champs QR	Backend	Entity	backend/src/entities/Student.entity.ts	Aucune	0.5	HAUTE	À faire	Ajouter: badgeQrCode, badgeExpiry, isActive, emergencyContact, schoolLevel
2	QR Code & Présences	1. Base de Données	Modifier Session.entity.ts - Ajouter champs QR	Backend	Entity	backend/src/entities/Session.entity.ts	Aucune	0.5	HAUTE	À faire	Ajouter: sessionQrCode, qrExpiresAt, currentAttendance, isActive
3	QR Code & Présences	1. Base de Données	Créer Attendance.entity.ts	Backend	Entity	backend/src/entities/Attendance.entity.ts	Tâche 1, 2	1	HAUTE	À faire	Enums: ScanMethod, AttendanceStatus. Relations: Student, Session, User
4	QR Code & Présences	1. Base de Données	Créer AttendanceReport.entity.ts	Backend	Entity	backend/src/entities/AttendanceReport.entity.ts	Tâche 3	0.5	MOYENNE	À faire	Stats mensuelles: totalSessions, presentCount, absentCount, lateCount, attendanceRate
5	QR Code & Présences	1. Base de Données	Migration: add_qr_fields_to_students.sql	Backend	Migration	backend/migrations/add_qr_fields_to_students.sql	Tâche 1	0.5	HAUTE	À faire	ALTER TABLE students + UPDATE existants
6	QR Code & Présences	1. Base de Données	Migration: add_qr_fields_to_sessions.sql	Backend	Migration	backend/migrations/add_qr_fields_to_sessions.sql	Tâche 2	0.5	HAUTE	À faire	ALTER TABLE sessions
7	QR Code & Présences	1. Base de Données	Migration: create_attendances_table.sql	Backend	Migration	backend/migrations/create_attendances_table.sql	Tâche 3	0.5	HAUTE	À faire	CREATE TABLE + index performances
8	QR Code & Présences	1. Base de Données	Migration: create_attendance_reports_table.sql	Backend	Migration	backend/migrations/create_attendance_reports_table.sql	Tâche 4	0.5	MOYENNE	À faire	CREATE TABLE + contrainte unique (student, course, month, year)
9	QR Code & Présences	1. Base de Données	Exécuter toutes les migrations	Backend	Database	PostgreSQL	Tâche 5,6,7,8	0.5	HAUTE	À faire	Vérifier pas d'erreurs, backup BD avant
10	QR Code & Présences	1. Base de Données	Mettre à jour database.config.ts	Backend	Config	backend/src/config/database.config.ts	Tâche 3,4	0.25	HAUTE	À faire	Ajouter nouvelles entités dans entities array
11	QR Code & Présences	2. Services Backend	Installer package qrcode	Backend	Package	package.json	Aucune	0.1	HAUTE	À faire	npm install qrcode @types/qrcode
12	QR Code & Présences	2. Services Backend	Créer QrCodeService	Backend	Service	backend/src/services/qrcode.service.ts	Tâche 9,10,11	2	HAUTE	À faire	4 méthodes: generateStudentBadge, generateSessionQr, validateStudentQr, validateSessionQr
13	QR Code & Présences	2. Services Backend	Créer AccessControlService	Backend	Service	backend/src/services/access-control.service.ts	Tâche 9,10	1.5	HAUTE	À faire	3 méthodes: checkStudentAccess, validatePaymentStatus, logAccessAttempt. Blocage après 15 jours
14	QR Code & Présences	2. Services Backend	Créer AttendanceService	Backend	Service	backend/src/services/attendance.service.ts	Tâche 9,10	2	HAUTE	À faire	5 méthodes: recordAttendance, recordManualAttendance, generateDailyReport, checkRepeatedAbsences, updateMonthlyReport
15	QR Code & Présences	3. API Routes	Créer attendance.routes.ts	Backend	Route	backend/src/routes/attendance.routes.ts	Tâche 12,13,14	2	HAUTE	À faire	4 endpoints: POST /validate-scan, POST /manual, GET /sessions/:id/attendance, POST /sessions/:id/generate-qr
16	QR Code & Présences	3. API Routes	Modifier students.routes.ts - Endpoints badges	Backend	Route	backend/src/routes/students.routes.ts	Tâche 12	1	HAUTE	À faire	3 endpoints: POST /:id/generate-badge, PUT /:id/revoke-badge, GET /validate-badge/:qrCode
17	QR Code & Présences	3. API Routes	Modifier registrations.routes.ts - Génération badge auto	Backend	Route	backend/src/routes/registrations.routes.ts	Tâche 12	1	HAUTE	À faire	Dans POST /validate: appeler generateStudentBadge après création Student
18	QR Code & Présences	3. API Routes	Mettre à jour app.ts	Backend	Config	backend/src/app.ts	Tâche 15	0.25	HAUTE	À faire	Import et use attendance.routes
19	QR Code & Présences	4. Frontend - Scanner	Installer package html5-qrcode	Frontend	Package	package.json	Aucune	0.1	HAUTE	À faire	npm install html5-qrcode
20	QR Code & Présences	4. Frontend - Scanner	Créer QRScanner.tsx	Frontend	Page	frontend/src/pages/QRScanner.tsx	Tâche 19	3	HAUTE	À faire	2 étapes: scan session puis étudiants. Feedback visuel/sonore (vert/rouge/orange)
21	QR Code & Présences	4. Frontend - Scanner	Ajouter sons feedback (beep)	Frontend	Assets	frontend/public/sounds/	Aucune	0.25	HAUTE	À faire	beep-success.mp3, beep-error.mp3
22	QR Code & Présences	4. Frontend - Scanner	Ajouter route QR Scanner	Frontend	Config	frontend/src/App.tsx	Tâche 20	0.1	HAUTE	À faire	<Route path="/qr-scanner" element={<QRScanner />} />
23	QR Code & Présences	4. Frontend - Scanner	Ajouter menu QR Scanner	Frontend	Component	frontend/src/components/Layout/Layout.tsx	Tâche 20	0.1	HAUTE	À faire	MenuItem "Scanner Présences" avec icône QrCodeScanner
24	QR Code & Présences	5. Frontend - Gestion	Créer AttendanceManagement.tsx	Frontend	Page	frontend/src/pages/AttendanceManagement.tsx	Tâche 15	2.5	MOYENNE	À faire	Liste présences par session, marquer présence manuelle, stats session
25	QR Code & Présences	5. Frontend - Gestion	Ajouter route Attendance Management	Frontend	Config	frontend/src/App.tsx	Tâche 24	0.1	MOYENNE	À faire	<Route path="/attendances" element={<AttendanceManagement />} />
26	QR Code & Présences	5. Frontend - Gestion	Ajouter menu Attendance Management	Frontend	Component	frontend/src/components/Layout/Layout.tsx	Tâche 24	0.1	MOYENNE	À faire	MenuItem "Gestion Présences"
27	QR Code & Présences	5. Frontend - Gestion	Modifier StudentDetail.tsx - Badge backend	Frontend	Page	frontend/src/pages/StudentDetail.tsx	Tâche 16	1	HAUTE	À faire	Afficher student.badgeQrCode depuis BD. Bouton "Renouveler badge" → API
28	QR Code & Présences	6. Dashboard Stats	Widget Taux Présence Global	Frontend	Component	frontend/src/pages/Dashboard.tsx	Tâche 14	1	MOYENNE	À faire	Card avec pourcentage présence tous étudiants
29	QR Code & Présences	6. Dashboard Stats	Widget Alertes Absences Répétées	Frontend	Component	frontend/src/pages/Dashboard.tsx	Tâche 14	1	MOYENNE	À faire	Liste top 5 étudiants absences répétées (3+)
30	QR Code & Présences	6. Dashboard Stats	Endpoint dashboard stats	Backend	Route	backend/src/routes/dashboard.routes.ts	Tâche 14	1	MOYENNE	À faire	GET /api/dashboard/attendance-stats
31	QR Code & Présences	7. Tests & Validation	Test: Génération badge lors inscription	Test	Backend	Postman/Thunder	Tâche 17	0.5	HAUTE	À faire	POST /registrations/:id/validate → vérifier student.badgeQrCode créé
32	QR Code & Présences	7. Tests & Validation	Test: Validation QR étudiant	Test	Backend	Postman/Thunder	Tâche 16	0.5	HAUTE	À faire	GET /students/validate-badge/:qrCode
33	QR Code & Présences	7. Tests & Validation	Test: Génération QR session	Test	Backend	Postman/Thunder	Tâche 15	0.5	HAUTE	À faire	POST /sessions/:id/generate-qr
34	QR Code & Présences	7. Tests & Validation	Test: Scan QR complet (succès)	Test	Frontend	Navigation	Tâche 20	0.5	HAUTE	À faire	Scanner QR session + QR étudiant valide → présence enregistrée
35	QR Code & Présences	7. Tests & Validation	Test: Blocage paiement retard 15j	Test	Integration	BD + API	Tâche 13	0.5	HAUTE	À faire	Créer échéance 16j retard → scan QR → vérifier blocage orange
36	QR Code & Présences	7. Tests & Validation	Test: Présence manuelle (admin)	Test	Backend	Postman/Thunder	Tâche 15	0.25	HAUTE	À faire	POST /attendance/manual
37	QR Code & Présences	7. Tests & Validation	Test: Badge expiré	Test	Integration	BD + Frontend	Tâche 12	0.5	HAUTE	À faire	Modifier badgeExpiry à date passée → scan → vérifier erreur
38	QR Code & Présences	7. Tests & Validation	Test: Session QR expiré	Test	Integration	BD + Frontend	Tâche 12	0.5	HAUTE	À faire	Modifier qrExpiresAt à date passée → scan → vérifier erreur
39	QR Code & Présences	7. Tests & Validation	Test: Étudiant non inscrit session	Test	Integration	BD + Frontend	Tâche 13	0.5	HAUTE	À faire	Scanner QR étudiant pour session non inscrite → vérifier refus
40	QR Code & Présences	7. Tests & Validation	Test: Rapport quotidien présences	Test	Backend	Postman/Thunder	Tâche 14,15	0.5	MOYENNE	À faire	GET /sessions/:id/attendance?date=2025-11-10
41	QR Code & Présences	7. Tests & Validation	Test: Stats mensuelles auto-générées	Test	Backend	BD	Tâche 14	0.5	MOYENNE	À faire	Enregistrer plusieurs présences → vérifier attendance_reports mis à jour
42	QR Code & Présences	8. Documentation	Documenter API attendance	Doc	Markdown	backend/ATTENDANCE_API.md	Tâche 15	0.5	MOYENNE	À faire	Tous endpoints, exemples requêtes/réponses, codes erreur
43	QR Code & Présences	8. Documentation	Documenter workflow scan QR	Doc	Markdown	WORKFLOW_QR_SCAN.md	Tâche 20	0.5	MOYENNE	À faire	Diagrammes, étapes, gestion erreurs
44	QR Code & Présences	8. Documentation	Guide utilisateur Scanner QR	Doc	Markdown	USER_GUIDE_QR.md	Tâche 20	0.5	BASSE	À faire	Screenshots, instructions pour admins
45	QR Code & Présences	8. Documentation	Mettre à jour REFACTORING_PLAN.md	Doc	Markdown	REFACTORING_PLAN.md	Toutes	0.25	BASSE	À faire	Marquer tâches complétées
```

---

## 📊 RÉSUMÉ PAR PHASE

### PHASE 1 : BASE DE DONNÉES (Durée: 4h - Priorité: HAUTE)
- **Tâches :** 1-10
- **Livrables :** 
  - 2 entités modifiées (Student, Session)
  - 2 nouvelles entités (Attendance, AttendanceReport)
  - 4 migrations SQL exécutées
  - Configuration mise à jour
- **Tests de validation :**
  - Migration sans erreur
  - Nouvelles tables créées
  - Champs ajoutés correctement

### PHASE 2 : SERVICES BACKEND (Durée: 6h - Priorité: HAUTE)
- **Tâches :** 11-14
- **Livrables :**
  - QrCodeService complet (4 méthodes)
  - AccessControlService complet (3 méthodes)
  - AttendanceService complet (5 méthodes)
  - Package qrcode installé
- **Tests de validation :**
  - Génération QR code fonctionne
  - Validation QR fonctionne
  - Blocage paiement 15j fonctionne

### PHASE 3 : API ROUTES (Durée: 4.5h - Priorité: HAUTE)
- **Tâches :** 15-18
- **Livrables :**
  - attendance.routes.ts (4 endpoints)
  - students.routes.ts modifié (3 endpoints badges)
  - registrations.routes.ts modifié (génération badge auto)
  - app.ts mis à jour
- **Tests de validation :**
  - Tous endpoints testés Postman
  - Badge généré lors validation inscription
  - Scan QR backend fonctionne

### PHASE 4 : FRONTEND SCANNER (Durée: 3.5h - Priorité: HAUTE)
- **Tâches :** 19-23
- **Livrables :**
  - QRScanner.tsx complet
  - Sons feedback ajoutés
  - Routes et menu mis à jour
  - Package html5-qrcode installé
- **Tests de validation :**
  - Scan QR session fonctionne
  - Scan QR étudiant fonctionne
  - Feedback visuel/sonore OK
  - Gestion erreurs OK

### PHASE 5 : FRONTEND GESTION (Durée: 3.8h - Priorité: MOYENNE)
- **Tâches :** 24-27
- **Livrables :**
  - AttendanceManagement.tsx
  - StudentDetail.tsx mis à jour
  - Routes et menu mis à jour
- **Tests de validation :**
  - Consultation présences fonctionne
  - Présence manuelle fonctionne
  - Badge étudiant affiché depuis BD

### PHASE 6 : DASHBOARD STATS (Durée: 3h - Priorité: MOYENNE)
- **Tâches :** 28-30
- **Livrables :**
  - Widgets Dashboard
  - Endpoint stats backend
- **Tests de validation :**
  - Stats taux présence OK
  - Alertes absences répétées OK

### PHASE 7 : TESTS & VALIDATION (Durée: 5.25h - Priorité: HAUTE)
- **Tâches :** 31-41
- **Livrables :**
  - Suite tests complète
  - Tous scénarios validés
  - Bug fixes si nécessaire
- **Tests de validation :**
  - Tous tests passent ✅

### PHASE 8 : DOCUMENTATION (Durée: 1.75h - Priorité: MOYENNE/BASSE)
- **Tâches :** 42-45
- **Livrables :**
  - Documentation API
  - Guide utilisateur
  - Workflow documenté
- **Tests de validation :**
  - Documentation complète et claire

---

## ⏱️ PLANNING ESTIMATIF

| Phase | Durée | Dépendances | Sprint recommandé |
|-------|-------|-------------|-------------------|
| Phase 1 | 4h | Aucune | Sprint 1 - Jour 1 |
| Phase 2 | 6h | Phase 1 | Sprint 1 - Jour 2-3 |
| Phase 3 | 4.5h | Phase 2 | Sprint 1 - Jour 3-4 |
| Phase 4 | 3.5h | Phase 3 | Sprint 2 - Jour 5 |
| Phase 5 | 3.8h | Phase 4 | Sprint 2 - Jour 6 |
| Phase 6 | 3h | Phase 5 | Sprint 2 - Jour 7 |
| Phase 7 | 5.25h | Toutes | Sprint 3 - Jour 8-9 |
| Phase 8 | 1.75h | Phase 7 | Sprint 3 - Jour 10 |

**DURÉE TOTALE : 31.8 heures (≈ 4 jours à temps plein ou 2 semaines à mi-temps)**

---

## 🎯 CRITÈRES DE SUCCÈS

### MODULE QR CODE & PRÉSENCES - 100% COMPLET SI :

✅ **Backend :**
- [ ] Toutes entités créées et migrations exécutées
- [ ] Services QR Code, Access Control, Attendance fonctionnels
- [ ] Routes API attendance complètes et testées
- [ ] Génération badge automatique lors validation inscription
- [ ] Blocage paiement après 15 jours fonctionne

✅ **Frontend :**
- [ ] Page QR Scanner opérationnelle (scan session + étudiant)
- [ ] Feedback visuel/sonore implémenté (vert/rouge/orange)
- [ ] Page Attendance Management créée
- [ ] StudentDetail affiche badge depuis BD
- [ ] Dashboard avec widgets présences

✅ **Tests :**
- [ ] Tous scénarios testés (succès, échecs, cas limites)
- [ ] Performance OK (scan < 2 secondes)
- [ ] Pas de bugs critiques

✅ **Documentation :**
- [ ] API documentée
- [ ] Guide utilisateur créé
- [ ] Workflow QR documenté

---

## 📝 NOTES IMPORTANTES

### Décisions Validées :
1. ✅ **Approche :** Module par module, finaliser avant de passer au suivant
2. ✅ **QR Code :** Implémentation backend (pas frontend seulement)
3. ✅ **Badge actuel :** En cours d'impression, sera migré vers backend
4. ✅ **Blocage paiement :** 15 jours de retard (pas 7)
5. ✅ **Absences :** Auto si pas de scan + possibilité entrée manuelle
6. ✅ **Justifications :** PAS implémenté (pas nécessaire)
7. ✅ **Scan :** Scanner QR dédié + téléphone via navigateur
8. ✅ **Expiration badge :** 1 an (par défaut)

### Modules Déjà Complets (ne pas toucher) :
- ✅ Authentification
- ✅ Formations
- ✅ Salles
- ✅ Créneaux horaires
- ✅ Formateurs
- ✅ Sessions

### Modules Partiels à Finaliser Plus Tard :
- 🟡 Inscriptions (90%) - Ajouter génération badge backend
- 🟡 Étudiants (85%) - Migrer QR vers backend
- 🟡 Échéanciers (95%) - Auto-génération lors validation
- 🟡 Dashboard (70%) - Ajouter widgets présences

---

## 🚀 PROCHAINE ÉTAPE

**APRÈS VALIDATION DE CE PLAN :**

1. Copier le tableau dans Excel
2. Créer colonnes : ID | Module | Sous-Module | Tâche | Type | Composant | Fichier | Dépendances | Durée | Priorité | Statut | Notes
3. Commencer Phase 1 - Tâche 1 : Modifier Student.entity.ts

**JE N'AI PAS ENCORE COMMENCÉ LE CODE - EN ATTENTE DE VOTRE VALIDATION** ✋

---

Voulez-vous que je modifie quelque chose dans ce plan avant de le mettre dans Excel ?
