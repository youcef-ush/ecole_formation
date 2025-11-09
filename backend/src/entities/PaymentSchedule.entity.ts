import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Enrollment } from './Enrollment.entity';

export enum PaymentScheduleStatus {
  EN_ATTENTE = 'En attente',
  PAYE = 'Payé',
  EN_RETARD = 'En retard',
  PARTIEL = 'Paiement partiel',
  ANNULE = 'Annulé',
}

@Entity('payment_schedules')
export class PaymentSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  enrollmentId: number;

  @ManyToOne(() => Enrollment)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column({ type: 'integer' })
  installmentNumber: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentScheduleStatus,
    default: PaymentScheduleStatus.EN_ATTENTE,
  })
  status: PaymentScheduleStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
