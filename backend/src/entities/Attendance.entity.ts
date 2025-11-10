import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './Student.entity';
import { Session } from './Session.entity';
import { User } from './User.entity';

// Méthode de scan du QR code
export enum ScanMethod {
  QR_SCAN = 'Scan QR',
  MANUAL = 'Saisie Manuelle',
  ADMIN = 'Ajout Admin',
}

// Statut de la présence
export enum AttendanceStatus {
  PRESENT = 'Présent',
  ABSENT = 'Absent',
  LATE = 'Retard',
  EXCUSED = 'Justifié',
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  // Date et heure de scan
  @Column({ type: 'timestamp' })
  scanTime: Date;

  // Méthode de scan (QR, manuel, admin)
  @Column({
    type: 'enum',
    enum: ScanMethod,
    default: ScanMethod.QR_SCAN,
  })
  scanMethod: ScanMethod;

  // Statut de présence
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  // Note ou justification d'absence
  @Column({ type: 'text', nullable: true })
  note: string;

  // Validation de paiement au moment du scan (true = paiement OK, false = retard)
  @Column({ default: true })
  paymentValidated: boolean;

  // Message d'alerte paiement (ex: "Retard de 16 jours")
  @Column({ nullable: true })
  paymentAlert: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Student, { nullable: false })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Session, { nullable: false })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  sessionId: number;

  // Utilisateur qui a enregistré la présence (si scan manuel ou admin)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @Column({ nullable: true })
  recordedById: number;
}
