# 🔄 PLAN DE REFACTORISATION - Système QR Code & Présences

## 📊 Analyse de l'Écart Code Actuel vs Architecture Cible

### ✅ Ce qui existe déjà
- ✅ **Student.entity.ts** : a déjà `qrCode` (unique)
- ✅ **Session.entity.ts** : a `enrolledCount`, `capacity`
- ✅ **PaymentSchedule** : système d'échéanciers complet
- ✅ **Registration → Validation → Enrollment** : workflow de base
- ✅ **StudentDetail.tsx** : génération badge QR (mais côté frontend uniquement)

### ❌ Ce qui manque (selon work.md)

#### 1. **Champs manquants dans les entités existantes**

**Student.entity.ts** - Manque :
- ❌ `badgeExpiry: Date` (expiration du badge pour sécurité)
- ❌ `isActive: boolean` (statut actif/inactif)
- ❌ `emergencyContact: string` (contact d'urgence)
- ❌ `schoolLevel: string` (niveau scolaire actuel)
- ❌ Relation vers `User` parent (pour User.student)

**Session.entity.ts** - Manque :
- ❌ `sessionQrCode: string` (QR code unique de la session)
- ❌ `qrExpiresAt: Date` (expiration du QR session)
- ❌ `currentAttendance: number` (nombre présents aujourd'hui)
- ❌ `isActive: boolean`

#### 2. **Entités complètement manquantes**

- ❌ **Attendance.entity.ts** : Table des présences avec scan QR
  ```typescript
  - sessionId: number
  - studentId: number
  - scanTime: Date
  - scanMethod: 'QR_CODE' | 'MANUAL_ADMIN' | 'MOBILE_APP'
  - status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  - scannedBy: number (admin qui a scanné)
  - notes: string
  ```

- ❌ **AttendanceReport.entity.ts** : Rapports statistiques mensuels
  ```typescript
  - studentId: number
  - courseId: number
  - month: number
  - year: number
  - totalSessions: number
  - presentCount: number
  - absentCount: number
  - lateCount: number
  - attendanceRate: number (%)
  ```

- ❌ **AbsenceJustification.entity.ts** : Justifications d'absences
  ```typescript
  - attendanceId: number
  - reason: string
  - documentProof: string (URL fichier)
  - status: 'PENDING' | 'APPROVED' | 'REJECTED'
  - submittedAt: Date
  - reviewedBy: number
  - reviewedAt: Date
  - adminNotes: string
  ```

#### 3. **Services manquants**

- ❌ **qrcode.service.ts** : Génération et validation QR codes
  ```typescript
  - generateStudentBadge(studentId): QrBadge
  - generateSessionQr(sessionId): SessionQr
  - validateQrCode(qrData): ValidationResult
  - revokeQrCode(qrData): void
  ```

- ❌ **access-control.service.ts** : Contrôle d'accès
  ```typescript
  - checkStudentAccess(studentId, sessionId): AccessStatus
  - validatePaymentStatus(studentId): boolean
  - logAccessAttempt(attempt): void
  ```

- ❌ **attendance.service.ts** : Gestion des présences
  ```typescript
  - recordAttendance(scanData): AttendanceRecord
  - generateDailyReport(date): AttendanceReport
  - checkRepeatedAbsences(studentId): AbsenceAlert[]
  ```

#### 4. **Routes API manquantes**

- ❌ **attendance.routes.ts** : 
  - `POST /api/attendance/validate-scan` : Validation scan QR
  - `POST /api/attendance/manual` : Présence manuelle (admin)
  - `GET /api/sessions/:id/attendance` : Liste présences session
  - `POST /api/sessions/:id/generate-qr` : Générer QR session

- ❌ **students.routes.ts** - Endpoints manquants :
  - `POST /api/students/:id/generate-badge` : Générer nouveau badge
  - `PUT /api/students/:id/revoke-badge` : Révoquer badge perdu
  - `GET /api/students/validate-badge/:qrCode` : Valider badge

#### 5. **Pages Frontend manquantes**

- ❌ **QRScanner.tsx** : Page scan QR temps réel
  - Accès caméra
  - Scan QR étudiant
  - Validation instantanée (vert/rouge/orange)
  - Feedback sonore
  - Affichage info étudiant

- ❌ **AttendanceManagement.tsx** : Gestion présences
  - Liste présences par session
  - Statistiques session (présents/absents/retardataires)
  - Marquer présence manuellement
  - Exporter rapport PDF

- ❌ **AbsenceJustifications.tsx** : Gestion justificatifs
  - Liste justificatifs en attente (admin)
  - Formulaire soumission (étudiant)
  - Upload document preuve
  - Validation/rejet (admin)

- ❌ **AttendanceReports.tsx** : Rapports statistiques
  - Taux présence par étudiant
  - Taux présence par formation
  - Alertes absences répétées
  - Graphiques évolution

---

## 🚀 PLAN D'IMPLÉMENTATION PAR PHASES

### 📦 PHASE 1 : Base de Données & Entités (Fondation)

#### Étape 1.1 : Modifier entités existantes
**Fichiers :**
- `backend/src/entities/Student.entity.ts`
- `backend/src/entities/Session.entity.ts`

**Modifications Student.entity.ts :**
```typescript
// AJOUTER ces champs :
@Column({ type: 'timestamp', nullable: true })
badgeExpiry: Date;

@Column({ default: true })
isActive: boolean;

@Column({ nullable: true })
emergencyContact: string;

@Column({ nullable: true })
schoolLevel: string;

// AJOUTER relation vers Attendance
@OneToMany(() => Attendance, (attendance) => attendance.student)
attendances: Attendance[];
```

**Modifications Session.entity.ts :**
```typescript
// AJOUTER ces champs :
@Column({ unique: true, nullable: true })
sessionQrCode: string;

@Column({ type: 'timestamp', nullable: true })
qrExpiresAt: Date;

@Column({ type: 'int', default: 0 })
currentAttendance: number; // Présents aujourd'hui

@Column({ default: true })
isActive: boolean;

// AJOUTER relation vers Attendance
@OneToMany(() => Attendance, (attendance) => attendance.session)
attendances: Attendance[];
```

**Migration SQL :**
```sql
-- backend/migrations/add_qr_fields_to_students.sql
ALTER TABLE students 
  ADD COLUMN badge_expiry TIMESTAMP,
  ADD COLUMN is_active BOOLEAN DEFAULT true,
  ADD COLUMN emergency_contact VARCHAR(255),
  ADD COLUMN school_level VARCHAR(100);

-- Mettre à jour les étudiants existants avec expiration 1 an
UPDATE students 
SET badge_expiry = CURRENT_TIMESTAMP + INTERVAL '1 year',
    is_active = true
WHERE qr_code IS NOT NULL;

-- backend/migrations/add_qr_fields_to_sessions.sql
ALTER TABLE sessions
  ADD COLUMN session_qr_code VARCHAR(255) UNIQUE,
  ADD COLUMN qr_expires_at TIMESTAMP,
  ADD COLUMN current_attendance INT DEFAULT 0,
  ADD COLUMN is_active BOOLEAN DEFAULT true;
```

#### Étape 1.2 : Créer nouvelles entités

**1) Attendance.entity.ts**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Session } from './Session.entity';
import { Student } from './Student.entity';
import { User } from './User.entity';

