import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { Student } from "./Student.entity";
import { Course } from "./Course.entity";
import { PaymentPlan } from "./PaymentPlan.entity";
import { Installment } from "./Installment.entity";

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

// Affectation d'un étudiant à une formation avec plan de paiement personnalisé
@Entity("student_assignments")
export class StudentAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id" })
  studentId: number;

  @ManyToOne(() => Student, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ name: "course_id" })
  courseId: number;

  @ManyToOne(() => Course, { onDelete: "CASCADE" })
  @JoinColumn({ name: "course_id" })
  course: Course;

  @Column({ name: "payment_plan_id" })
  paymentPlanId: number;

  @ManyToOne(() => PaymentPlan, { onDelete: "CASCADE" })
  @JoinColumn({ name: "payment_plan_id" })
  paymentPlan: PaymentPlan;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    name: "total_amount",
    comment: "Montant total pour cette affectation spécifique"
  })
  totalAmount: number;

  @Column({
    type: "enum",
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
    comment: "Statut de l'affectation"
  })
  status: AssignmentStatus;

  // Installments personnalisés pour cette affectation
  @OneToMany(() => Installment, (installment) => installment.studentAssignment, { cascade: true })
  installments: Installment[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    nullable: true,
    name: "completed_at",
    comment: "Date de completion de l'affectation"
  })
  completedAt?: Date;
}