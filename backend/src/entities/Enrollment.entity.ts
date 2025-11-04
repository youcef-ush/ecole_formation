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
import { Student } from './Student.entity';
import { Session } from './Session.entity';
import { Payment } from './Payment.entity';

export enum EnrollmentStatus {
  PENDING = 'En attente',
  PAID = 'Payé',
  CANCELLED = 'Annulé',
}

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  enrolledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Student, (student) => student.enrollments)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Session, (session) => session.enrollments)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column()
  sessionId: number;

  @OneToMany(() => Payment, (payment) => payment.enrollment)
  payments: Payment[];
}
