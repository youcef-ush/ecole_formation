# 🎓 Système de Gestion Scolaire - Modélisation UML

## 📊 Diagramme de Classes

```mermaid
classDiagram
    %% ========== ENTITÉS PRINCIPALES ==========
    
    class User {
        <<Abstract>>
        +id: number
        +firstName: string
        +lastName: string
        +email: string
        +phone: string
        +createdAt: Date
        +updatedAt: Date
    }

    class Student {
        +dateOfBirth: Date
        +address: string
        +emergencyContact: string
        +schoolLevel: string
        +notes: string
    }

    class Teacher {
        +specialization: string
        +hourlyRate: number
        +availability: string
        +experience: string
    }

    class Admin {
        +role: string
        +permissions: string[]
    }

    %% ========== GESTION DES FORMATIONS ==========

    class Course {
        +id: number
        +title: string
        +description: string
        +category: string
        +durationMonths: number
        +price: number
        +pricePerMonth: number
        +prerequisites: string
        +maxStudents: number
        +isActive: boolean
    }

    class Session {
        +id: number
        +name: string
        +startDate: Date
        +endDate: Date
        +schedule: string
        +classroom: string
        +maxCapacity: number
    }

    %% ========== INSCRIPTIONS ET AFFECTATIONS ==========

    class Registration {
        +id: number
        +registrationDate: Date
        +status: RegistrationStatus
        +registrationFee: number
        +notes: string
    }

    class Enrollment {
        +id: number
        +enrollmentDate: Date
        +status: EnrollmentStatus
        +finalGrade: number
    }

    %% ========== GESTION FINANCIÈRE ==========

    class PaymentSchedule {
        +id: number
        +installmentNumber: number
        +amount: number
        +dueDate: Date
        +status: PaymentStatus
        +paidAmount: number
        +paidDate: Date
        +paymentMethod: string
        +notes: string
    }

    class PaymentTransaction {
        +id: number
        +amount: number
        +paymentMethod: string
        +paymentDate: Date
        +reference: string
        +receivedBy: string
        +notes: string
    }

    %% ========== SUIVI DES PRÉSENCES ==========

    class Attendance {
        +id: number
        +date: Date
        +status: AttendanceStatus
        +notes: string
    }

    %% ========== RELATIONS ==========

    User <|-- Student
    User <|-- Teacher
    User <|-- Admin

    Student "1" -- "*" Registration : "a"
    Registration "1" -- "1" Enrollment : "devient"
    
    Course "1" -- "*" Session : "contient"
    Enrollment "1" -- "*" Session : "assiste à"
    
    Teacher "1" -- "*" Session : "enseigne"
    
    Enrollment "1" -- "*" PaymentSchedule : "a"
    PaymentSchedule "1" -- "*" PaymentTransaction : "reçoit"
    
    Enrollment "1" -- "*" Attendance : "a"

    %% ========== ENUMÉRATIONS ==========

    class RegistrationStatus {
        <<Enumeration>>
        PENDING
        VALIDATED
        REJECTED
        CANCELLED
    }

    class EnrollmentStatus {
        <<Enumeration>>
        ACTIVE
        COMPLETED
        DROPPED_OUT
        SUSPENDED
    }

    class PaymentStatus {
        <<Enumeration>>
        PENDING
        PARTIALLY_PAID
        PAID
        OVERDUE
        CANCELLED
    }

    class AttendanceStatus {
        <<Enumeration>>
        PRESENT
        ABSENT
        LATE
        EXCUSED
    }
```

---

## 📋 Diagramme de Cas d'Utilisation

