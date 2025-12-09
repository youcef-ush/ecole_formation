
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Enrollment } from "./Enrollment.entity";

@Entity("installments")
export class Installment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "enrollment_id" })
    enrollmentId: number;

    @ManyToOne(() => Enrollment, (enrollment) => enrollment.installments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "enrollment_id" })
    enrollment: Enrollment;

    @Column({ type: "date", name: "due_date" })
    dueDate: string;

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number;

    @Column({ name: "is_paid", default: false })
    isPaid: boolean;

    @Column({ name: "paid_at", type: "timestamp", nullable: true })
    paidAt: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
}
