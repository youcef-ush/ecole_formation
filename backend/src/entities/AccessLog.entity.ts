
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

    @Column({ name: "student_id" })
    studentId: number;

    @ManyToOne(() => Student, { onDelete: "CASCADE" })
    @JoinColumn({ name: "student_id" })
    student: Student;

    @Column({ name: "course_id", nullable: true })
    courseId: number;

    @ManyToOne(() => Course, { onDelete: "SET NULL" })
    @JoinColumn({ name: "course_id" })
    course: Course;

    @CreateDateColumn({ name: "scan_time" })
    scanTime: Date;

    @Column({ type: "enum", enum: AccessStatus })
    status: AccessStatus;

    @Column({ name: "denial_reason", nullable: true })
    denialReason: string;
}