```mermaid
usecaseDiagram
    title 🎯 Cas d'Utilisation - Système de Gestion Scolaire

    %% ========== ACTEURS ==========
    
    actor Administrateur as "👨‍💼 Administrateur"
    actor Formateur as "👨‍🏫 Formateur" 
    actor Étudiant as "🎓 Étudiant"
    actor Parent as "👨‍👩‍👧‍👦 Parent"
    actor Système as "🤖 Système"

    %% ========== PAQUET DE GESTION ADMINISTRATIVE ==========
    
    package "Gestion Administrative" {
        usecase UC1 as "Gérer les étudiants"
        usecase UC2 as "Gérer les formateurs"
        usecase UC3 as "Gérer le catalogue de formations"
        usecase UC4 as "Valider les inscriptions"
        usecase UC5 as "Gérer les sessions de formation"
    }

    %% ========== PAQUET DE GESTION FINANCIÈRE ==========
    
    package "Gestion Financière" {
        usecase UC6 as "Générer les échéanciers"
        usecase UC7 as "Enregistrer les paiements"
        usecase UC8 as "Suivre les retards de paiement"
        usecase UC9 as "Générer les rapports financiers"
    }

    %% ========== PAQUET DE SUIVI PÉDAGOGIQUE ==========
    
    package "Suivi Pédagogique" {
        usecase UC10 as "Marquer les présences"
        usecase UC11 as "Saisir les notes"
        usecase UC12 as "Générer les bulletins"
        usecase UC13 as "Planifier les cours"
    }

    %% ========== PAQUET PORTAL ÉTUDIANT ==========
    
    package "Portal Étudiant" {
        usecase UC14 as "Consulter son emploi du temps"
        usecase UC15 as "Voir son échéancier"
        usecase UC16 as "Consulter ses notes"
        usecase UC17 as "Télécharger les ressources"
    }

    %% ========== ACTEURS PRINCIPAUX ==========

    Administrateur --> UC1
    Administrateur --> UC2  
    Administrateur --> UC3
    Administrateur --> UC4
    Administrateur --> UC5
    Administrateur --> UC6
    Administrateur --> UC7
    Administrateur --> UC8
    Administrateur --> UC9

    Formateur --> UC10
    Formateur --> UC11
    Formateur --> UC13

    Étudiant --> UC14
    Étudiant --> UC15
    Étudiant --> UC16
    Étudiant --> UC17

    %% ========== RELATIONS D'INCLUSION ==========

    UC6 .> UC7 : include
    UC11 .> UC12 : include
    
    %% ========== RELATIONS D'EXTENSION ==========
    
    UC8 .> UC9 : extend
    
    %% ========== SYSTÈME AUTOMATIQUE ==========
    
    Système --> UC18 as "Générer notifications automatiques"
    Système --> UC19 as "Mettre à jour statuts des paiements"
```

---

## 🔄 Diagramme de Séquence - Processus Complet

### Séquence 1: Inscription et Validation

```mermaid
sequenceDiagram
    title 🔄 Processus d'Inscription et Validation

    participant É as Étudiant
    participant F as Frontend
    participant B as Backend
    participant DB as Base de Données
    participant A as Administrateur

    Note over É,A: PHASE 1 - INSCRIPTION INITIALE
    
    É->>F: Remplit formulaire d'inscription
    F->>B: POST /api/registrations
    B->>DB: Créer registration (status: PENDING)
    DB-->>B: Registration créée
    B-->>F: Confirmation inscription
    F-->>É: Message "Inscription en attente de validation"

    Note over É,A: PHASE 2 - VALIDATION ADMINISTRATIVE
    
    A->>F: Consulte liste des inscriptions en attente
    F->>B: GET /api/registrations?status=PENDING
    B->>DB: Récupérer registrations PENDING
    DB-->>B: Liste des inscriptions
    B-->>F: Données des inscriptions
    F-->>A: Affichage liste

    A->>F: Clique sur "Valider l'inscription"
    F->>B: POST /api/registrations/{id}/validate
    B->>DB: Créer Student + User
    B->>DB: Mettre à jour registration (status: VALIDATED)
    DB-->>B: Student créé, registration validée
    B-->>F: Confirmation validation
    F-->>A: Message "Étudiant validé avec succès"

    Note over É,A: PHASE 3 - NOTIFICATION AUTOMATIQUE
    
    B->>B: Générer email de confirmation
    B-->>É: Email "Votre inscription est validée"
```

### Séquence 2: Affectation et Génération d'Échéancier

