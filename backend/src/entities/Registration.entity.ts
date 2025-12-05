import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from './Course.entity';
import { Session } from './Session.entity';
import { InstallmentPayment } from './InstallmentPayment.entity';
import { Student } from './Student.entity';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
}

@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // === INFORMATIONS PAIEMENT FRAIS D'INSCRIPTION ===
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  registrationFee: number;

  @Column({ type: 'boolean', default: false })
  registrationFeePaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  registrationFeePaidAt: Date;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountPaid: number;

  // === VALIDATION (après paiement) ===
  @Column({ type: 'boolean', default: false })
  isValidated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @Column({ nullable: true })
  validatedBy: number; // userId du validateur

  // Lien vers la formation demandée
  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;

  // Lien vers la session choisie (nullable pour anciennes inscriptions)
  @ManyToOne(() => Session, { eager: true, nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ nullable: true })
  sessionId: number;

  // Lien vers l'étudiant créé après validation (nullable)
  @ManyToOne(() => Student, { eager: true, nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ nullable: true })
  studentId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Plan de paiement échelonné
  @Column({ type: 'jsonb', nullable: true })
  installmentPlan: {
    totalAmount: number;
    deposit: number;
    numberOfInstallments: number;
    installmentAmount: number;
  } | null;

  @OneToMany(() => InstallmentPayment, installment => installment.registration, { eager: true })
  installmentPayments: InstallmentPayment[];
}
