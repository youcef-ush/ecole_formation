import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from './Student.entity';
import { Session } from './Session.entity';

export enum PaymentMethod {
  CASH = 'Espèces',
  CHECK = 'Chèque',
  BANK_TRANSFER = 'Virement bancaire',
  CARD = 'Carte bancaire',
  ONLINE = 'Paiement en ligne',
}

export enum PaymentType {
  REGISTRATION_FEE = 'Frais d\'inscription',
  SESSION_FEE = 'Frais de session',
}

@Entity('session_payments')
export class SessionPayment {
  @PrimaryGeneratedColumn()
  id: number;

  // Type de paiement
  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.SESSION_FEE,
  })
  paymentType: PaymentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Session, { eager: true, nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ nullable: true })
  sessionId: number;

  // Pour les frais d'inscription (optionnel)
  @Column({ nullable: true })
  registrationId: number;
}
