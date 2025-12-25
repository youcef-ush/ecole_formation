import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Student } from "./Student.entity";
import { Payment } from "./Payment.entity";
import { User } from "./User.entity";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE"
}

export enum TransactionSource {
  PAYMENT_INSTALLMENT = "PAYMENT_INSTALLMENT",
  REGISTRATION_FEE = "REGISTRATION_FEE",
  MANUAL_EXPENSE = "MANUAL_EXPENSE",
  OTHER_INCOME = "OTHER_INCOME"
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: "enum",
    enum: TransactionType
  })
  type: TransactionType;

  @Index()
  @Column({
    type: "enum",
    enum: TransactionSource
  })
  source: TransactionSource;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  motif: string;

  @Index()
  @Column({ name: "transaction_date", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  transactionDate: Date;

  @Index()
  @Column({ name: "student_id", nullable: true })
  studentId: number;

  @ManyToOne(() => Student, { onDelete: "SET NULL" })
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ name: "payment_id", nullable: true })
  paymentId: number;

  @ManyToOne(() => Payment, { onDelete: "SET NULL" })
  @JoinColumn({ name: "payment_id" })
  payment: Payment;

  @Column({ name: "created_by", nullable: true })
  createdById: number;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  createdBy: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