```mermaid
sequenceDiagram
    title 💰 Affectation et Génération d'Échéancier

    participant A as Administrateur
    participant F as Frontend
    participant B as Backend
    participant DB as Base de Données
    participant S as Système

    A->>F: Sélectionne étudiant + formation
    F->>B: POST /api/enrollments
    B->>DB: Créer enrollment
    DB-->>B: Enrollment créé
    B-->>F: Confirmation affectation

    Note over A,S: GÉNÉRATION AUTOMATIQUE DE L'ÉCHÉANCIER
    
    F->>B: POST /api/payment-schedules/generate/{enrollmentId}
    B->>DB: Récupérer course + enrollment
    DB-->>B: Données du cours
    
    alt Type = Soutien Scolaire
        B->>B: Calculer 12 échéances mensuelles
    else Durée ≥ 3 mois
        B->>B: Calculer échéances mensuelles égales
    else Durée < 3 mois
        B->>B: Calculer 2 échéances (50%/50%)
    end

    loop Pour chaque échéance
        B->>DB: Créer PaymentSchedule
        DB-->>B: Échéance créée
    end

    B-->>F: Échéancier généré + résumé
    F-->>A: Affichage échéancier + bouton "Imprimer"

    Note over A,S: NOTIFICATION ÉTUDIANT
    
    S->>S: Générer email avec échéancier
    S-->>É: Email "Votre échéancier de paiement"
```

### Séquence 3: Enregistrement d'un Paiement

```mermaid
sequenceDiagram
    title 💳 Processus d'Enregistrement de Paiement

    participant A as Administrateur
    participant F as Frontend
    participant B as Backend
    participant DB as Base de Données
    participant S as Système de Notification

    A->>F: Consulte liste des échéances
    F->>B: GET /api/payment-schedules?status=En attente
    B->>DB: Récupérer échéances en attente
    DB-->>B: Liste des échéances
    B-->>F: Données formatées
    F-->>A: Affichage avec indicateurs couleur

    A->>F: Sélectionne échéance + "Enregistrer paiement"
    F->>B: POST /api/payment-schedules/{id}/pay
    Note over B: {amount: 5000, method: "Espèces", reference: "RECU-001"}
    
    B->>DB: Créer PaymentTransaction
    DB-->>B: Transaction créée
    
    B->>DB: Mettre à jour PaymentSchedule
    alt Paiement complet
        B->>DB: status = "PAID", paidDate = aujourd'hui
    else Paiement partiel
        B->>DB: status = "PARTIALLY_PAID"
    end
    DB-->>B: Schedule mis à jour

    B-->>F: Confirmation paiement + nouveau statut
    F-->>A: Message "Paiement enregistré avec succès"

    Note over A,S: NOTIFICATION AUTOMATIQUE
    
    S->>S: Générer reçu PDF
    S->>S: Envoyer email de confirmation
    S-->>É: Email "Paiement confirmé + reçu"
```

### Séquence 4: Gestion des Présences

```mermaid
sequenceDiagram
    title 📊 Gestion des Présences en Cours

    participant Frm as Formateur
    participant F as Frontend
    participant B as Backend
    participant DB as Base de Données
    participant S as Système d'Alerte

    Frm->>F: Accède à la session du jour
    F->>B: GET /api/sessions/today
    B->>DB: Récupérer sessions + étudiants inscrits
    DB-->>B: Données de la session
    B-->>F: Liste des étudiants avec statuts
    F-->>Frm: Interface de saisie des présences

    loop Pour chaque étudiant
        Frm->>F: Marque présence (PRESENT/ABSENT/LATE)
        F->>B: POST /api/attendances
        Note over B: {studentId, sessionId, status, date}
        B->>DB: Créer/mettre à jour Attendance
        DB-->>B: Présence enregistrée
    end

    B-->>F: Toutes les présences enregistrées
    F-->>Frm: Message "Présences sauvegardées"

    Note over Frm,S: ALERTE ABSENCES RÉPÉTÉES
    
    B->>B: Analyser absences récentes
    alt Absences répétées détectées
        B->>S: Déclencher alerte administrateur
        S->>A: Notification "Absences répétées - Intervention nécessaire"
    end
```

