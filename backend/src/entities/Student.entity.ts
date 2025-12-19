import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Enrollment } from "./Enrollment.entity";
import { Course } from "./Course.entity";
import { PaymentPlan } from "./PaymentPlan.entity";
import { Payment } from "./Payment.entity";
import { AccessLog } from "./AccessLog.entity";

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

  // Plan de paiement (optionnel)
  @Column({ name: "payment_plan_id", nullable: true })
  paymentPlanId: number;

  @ManyToOne(() => PaymentPlan, (plan) => plan.students, { nullable: true })
  @JoinColumn({ name: "payment_plan_id" })
  paymentPlan: PaymentPlan;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => Payment, (payment) => payment.student)
  payments: Payment[];

  @OneToMany(() => AccessLog, (log) => log.student)
  accessLogs: AccessLog[];
}
