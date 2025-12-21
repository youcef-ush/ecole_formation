import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Enrollment } from "./Enrollment.entity";
import { Course } from "./Course.entity";
import { Payment } from "./Payment.entity";
import { AccessLog } from "./AccessLog.entity";
import { StudentPaymentPlan } from "./StudentPaymentPlan.entity";
import { StudentAssignment } from "./StudentAssignment.entity";

export enum StudentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

@Entity("students")
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  // Lien unique vers l'inscription d'origine
  @Column({ name: "enrollment_id", unique: true })
  enrollmentId: number;

  @OneToOne(() => Enrollment)
  @JoinColumn({ name: "enrollment_id" })
  enrollment: Enrollment;

  // QR codes
  @Column({ name: "qr_code", unique: true })
  qrCode: string;

  @Column({ name: "badge_qr_code", type: "text", nullable: true })
  badgeQrCode: string;

  // Statut
  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ type: "enum", enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  // Relation avec la formation
  @Column({ name: "course_id" })
  courseId: number;

  @ManyToOne(() => Course, (course) => course.students, { onDelete: "CASCADE" })
  @JoinColumn({ name: "course_id" })
  course: Course;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => Payment, (payment) => payment.student)
  payments: Payment[];

  @OneToMany(() => AccessLog, (log) => log.student)
  accessLogs: AccessLog[];

  @OneToMany(() => StudentPaymentPlan, (spp) => spp.student)
  studentPaymentPlans: StudentPaymentPlan[];

  @OneToMany(() => StudentAssignment, (assignment) => assignment.student)
  studentAssignments: StudentAssignment[];
}