export enum ScanMethod {
  QR_CODE = 'QR_CODE',
  MANUAL_ADMIN = 'MANUAL_ADMIN',
  MOBILE_APP = 'MOBILE_APP',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Session, (session) => session.attendances)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  sessionId: number;

  @ManyToOne(() => Student, (student) => student.attendances)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @Column({ type: 'timestamp' })
  scanTime: Date;

  @Column({
    type: 'enum',
    enum: ScanMethod,
    default: ScanMethod.QR_CODE,
  })
  scanMethod: ScanMethod;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scannedBy' })
  scannedBy: User;

  @Column({ nullable: true })
  scannedById: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relation vers justification
  @OneToOne(() => AbsenceJustification, (justification) => justification.attendance)
  justification: AbsenceJustification;
}
```

**Migration SQL :**
```sql
-- backend/migrations/create_attendances_table.sql
CREATE TABLE attendances (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scan_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scan_method VARCHAR(20) NOT NULL DEFAULT 'QR_CODE' CHECK (scan_method IN ('QR_CODE', 'MANUAL_ADMIN', 'MOBILE_APP')),
  status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
  scanned_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX idx_attendances_session ON attendances(session_id);
CREATE INDEX idx_attendances_student ON attendances(student_id);
CREATE INDEX idx_attendances_scan_time ON attendances(scan_time);
CREATE UNIQUE INDEX idx_attendances_unique ON attendances(session_id, student_id, DATE(scan_time));
```

**2) AbsenceJustification.entity.ts**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Attendance } from './Attendance.entity';
import { User } from './User.entity';

export enum JustificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('absence_justifications')
export class AbsenceJustification {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Attendance, (attendance) => attendance.justification)
  @JoinColumn({ name: 'attendanceId' })
  attendance: Attendance;

  @Column()
  attendanceId: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({ nullable: true })
  documentProof: string; // URL du fichier uploadé

  @Column({
    type: 'enum',
    enum: JustificationStatus,
    default: JustificationStatus.PENDING,
  })
  status: JustificationStatus;

  @CreateDateColumn()
  submittedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewedBy: User;

  @Column({ nullable: true })
  reviewedById: number;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Migration SQL :**
```sql
-- backend/migrations/create_absence_justifications_table.sql
CREATE TABLE absence_justifications (
  id SERIAL PRIMARY KEY,
  attendance_id INTEGER UNIQUE NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  document_proof VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_justifications_status ON absence_justifications(status);
CREATE INDEX idx_justifications_attendance ON absence_justifications(attendance_id);
```

**3) AttendanceReport.entity.ts**
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Student } from './Student.entity';
import { Course } from './Course.entity';

@Entity('attendance_reports')
@Unique(['studentId', 'courseId', 'month', 'year'])
export class AttendanceReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;

  @Column({ type: 'int' })
  month: number; // 1-12

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  presentCount: number;

  @Column({ type: 'int', default: 0 })
  absentCount: number;

  @Column({ type: 'int', default: 0 })
  lateCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendanceRate: number; // Pourcentage

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
}
```

**Migration SQL :**
```sql
-- backend/migrations/create_attendance_reports_table.sql
CREATE TABLE attendance_reports (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  absent_count INTEGER DEFAULT 0,
  late_count INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id, month, year)
);

CREATE INDEX idx_reports_student ON attendance_reports(student_id);
CREATE INDEX idx_reports_course ON attendance_reports(course_id);
CREATE INDEX idx_reports_period ON attendance_reports(year, month);
```

---

### 📦 PHASE 2 : Services Métier

#### Étape 2.1 : QR Code Service

**Fichier :** `backend/src/services/qrcode.service.ts`

```typescript
import QRCode from 'qrcode';
import crypto from 'crypto';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';

export class QrCodeService {
  private studentRepo = AppDataSource.getRepository(Student);
  private sessionRepo = AppDataSource.getRepository(Session);

  /**
   * Génère un badge QR unique pour un étudiant
   */
  async generateStudentBadge(studentId: number): Promise<{ qrCode: string; qrDataUrl: string; expiry: Date }> {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new Error('Étudiant introuvable');

    // Générer code unique : STU-{id}-{timestamp}-{random}
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const qrCode = `STU-${studentId}-${timestamp}-${random}`;

    // Expiration dans 1 an
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    // Générer l'image QR code
    const qrDataUrl = await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });

    // Sauvegarder dans la BDD
    student.qrCode = qrCode;
    student.badgeExpiry = expiry;
    await this.studentRepo.save(student);

    return { qrCode, qrDataUrl, expiry };
  }

  /**
   * Génère un QR code pour une session (valide jusqu'à la fin de la session)
   */
  async generateSessionQr(sessionId: number): Promise<{ qrCode: string; qrDataUrl: string; expiresAt: Date }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new Error('Session introuvable');

    // Générer code unique : SES-{id}-{date}-{random}
    const dateStr = new Date().toISOString().split('T')[0];
    const random = crypto.randomBytes(4).toString('hex');
    const qrCode = `SES-${sessionId}-${dateStr}-${random}`;

    // Expiration à la fin de la session
    const expiresAt = new Date(session.endDate);
    expiresAt.setHours(23, 59, 59);

    // Générer l'image QR code
    const qrDataUrl = await QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: 'M',
      width: 400,
      margin: 2,
    });

    // Sauvegarder dans la BDD
    session.sessionQrCode = qrCode;
    session.qrExpiresAt = expiresAt;
    await this.sessionRepo.save(session);

    return { qrCode, qrDataUrl, expiresAt };
  }

  /**
   * Valide un QR code étudiant
   */
  async validateStudentQrCode(qrCode: string): Promise<{ valid: boolean; student?: Student; reason?: string }> {
    const student = await this.studentRepo.findOne({
      where: { qrCode },
      relations: ['user', 'enrollments'],
    });

    if (!student) {
      return { valid: false, reason: 'QR Code invalide' };
    }

    if (!student.isActive) {
      return { valid: false, reason: 'Compte étudiant inactif' };
    }

    if (student.badgeExpiry && new Date() > student.badgeExpiry) {
      return { valid: false, reason: 'Badge expiré - Renouvellement nécessaire' };
    }

    return { valid: true, student };
  }

  /**
   * Valide un QR code session
   */
  async validateSessionQrCode(qrCode: string): Promise<{ valid: boolean; session?: Session; reason?: string }> {
    const session = await this.sessionRepo.findOne({
      where: { sessionQrCode: qrCode },
      relations: ['course', 'trainer'],
    });

    if (!session) {
      return { valid: false, reason: 'QR Code de session invalide' };
    }

    if (!session.isActive) {
      return { valid: false, reason: 'Session inactive' };
    }

    if (session.qrExpiresAt && new Date() > session.qrExpiresAt) {
      return { valid: false, reason: 'QR Code de session expiré' };
    }

    return { valid: true, session };
  }

  /**
   * Révoquer un badge étudiant (en cas de perte)
   */
  async revokeStudentBadge(studentId: number): Promise<void> {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new Error('Étudiant introuvable');

    student.qrCode = null;
    student.badgeExpiry = null;
    await this.studentRepo.save(student);
  }
}
```

**Package requis :**
```bash
npm install qrcode @types/qrcode
```

#### Étape 2.2 : Access Control Service

**Fichier :** `backend/src/services/access-control.service.ts`

```typescript
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment.entity';
import { PaymentSchedule, PaymentScheduleStatus } from '../entities/PaymentSchedule.entity';
import { LessThanOrEqual, In } from 'typeorm';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

export class AccessControlService {
  private studentRepo = AppDataSource.getRepository(Student);
  private enrollmentRepo = AppDataSource.getRepository(Enrollment);
  private paymentRepo = AppDataSource.getRepository(PaymentSchedule);

  /**
   * Vérifie si un étudiant peut accéder à une session
   */
  async checkStudentAccess(studentId: number, sessionId: number): Promise<AccessCheckResult> {
    // 1. Vérifier que l'étudiant existe et est actif
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) {
      return { allowed: false, reason: 'Étudiant introuvable' };
    }

    if (!student.isActive) {
      return { allowed: false, reason: 'Compte étudiant inactif - Voir administration' };
    }

    // 2. Vérifier l'inscription à la formation de cette session
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        studentId,
        sessionId,
        status: EnrollmentStatus.ACTIVE,
      },
      relations: ['course'],
    });

    if (!enrollment) {
      return { allowed: false, reason: 'Pas inscrit à cette formation' };
    }

    // 3. Vérifier le statut des paiements
    const paymentCheck = await this.validatePaymentStatus(enrollment.id);
    
    if (!paymentCheck.allowed) {
      return {
        allowed: false,
        reason: paymentCheck.reason,
        warnings: paymentCheck.warnings,
      };
    }

    // Accès autorisé
    return {
      allowed: true,
      warnings: paymentCheck.warnings, // Avertissements (ex: échéance proche)
    };
  }

  /**
   * Vérifie le statut des paiements d'un étudiant
   */
  async validatePaymentStatus(enrollmentId: number): Promise<AccessCheckResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer les échéances en retard
    const overduePayments = await this.paymentRepo.find({
      where: {
        enrollmentId,
        dueDate: LessThanOrEqual(today),
        status: In([PaymentScheduleStatus.EN_ATTENTE, PaymentScheduleStatus.PARTIEL]),
      },
      order: { dueDate: 'ASC' },
    });

    if (overduePayments.length > 0) {
      const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);
      
      // Politique stricte : blocage si retard > 7 jours
      const oldestOverdue = overduePayments[0];
      const daysOverdue = Math.floor((today.getTime() - oldestOverdue.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue > 7) {
        return {
          allowed: false,
          reason: `Paiement en retard de ${daysOverdue} jours - Montant dû: ${totalOverdue.toFixed(2)} DA`,
          warnings: [`${overduePayments.length} échéance(s) en retard`],
        };
      }

      // Avertissement si retard < 7 jours
      return {
        allowed: true,
        warnings: [
          `⚠️ ${overduePayments.length} échéance(s) en retard`,
          `Montant dû: ${totalOverdue.toFixed(2)} DA`,
          `Merci de régulariser votre situation`,
        ],
      };
    }

    // Vérifier si une échéance approche (dans les 3 jours)
    const upcomingDate = new Date(today);
    upcomingDate.setDate(upcomingDate.getDate() + 3);

    const upcomingPayments = await this.paymentRepo.find({
      where: {
        enrollmentId,
        dueDate: LessThanOrEqual(upcomingDate),
        status: PaymentScheduleStatus.EN_ATTENTE,
      },
    });

    if (upcomingPayments.length > 0) {
      return {
        allowed: true,
        warnings: [`ℹ️ Échéance à venir dans les 3 jours`],
      };
    }

    return { allowed: true };
  }

  /**
   * Logger une tentative d'accès (pour audit)
   */
  async logAccessAttempt(data: {
    studentId: number;
    sessionId: number;
    success: boolean;
    reason?: string;
    scanMethod: string;
  }): Promise<void> {
    // TODO: Créer table access_logs si besoin d'audit complet
    console.log('[ACCESS LOG]', {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}
```

#### Étape 2.3 : Attendance Service

**Fichier :** `backend/src/services/attendance.service.ts`

```typescript
import { AppDataSource } from '../config/database.config';
import { Attendance, AttendanceStatus, ScanMethod } from '../entities/Attendance.entity';
import { AttendanceReport } from '../entities/AttendanceReport.entity';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';
import { Enrollment } from '../entities/Enrollment.entity';
import { Between, MoreThan } from 'typeorm';

export interface ScanData {
  studentQrCode: string;
  sessionQrCode: string;
  scannedById?: number;
  notes?: string;
}

export interface AttendanceRecord {
  id: number;
  student: Student;
  session: Session;
  status: AttendanceStatus;
  scanTime: Date;
  warnings?: string[];
}

export class AttendanceService {
  private attendanceRepo = AppDataSource.getRepository(Attendance);
  private reportRepo = AppDataSource.getRepository(AttendanceReport);
  private sessionRepo = AppDataSource.getRepository(Session);

  /**
   * Enregistrer une présence via scan QR
   */
  async recordAttendance(scanData: ScanData, accessCheckResult: any): Promise<AttendanceRecord> {
    const { student, session } = accessCheckResult;

    // Vérifier si déjà scanné aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.attendanceRepo.findOne({
      where: {
        studentId: student.id,
        sessionId: session.id,
        scanTime: Between(today, tomorrow),
      },
    });

    if (existing) {
      throw new Error('Présence déjà enregistrée aujourd\'hui');
    }

    // Créer enregistrement présence
    const attendance = this.attendanceRepo.create({
      studentId: student.id,
      sessionId: session.id,
      scanTime: new Date(),
      scanMethod: ScanMethod.QR_CODE,
      status: AttendanceStatus.PRESENT,
      scannedById: scanData.scannedById,
      notes: scanData.notes,
    });

    await this.attendanceRepo.save(attendance);

    // Incrémenter currentAttendance de la session
    await this.sessionRepo.increment({ id: session.id }, 'currentAttendance', 1);

    // Mettre à jour rapport mensuel
    await this.updateMonthlyReport(student.id, session.courseId);

    return {
      id: attendance.id,
      student,
      session,
      status: attendance.status,
      scanTime: attendance.scanTime,
      warnings: accessCheckResult.warnings,
    };
  }

  /**
   * Marquer présence manuellement (admin)
   */
  async recordManualAttendance(
    studentId: number,
    sessionId: number,
    status: AttendanceStatus,
    adminId: number,
    notes?: string
  ): Promise<Attendance> {
    const attendance = this.attendanceRepo.create({
      studentId,
      sessionId,
      scanTime: new Date(),
      scanMethod: ScanMethod.MANUAL_ADMIN,
      status,
      scannedById: adminId,
      notes,
    });

    await this.attendanceRepo.save(attendance);

    // Mettre à jour rapport si présent
    if (status === AttendanceStatus.PRESENT) {
      const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
      if (session) {
        await this.updateMonthlyReport(studentId, session.courseId);
      }
    }

    return attendance;
  }

  /**
   * Générer rapport quotidien d'une session
   */
  async generateDailyReport(sessionId: number, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await this.attendanceRepo.find({
      where: {
        sessionId,
        scanTime: Between(startOfDay, endOfDay),
      },
      relations: ['student', 'session'],
    });

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['course', 'enrollments', 'enrollments.student'],
    });

    if (!session) throw new Error('Session introuvable');

    const enrolledStudents = session.enrollments.map((e) => e.student);
    const presentStudentIds = attendances.map((a) => a.studentId);
    const absentStudents = enrolledStudents.filter((s) => !presentStudentIds.includes(s.id));

    return {
      session,
      date,
      summary: {
        total: enrolledStudents.length,
        present: attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length,
        absent: absentStudents.length,
        late: attendances.filter((a) => a.status === AttendanceStatus.LATE).length,
        excused: attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length,
      },
      presentStudents: attendances.map((a) => ({
        id: a.student.id,
        name: `${a.student.firstName} ${a.student.lastName}`,
        scanTime: a.scanTime,
        status: a.status,
      })),
      absentStudents: absentStudents.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
      })),
    };
  }

  /**
   * Vérifier absences répétées (alerte après 3 absences)
   */
  async checkRepeatedAbsences(studentId: number, courseId: number): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const absences = await this.attendanceRepo.count({
      where: {
        studentId,
        status: AttendanceStatus.ABSENT,
        scanTime: MoreThan(thirtyDaysAgo),
      },
    });

    if (absences >= 3) {
      return [
        {
          studentId,
          courseId,
          absenceCount: absences,
          period: '30 derniers jours',
          severity: absences >= 5 ? 'HIGH' : 'MEDIUM',
          message: `${absences} absence(s) détectée(s) - Contact recommandé`,
        },
      ];
    }

    return [];
  }

  /**
   * Mettre à jour rapport mensuel
   */
  private async updateMonthlyReport(studentId: number, courseId: number): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let report = await this.reportRepo.findOne({
      where: { studentId, courseId, month, year },
    });

    if (!report) {
      report = this.reportRepo.create({
        studentId,
        courseId,
        month,
        year,
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      });
    }

    // Calculer stats du mois
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const attendances = await this.attendanceRepo.find({
      where: {
        studentId,
        scanTime: Between(startOfMonth, endOfMonth),
      },
      relations: ['session'],
    });

    const sessionsThisMonth = attendances.filter((a) => a.session.courseId === courseId);

    report.totalSessions = sessionsThisMonth.length;
    report.presentCount = sessionsThisMonth.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    report.absentCount = sessionsThisMonth.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    report.lateCount = sessionsThisMonth.filter((a) => a.status === AttendanceStatus.LATE).length;
    report.attendanceRate = report.totalSessions > 0 ? (report.presentCount / report.totalSessions) * 100 : 0;

    await this.reportRepo.save(report);
  }
}
```

---

### 📦 PHASE 3 : Routes API

#### Étape 3.1 : Routes Attendance

**Fichier :** `backend/src/routes/attendance.routes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { QrCodeService } from '../services/qrcode.service';
import { AccessControlService } from '../services/access-control.service';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceStatus } from '../entities/Attendance.entity';

const router = Router();

const qrService = new QrCodeService();
const accessService = new AccessControlService();
const attendanceService = new AttendanceService();

/**
 * POST /api/attendance/validate-scan
 * Valider un scan QR et enregistrer présence
 */
router.post('/validate-scan', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { studentQrCode, sessionQrCode, scannedById, notes } = req.body;

    // 1. Valider QR étudiant
    const studentValidation = await qrService.validateStudentQrCode(studentQrCode);
    if (!studentValidation.valid) {
      return res.status(400).json({
        success: false,
        allowed: false,
        reason: studentValidation.reason,
        feedbackColor: 'red',
      });
    }

    // 2. Valider QR session
    const sessionValidation = await qrService.validateSessionQrCode(sessionQrCode);
    if (!sessionValidation.valid) {
      return res.status(400).json({
        success: false,
        allowed: false,
        reason: sessionValidation.reason,
        feedbackColor: 'red',
      });
    }

    // 3. Vérifier accès (inscription + paiements)
    const accessCheck = await accessService.checkStudentAccess(
      studentValidation.student!.id,
      sessionValidation.session!.id
    );

    if (!accessCheck.allowed) {
      return res.status(403).json({
        success: false,
        allowed: false,
        reason: accessCheck.reason,
        warnings: accessCheck.warnings,
        feedbackColor: 'orange',
      });
    }

    // 4. Enregistrer présence
    const attendance = await attendanceService.recordAttendance(
      { studentQrCode, sessionQrCode, scannedById, notes },
      {
        student: studentValidation.student,
        session: sessionValidation.session,
        warnings: accessCheck.warnings,
      }
    );

    // Log audit
    await accessService.logAccessAttempt({
      studentId: studentValidation.student!.id,
      sessionId: sessionValidation.session!.id,
      success: true,
      scanMethod: 'QR_CODE',
    });

    res.json({
      success: true,
      allowed: true,
      message: 'Présence enregistrée avec succès',
      feedbackColor: 'green',
      student: {
        id: attendance.student.id,
        name: `${attendance.student.firstName} ${attendance.student.lastName}`,
        photo: attendance.student.user?.photo,
      },
      session: {
        id: attendance.session.id,
        name: attendance.session.course.name,
      },
      scanTime: attendance.scanTime,
      warnings: attendance.warnings,
    });
  } catch (error: any) {
    console.error('[SCAN ERROR]', error);
    res.status(500).json({
      success: false,
      allowed: false,
      reason: error.message || 'Erreur lors du scan',
      feedbackColor: 'red',
    });
  }
});

/**
 * POST /api/attendance/manual
 * Marquer présence manuellement (admin)
 */
router.post('/manual', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { studentId, sessionId, status, notes } = req.body;
    const adminId = (req as any).user.id;

    const attendance = await attendanceService.recordManualAttendance(
      studentId,
      sessionId,
      status as AttendanceStatus,
      adminId,
      notes
    );

    res.json({
      success: true,
      message: 'Présence enregistrée manuellement',
      attendance,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/sessions/:id/attendance
 * Obtenir les présences d'une session
 */
router.get('/sessions/:id/attendance', authenticateToken, async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id);
    const date = req.query.date ? new Date(req.query.date as string) : new Date();

    const report = await attendanceService.generateDailyReport(sessionId, date);

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/sessions/:id/generate-qr
 * Générer QR code pour une session
 */
router.post('/sessions/:id/generate-qr', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.id);

    const qrData = await qrService.generateSessionQr(sessionId);

    res.json({
      success: true,
      message: 'QR code de session généré',
      qrCode: qrData.qrCode,
      qrDataUrl: qrData.qrDataUrl,
      expiresAt: qrData.expiresAt,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/attendance/reports/student/:studentId
 * Rapports de présence d'un étudiant
 */
router.get('/reports/student/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

    // TODO: Implémenter récupération rapports
    res.json({ success: true, data: [] });
  } catch (error: any) {
    next(error);
  }
});

export default router;
```

#### Étape 3.2 : Routes Students (badges)

**Ajouter à** `backend/src/routes/students.routes.ts`

```typescript
import { QrCodeService } from '../services/qrcode.service';

const qrService = new QrCodeService();

/**
 * POST /api/students/:id/generate-badge
 * Générer/renouveler badge QR étudiant
 */
router.post('/:id/generate-badge', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);

    const badgeData = await qrService.generateStudentBadge(studentId);

    res.json({
      success: true,
      message: 'Badge QR généré avec succès',
      qrCode: badgeData.qrCode,
      qrDataUrl: badgeData.qrDataUrl,
      expiry: badgeData.expiry,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * PUT /api/students/:id/revoke-badge
 * Révoquer badge en cas de perte
 */
router.put('/:id/revoke-badge', authenticateToken, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);

    await qrService.revokeStudentBadge(studentId);

    res.json({
      success: true,
      message: 'Badge révoqué - Un nouveau badge doit être généré',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/students/validate-badge/:qrCode
 * Valider un badge étudiant
 */
router.get('/validate-badge/:qrCode', authenticateToken, async (req, res, next) => {
  try {
    const qrCode = req.params.qrCode;

    const validation = await qrService.validateStudentQrCode(qrCode);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        valid: false,
        reason: validation.reason,
      });
    }

    res.json({
      success: true,
      valid: true,
      student: {
        id: validation.student!.id,
        firstName: validation.student!.firstName,
        lastName: validation.student!.lastName,
        isActive: validation.student!.isActive,
      },
    });
  } catch (error: any) {
    next(error);
  }
});
```

---

### 📦 PHASE 4 : Frontend - Pages de Scan et Gestion

#### Étape 4.1 : Page QR Scanner

**Fichier :** `frontend/src/pages/QRScanner.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
} from '@mui/material';
import { QrCodeScanner, CheckCircle, Error as ErrorIcon, Warning } from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

type FeedbackColor = 'green' | 'red' | 'orange';

interface ScanResult {
  success: boolean;
  allowed: boolean;
  message?: string;
  reason?: string;
  warnings?: string[];
  feedbackColor: FeedbackColor;
  student?: {
    id: number;
    name: string;
    photo?: string;
  };
  session?: {
    id: number;
    name: string;
  };
  scanTime?: string;
}

export default function QRScanner() {
  const [sessionQrCode, setSessionQrCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const audioRef = useRef<{ success: HTMLAudioElement; error: HTMLAudioElement } | null>(null);

  // Initialiser sons
  useEffect(() => {
    audioRef.current = {
      success: new Audio('/sounds/beep-success.mp3'),
      error: new Audio('/sounds/beep-error.mp3'),
    };
  }, []);

  // Scanner QR session (première étape)
  const startSessionScan = () => {
    setIsScanning(true);

    const scanner = new Html5QrcodeScanner(
      'session-scanner',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        setSessionQrCode(decodedText);
        scanner.clear();
        setIsScanning(false);
        startStudentScan(decodedText);
      },
      (errorMessage) => {
        console.log('Scan error:', errorMessage);
      }
    );

    scannerRef.current = scanner;
  };

  // Scanner QR étudiant (deuxième étape)
  const startStudentScan = (sessionQr: string) => {
    setIsScanning(true);

    const scanner = new Html5QrcodeScanner(
      'student-scanner',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (decodedText) => {
        await validateScan(decodedText, sessionQr);
        scanner.clear();
        setIsScanning(false);

        // Recommencer scan après 2 secondes
        setTimeout(() => startStudentScan(sessionQr), 2000);
      },
      (errorMessage) => {
        console.log('Scan error:', errorMessage);
      }
    );

    scannerRef.current = scanner;
  };

  // Valider scan auprès du backend
  const validateScan = async (studentQrCode: string, sessionQrCode: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/attendance/validate-scan`,
        {
          studentQrCode,
          sessionQrCode,
          scannedById: JSON.parse(localStorage.getItem('user') || '{}').id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result: ScanResult = response.data;
      setLastScanResult(result);

      // Feedback sonore
      if (result.feedbackColor === 'green') {
        audioRef.current?.success.play();
      } else {
        audioRef.current?.error.play();
      }

      // Effacer résultat après 5 secondes
      setTimeout(() => setLastScanResult(null), 5000);
    } catch (error: any) {
      const result: ScanResult = {
        success: false,
        allowed: false,
        reason: error.response?.data?.reason || 'Erreur de connexion',
        feedbackColor: 'red',
      };
      setLastScanResult(result);
      audioRef.current?.error.play();
    }
  };

  // Stop scanner
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setIsScanning(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        📱 Scanner QR - Contrôle des Présences
      </Typography>

      {!sessionQrCode && (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <QrCodeScanner sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Étape 1 : Scanner le QR Code de la Session
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Scannez d'abord le QR code affiché pour la session en cours
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={startSessionScan}
            disabled={isScanning}
          >
            Démarrer Scan Session
          </Button>
          <Box id="session-scanner" mt={3} />
        </Paper>
      )}

      {sessionQrCode && (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Session active - Vous pouvez maintenant scanner les badges étudiants
          </Alert>

          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Étape 2 : Scanner les Badges Étudiants
            </Typography>
            <Box id="student-scanner" mt={3} />
            <Button
              variant="outlined"
              color="error"
              onClick={stopScanning}
              sx={{ mt: 2 }}
            >
              Arrêter Scanner
            </Button>
          </Paper>
        </>
      )}

      {/* Feedback visuel */}
      {lastScanResult && (
        <Card
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            minWidth: 300,
            maxWidth: 400,
            zIndex: 9999,
            bgcolor:
              lastScanResult.feedbackColor === 'green'
                ? 'success.light'
                : lastScanResult.feedbackColor === 'red'
                ? 'error.light'
                : 'warning.light',
            border: 4,
            borderColor:
              lastScanResult.feedbackColor === 'green'
                ? 'success.main'
                : lastScanResult.feedbackColor === 'red'
                ? 'error.main'
                : 'warning.main',
          }}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              {lastScanResult.feedbackColor === 'green' && (
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              )}
              {lastScanResult.feedbackColor === 'red' && (
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
              )}
              {lastScanResult.feedbackColor === 'orange' && (
                <Warning color="warning" sx={{ fontSize: 40 }} />
              )}

              <Box>
                <Typography variant="h6">
                  {lastScanResult.allowed ? 'ACCÈS AUTORISÉ' : 'ACCÈS REFUSÉ'}
                </Typography>
                <Typography variant="body2">
                  {lastScanResult.message || lastScanResult.reason}
                </Typography>
              </Box>
            </Stack>

            {lastScanResult.student && (
              <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <Avatar src={lastScanResult.student.photo} />
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {lastScanResult.student.name}
                  </Typography>
                  <Typography variant="caption">
                    {lastScanResult.session?.name}
                  </Typography>
                </Box>
              </Stack>
            )}

            {lastScanResult.warnings && lastScanResult.warnings.length > 0 && (
              <Box mt={2}>
                {lastScanResult.warnings.map((warning, idx) => (
                  <Chip key={idx} label={warning} size="small" color="warning" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
```

**Package requis :**
```bash
npm install html5-qrcode
```

---

## 🎯 RÉSUMÉ DES FICHIERS À CRÉER/MODIFIER

### ✅ BACKEND

**Nouvelles entités (3) :**
1. `backend/src/entities/Attendance.entity.ts`
2. `backend/src/entities/AbsenceJustification.entity.ts`
3. `backend/src/entities/AttendanceReport.entity.ts`

**Entités à modifier (2) :**
1. `backend/src/entities/Student.entity.ts` (+ 4 champs)
2. `backend/src/entities/Session.entity.ts` (+ 4 champs)

**Migrations SQL (6) :**
1. `backend/migrations/add_qr_fields_to_students.sql`
2. `backend/migrations/add_qr_fields_to_sessions.sql`
3. `backend/migrations/create_attendances_table.sql`
4. `backend/migrations/create_absence_justifications_table.sql`
5. `backend/migrations/create_attendance_reports_table.sql`

**Services (3) :**
1. `backend/src/services/qrcode.service.ts`
2. `backend/src/services/access-control.service.ts`
3. `backend/src/services/attendance.service.ts`

**Routes (2) :**
1. `backend/src/routes/attendance.routes.ts` (nouveau)
2. `backend/src/routes/students.routes.ts` (ajouter 3 endpoints)

**Configuration :**
- `backend/src/app.ts` : Importer et utiliser `attendance.routes`

### ✅ FRONTEND

**Nouvelles pages (4) :**
1. `frontend/src/pages/QRScanner.tsx`
2. `frontend/src/pages/AttendanceManagement.tsx`
3. `frontend/src/pages/AbsenceJustifications.tsx`
4. `frontend/src/pages/AttendanceReports.tsx`

**Pages à modifier (2) :**
1. `frontend/src/pages/StudentDetail.tsx` (utiliser badge existant)
2. `frontend/src/pages/Dashboard.tsx` (widget présences)

**Configuration :**
- `frontend/src/App.tsx` : Ajouter routes
- `frontend/src/components/Layout/Layout.tsx` : Ajouter menu items

---

## ⚡ ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Phase 1 : Base de données** (1-2h)
   - Modifier Student.entity.ts
   - Modifier Session.entity.ts
   - Créer Attendance.entity.ts
   - Créer AbsenceJustification.entity.ts
   - Créer AttendanceReport.entity.ts
   - Exécuter toutes les migrations

2. **Phase 2 : Services** (2-3h)
   - Installer package `qrcode`
   - Créer qrcode.service.ts
   - Créer access-control.service.ts
   - Créer attendance.service.ts

3. **Phase 3 : Backend API** (1-2h)
   - Créer attendance.routes.ts
   - Modifier students.routes.ts
   - Mettre à jour app.ts

4. **Phase 4 : Frontend** (3-4h)
   - Installer package `html5-qrcode`
   - Créer QRScanner.tsx
   - Créer AttendanceManagement.tsx
   - Créer AbsenceJustifications.tsx
   - Modifier StudentDetail.tsx
   - Mettre à jour Dashboard.tsx
   - Ajouter routes dans App.tsx

5. **Phase 5 : Tests** (1-2h)
   - Tester workflow complet
   - Vérifier feedback visuel/sonore
   - Tester cas d'erreur (badge expiré, paiement retard, etc.)

**TEMPS TOTAL ESTIMÉ : 8-13 heures**

---

## 📝 NOTES IMPORTANTES

1. **Sécurité QR Codes :**
   - Les QR codes étudiants expirent après 1 an
   - Les QR codes sessions expirent en fin de session
   - Possibilité de révoquer un badge perdu

2. **Contrôle d'Accès :**
   - Blocage automatique si retard > 7 jours
   - Avertissements si échéance proche (3 jours)
   - Vérification inscription active

3. **Alertes Absences :**
   - Déclenchement après 3 absences en 30 jours
   - Notification admin automatique
   - Possibilité justification étudiant

4. **Statistiques :**
   - Rapports mensuels auto-générés
   - Taux de présence par étudiant/formation
   - Exports PDF disponibles

5. **Audit :**
   - Tous les scans loggés
   - Traçabilité admin qui a scanné
   - Historique complet des tentatives d'accès

---

Voulez-vous que je commence l'implémentation ? Par quelle phase souhaitez-vous commencer ?
