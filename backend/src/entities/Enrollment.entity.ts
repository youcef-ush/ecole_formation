import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("enrollments")
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @Column({ type: "date", name: "birth_date", nullable: true })
  birthDate: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: "text", nullable: true })
  address: string;

  // Info du cours (simple référence, pas de FK)
  @Column({ name: "course_id", nullable: true })
  courseId: number;

  @Column({ name: "course_title", nullable: true })
  courseTitle: string;

  // Frais d'inscription
  @Column({ name: "registration_fee", type: "decimal", precision: 10, scale: 2, default: 0 })
  registrationFee: number;

  @Column({ name: "is_registration_fee_paid", default: false })
  isRegistrationFeePaid: boolean;

  @Column({ type: "timestamp", name: "registration_fee_paid_at", nullable: true })
  registrationFeePaidAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
