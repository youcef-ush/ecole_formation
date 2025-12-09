
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Enrollment } from "./Enrollment.entity";

@Entity("payment_plans")
export class PaymentPlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: "installments_count" })
    installmentsCount: number;

    @Column({ name: "interval_days" })
    intervalDays: number;

    @Column({ type: "text", nullable: true })
    description: string;

    @OneToMany(() => Enrollment, (enrollment) => enrollment.paymentPlan)
    enrollments: Enrollment[];
}
