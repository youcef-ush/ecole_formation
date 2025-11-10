import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  // Mois et année du rapport
  @Column({ type: 'int' })
  month: number; // 1-12

  @Column({ type: 'int' })
  year: number;

  // Label lisible (ex: "Septembre 2025")
  @Column()
  monthLabel: string;

  // Statistiques de présence
  @Column({ type: 'int', default: 0 })
  totalSessions: number;

  @Column({ type: 'int', default: 0 })
  presentCount: number;

  @Column({ type: 'int', default: 0 })
  absentCount: number;

  @Column({ type: 'int', default: 0 })
  lateCount: number;

  @Column({ type: 'int', default: 0 })
  excusedCount: number;

  // Taux de présence (calculé automatiquement)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendanceRate: number; // Pourcentage (ex: 85.50)

  // Alertes pour absences répétées
  @Column({ default: false })
  hasAlert: boolean;

  @Column({ type: 'text', nullable: true })
  alertMessage: string;

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

  @ManyToOne(() => Course, { nullable: false })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;
}
