
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Enrollment } from "./Enrollment.entity";
import { AccessLog } from "./AccessLog.entity";

@Entity("students")
export class Student {
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

  @Column({ name: "qr_code", unique: true })
  qrCode: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => AccessLog, (log) => log.student)
  accessLogs: AccessLog[];
}
