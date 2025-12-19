import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Student } from "./Student.entity";

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  CHECK = "CHECK",
  TRANSFER = "TRANSFER"
}

export enum PaymentType {
  REGISTRATION = "REGISTRATION",
  INSTALLMENT = "INSTALLMENT",
  SESSION = "SESSION"
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id" })
  studentId: number;

  @ManyToOne(() => Student, (student) => student.payments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "enum", enum: PaymentMethod, name: "payment_method", default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ type: "enum", enum: PaymentType, name: "payment_type", default: PaymentType.REGISTRATION })
  paymentType: PaymentType;

  @Column({ type: "timestamp", name: "payment_date" })
  paymentDate: Date;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
