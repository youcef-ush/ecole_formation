
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from "typeorm";
import { Student } from "./Student.entity";
import { Course } from "./Course.entity";
import { PaymentPlan } from "./PaymentPlan.entity";
import { Installment } from "./Installment.entity";
import { Payment } from "./Payment.entity";

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

@Entity("enrollments")
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id" })
  studentId: number;

  @ManyToOne(() => Student, (student) => student.enrollments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ name: "course_id" })
  courseId: number;

  @ManyToOne(() => Course, (course) => course.enrollments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "course_id" })
  course: Course;

  @Column({ name: "payment_plan_id", nullable: true })
  paymentPlanId: number;

  @ManyToOne(() => PaymentPlan, (plan) => plan.enrollments)
  @JoinColumn({ name: "payment_plan_id" })
  paymentPlan: PaymentPlan;

  @Column({ type: "date", name: "start_date" })
  startDate: string;

  @Column({ type: "date", name: "end_date", nullable: true })
  endDate: string;

  @Column({ type: "enum", enum: EnrollmentStatus, default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;

  @Column({ name: "remaining_usage", default: 0 })
  remainingUsage: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Installment, (installment) => installment.enrollment)
  installments: Installment[];

  @OneToMany(() => Payment, (payment) => payment.enrollment)
  payments: Payment[];
}
