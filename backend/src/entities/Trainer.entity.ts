
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Course } from "./Course.entity";

@Entity("trainers")
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  specialty: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Course, (course) => course.trainer)
  courses: Course[];
}
