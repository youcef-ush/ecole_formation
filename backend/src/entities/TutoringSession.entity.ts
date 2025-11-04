import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './Course.entity';
import { Student } from './Student.entity';
import { Trainer } from './Trainer.entity';
import { Room } from './Room.entity';

export enum TutoringSessionStatus {
  SCHEDULED = 'Programmée',
  COMPLETED = 'Terminée',
  CANCELLED = 'Annulée',
  RESCHEDULED = 'Reportée',
}

/**
 * Entité pour gérer les séances de cours individuels
 * Permet d'assigner un étudiant spécifique à un professeur pour un cours
 */
@Entity('tutoring_sessions')
export class TutoringSession {
  @PrimaryGeneratedColumn()
  id: number;

  // Relations
  @ManyToOne(() => Course, { eager: true })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Trainer, { eager: true })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column()
  trainerId: number;

  // Détails de la séance
  @Column({ type: 'varchar' })
  room: string; // Salle (texte pour compatibilité)

  @ManyToOne(() => Room, (room) => room.tutoringSessions, { nullable: true })
  @JoinColumn({ name: 'roomEntityId' })
  roomEntity: Room; // Relation avec l'entité Room

  @Column({ nullable: true })
  roomEntityId: number;

  @Column({ type: 'varchar' })
  schedule: string; // Créneau (ex: "Lundi 14h-16h")

  @Column({ type: 'date' })
  sessionDate: Date; // Date de la séance

  @Column({ type: 'time' })
  startTime: string; // Heure de début

  @Column({ type: 'time' })
  endTime: string; // Heure de fin

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Prix de la séance

  @Column({
    type: 'enum',
    enum: TutoringSessionStatus,
    default: TutoringSessionStatus.SCHEDULED,
  })
  status: TutoringSessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string; // Notes sur la séance

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
