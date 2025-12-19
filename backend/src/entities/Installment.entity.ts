import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { PaymentPlan } from "./PaymentPlan.entity";

export enum InstallmentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE"
}

@Entity("installments")
export class Installment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "payment_plan_id" })
  paymentPlanId: number;

  @ManyToOne(() => PaymentPlan, (plan) => plan.installments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "payment_plan_id" })
  paymentPlan: PaymentPlan;

  @Column({ name: "installment_number" })
  installmentNumber: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "date", name: "due_date" })
  dueDate: string;

  @Column({ type: "timestamp", name: "paid_date", nullable: true })
  paidDate: Date;

  @Column({ type: "enum", enum: InstallmentStatus, default: InstallmentStatus.PENDING })
  status: InstallmentStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
