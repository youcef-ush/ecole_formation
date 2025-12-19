import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { Student } from "./Student.entity";
import { Installment } from "./Installment.entity";

@Entity("payment_plans")
export class PaymentPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id" })
  studentId: number;

  @ManyToOne(() => Student, (student) => student.paymentPlan)
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ type: "decimal", precision: 10, scale: 2, name: "total_amount" })
  totalAmount: number;

  @Column({ name: "number_of_installments" })
  numberOfInstallments: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => Installment, (installment) => installment.paymentPlan)
  installments: Installment[];

  @OneToMany(() => Student, (student) => student.paymentPlan)
  students: Student[];
}
