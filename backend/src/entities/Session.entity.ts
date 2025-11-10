import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from './Course.entity';
import { Trainer } from './Trainer.entity';
import { Enrollment } from './Enrollment.entity';
import { Room } from './Room.entity';
import { TimeSlot } from './TimeSlot.entity';

export enum SessionStatus {
  UPCOMING = 'À venir',
  IN_PROGRESS = 'En cours',
  COMPLETED = 'Terminée',
  CANCELLED = 'Annulée',
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // Pour le suivi mensuel (ex: "Septembre 2025", "Octobre 2025")
  @Column({ nullable: true })
  monthLabel: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'int', nullable: true })
  month: number; // 1-12

  @Column({ type: 'time', nullable: true })
  startTime: string;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  // Jours de la semaine (peut être multiple: "Lundi,Mercredi,Vendredi")
  @Column({ nullable: true })
  daysOfWeek: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  enrolledCount: number;

  @Column()
  location: string;

  // Prix de cette session (peut être différent du prix de la formation)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.UPCOMING,
  })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // QR Code unique pour cette session (généré automatiquement)
  @Column({ unique: true, nullable: true })
  sessionQrCode: string;

  // Date d'expiration du QR code de la session (généralement valide le jour de la session)
  @Column({ type: 'timestamp', nullable: true })
  qrExpiresAt: Date;

  // Nombre d'étudiants présents actuellement (mis à jour par le système de présence)
  @Column({ type: 'int', default: 0 })
  currentAttendance: number;

  // Statut actif/inactif de la session
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.sessions)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  courseId: number;

  @ManyToOne(() => Trainer, (trainer) => trainer.sessions)
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column()
  trainerId: number;

  @ManyToOne(() => Room, (room) => room.sessions, { nullable: true })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ nullable: true })
  roomId: number;

  @ManyToOne(() => TimeSlot, { nullable: true })
  @JoinColumn({ name: 'timeSlotId' })
  timeSlot: TimeSlot;

  @Column({ nullable: true })
  timeSlotId: number;
}
