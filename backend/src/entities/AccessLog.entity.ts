import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Student } from "./Student.entity";
import { Course } from "./Course.entity";

export enum AccessStatus {
  GRANTED = "GRANTED",
  DENIED = "DENIED"
}

@Entity("access_logs")
export class AccessLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "student_id", nullable: true })
  studentId: number;

  @ManyToOne(() => Student, (student) => student.accessLogs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id" })
  student: Student;

  @Column({ name: "course_id", nullable: true })
  courseId: number;

  @ManyToOne(() => Course)
  @JoinColumn({ name: "course_id" })
  course: Course;

  @Column({ type: "enum", enum: AccessStatus })
  status: AccessStatus;

  @Column({ name: "denial_reason", type: "text", nullable: true })
  denialReason: string;

  @Column({ type: "timestamp", name: "access_time", default: () => "CURRENT_TIMESTAMP" })
  accessTime: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
