
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from "typeorm";
import { Trainer } from "./Trainer.entity";
import { Enrollment } from "./Enrollment.entity";
import { AccessLog } from "./AccessLog.entity";

export enum CourseType {
  ABONNEMENT = "ABONNEMENT",
  PACK_HEURES = "PACK_HEURES"
}

export enum PriceModel {
  MONTHLY = "MONTHLY",
  GLOBAL = "GLOBAL"
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

  @ManyToOne(() => Trainer, (trainer) => trainer.courses, { onDelete: "SET NULL" })
  @JoinColumn({ name: "trainer_id" })
  trainer: Trainer;

  // Finance
  @Column("decimal", { name: "total_price", precision: 10, scale: 2 })
  totalPrice: number;

  @Column("decimal", { name: "registration_fee", precision: 10, scale: 2, default: 0 })
  registrationFee: number;

  // Configuration
  @Column({ name: "duration_months", default: 1 })
  durationMonths: number;

  @Column({ type: "enum", enum: CourseType, default: CourseType.ABONNEMENT })
  type: CourseType;

  @Column({ type: "enum", enum: PriceModel, name: "price_model", default: PriceModel.MONTHLY })
  priceModel: PriceModel;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => AccessLog, (log) => log.course)
  accessLogs: AccessLog[];
}
