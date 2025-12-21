import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { Trainer } from "./Trainer.entity";
import { Student } from "./Student.entity";
import { StudentAssignment } from "./StudentAssignment.entity";

export enum CourseType {
  ABONNEMENT = "ABONNEMENT",
  PACK_HEURES = "PACK_HEURES"
}

export enum PriceModel {
  MONTHLY = "MONTHLY",
  GLOBAL = "GLOBAL"
}

export enum CourseCategory {
  PROFESSIONAL = "Formation professionnelle",
  TUTORING = "Soutien scolaire",
  PERSONAL = "Développement personnel"
}

@Entity("courses")
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "trainer_id", nullable: true })
  trainerId: number;

  @ManyToOne(() => Trainer, (trainer) => trainer.courses)
  @JoinColumn({ name: "trainer_id" })
  trainer: Trainer;

  @Column({ type: "enum", enum: CourseType, default: CourseType.ABONNEMENT })
  type: CourseType;

  @Column({ type: "enum", enum: PriceModel, name: "price_model", default: PriceModel.MONTHLY })
  priceModel: PriceModel;

  @Column({ type: "varchar", length: 255, nullable: true })
  category: string;

  @Column({ name: "duration_months", nullable: true })
  durationMonths: number;

  @Column({ name: "total_hours", nullable: true })
  totalHours: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: "monthly_price", type: "decimal", precision: 10, scale: 2, nullable: true })
  monthlyPrice: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @OneToMany(() => Student, (student) => student.course)
  students: Student[];

  @OneToMany(() => StudentAssignment, (assignment) => assignment.course)
  studentAssignments: StudentAssignment[];
}
