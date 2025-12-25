import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum UserRole {
  ADMIN = "ADMIN",
  RECEPTION = "RECEPTION",
  STAFF = "STAFF"
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
