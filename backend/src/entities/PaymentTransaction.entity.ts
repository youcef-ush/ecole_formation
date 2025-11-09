import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentSchedule } from './PaymentSchedule.entity';
import { Enrollment } from './Enrollment.entity';
import { Student } from './Student.entity';

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  scheduleId: number;

  @ManyToOne(() => PaymentSchedule)
  @JoinColumn({ name: 'scheduleId' })
  schedule: PaymentSchedule;

  @Column()
  enrollmentId: number;

  @ManyToOne(() => Enrollment)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column()
  studentId: number;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receivedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