---

## 🎯 Spécifications des Cas d'Utilisation Détaillés

### UC1: Gérer les Étudiants
**Acteur principal**: Administrateur  
**Préconditions**: Utilisateur authentifié en tant qu'admin  
**Scénario principal**:
1. L'admin consulte la liste des étudiants
2. Le système affiche la liste avec filtres (actifs/inactifs)
3. L'admin peut créer un nouvel étudiant
4. Le système valide les données et crée le profil
5. L'admin peut modifier ou désactiver un étudiant

**Scénarios alternatifs**:
- Données invalides → Message d'erreur
- Email déjà existant → Proposition de fusion

### UC4: Valider les Inscriptions  
**Acteur principal**: Administrateur  
**Préconditions**: Inscriptions en statut PENDING existent  
**Scénario principal**:
1. L'admin consulte la liste des inscriptions en attente
2. Pour chaque inscription, il vérifie les pièces jointes
3. Il valide ou rejette l'inscription
4. Le système crée automatiquement l'étudiant si validé
5. Notification email envoyée à l'étudiant

### UC6: Générer les Échéanciers
**Acteur principal**: Système (automatique) / Administrateur  
**Déclencheur**: Nouvelle affectation créée  
**Scénario principal**:
1. Le système détecte une nouvelle affectation
2. Il récupère les informations du cours (type, durée, prix)
3. Selon le type de cours, il calcule le nombre d'échéances
4. Il génère les échéances avec dates et montants
5. Il enregistre l'échéancier en base de données

**Règles métier**:
- Soutien scolaire: 12 échéances mensuelles
- Formation ≥3 mois: Échéances mensuelles égales  
- Formation <3 mois: 2 échéances (50%/50%)

### UC7: Enregistrer les Paiements
**Acteur principal**: Administrateur  
**Préconditions**: Échéance existante en statut "En attente"  
**Scénario principal**:
1. L'admin sélectionne une échéance
2. Il saisit le montant payé, la méthode, la référence
3. Le système enregistre la transaction
4. Met à jour le statut de l'échéance
5. Génère un reçu PDF automatiquement

### UC10: Marquer les Présences
**Acteur principal**: Formateur  
**Préconditions**: Session planifiée pour aujourd'hui  
**Scénario principal**:
1. Le formateur accède à la session du jour
2. Le système affiche la liste des étudiants inscrits
3. Pour chaque étudiant, il sélectionne le statut de présence
4. Le système enregistre les présences en temps réel
5. Alertes automatiques pour absences répétées

---

## 🔧 Architecture Technique Implémentée

### Stack Actuelle (V1 - MVP)
```
Frontend: React 18 + TypeScript + Vite + Material-UI
Backend: Node.js + Express + TypeORM + PostgreSQL  
Auth: JWT + bcrypt
```

### Structure des Données
```sql
-- Tables principales implémentées
users (id, firstName, lastName, email, phone, role)
students (id, userId, dateOfBirth, address, emergencyContact)
teachers (id, userId, specialization, hourlyRate)  
courses (id, title, category, durationMonths, price, pricePerMonth)
sessions (id, courseId, teacherId, startDate, endDate, schedule)
registrations (id, studentId, status, registrationDate)
enrollments (id, studentId, courseId, status, enrollmentDate)
payment_schedules (id, enrollmentId, installmentNumber, amount, dueDate, status)
payment_transactions (id, scheduleId, amount, paymentMethod, paymentDate)
attendances (id, enrollmentId, sessionId, date, status)
```

### Workflow Complet Métier
1. **Inscription** → Registration (PENDING) → Validation → Student créé
2. **Affectation** → Enrollment → Génération automatique PaymentSchedules  
3. **Paiements** → PaymentTransactions → Mise à jour statuts automatique
4. **Présences** → Attendances → Alertes absences répétées
5. **Rapports** → Dashboard avec KPI en temps réel

Cette modélisation UML représente fidèlement le système actuellement en développement et permet une vision claire des interactions entre les différents acteurs et composants du système.



