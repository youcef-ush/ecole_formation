import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { Student } from "./Student.entity";
import { PaymentPlan } from "./PaymentPlan.entity";
import { Installment } from "./Installment.entity";

// Affectation d'un plan de paiement à un étudiant (instance concrète)
@Entity("student_payment_plans")
export class StudentPaymentPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id" })
  studentId: number;

  @ManyToOne(() => Student, (student) => student.studentPaymentPlans)
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ name: "payment_plan_id" })
  paymentPlanId: number;

  @ManyToOne(() => PaymentPlan, (plan) => plan.studentPaymentPlans)
  @JoinColumn({ name: "payment_plan_id" })
  paymentPlan: PaymentPlan;

  @Column({ 
    type: "decimal", 
    precision: 10, 
    scale: 2, 
    name: "total_amount",
    comment: "Montant total pour cet étudiant"
  })
  totalAmount: number;

  @Column({ 
    type: "int",
    name: "remaining_sessions",
    nullable: true,
    comment: "Pour type CONSUMPTION: nombre de séances restantes"
  })
  remainingSessions?: number;

  @Column({
    type: "varchar",
    length: 20,
    default: "ACTIVE",
    comment: "Statut: ACTIVE, COMPLETED, CANCELLED"
  })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
