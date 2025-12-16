
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Enrollment } from "./Enrollment.entity";
import { Installment } from "./Installment.entity";

export enum PaymentType {
  INSTALLMENT = "INSTALLMENT",
  REGISTRATION_FEE = "REGISTRATION_FEE"
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "enrollment_id", nullable: true })
  enrollmentId: number | null;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.payments, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "enrollment_id" })
  enrollment: Enrollment | null;

  @Column({ name: "installment_id", nullable: true })
  installmentId: number;

  @ManyToOne(() => Installment)
  @JoinColumn({ name: "installment_id" })
  installment: Installment;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: "payment_date" })
  paymentDate: Date;

  @Column({ default: "CASH" })
  method: string;

  @Column({ type: "text", nullable: true })
  note: string;

  @Column({
    type: "enum",
    enum: PaymentType,
    default: PaymentType.INSTALLMENT
  })
  type: PaymentType;
}
