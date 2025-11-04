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

  @Column({ type: 'time', nullable: true })
  startTime: string;

  @Column({ type: 'time', nullable: true })
  endTime: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.UPCOMING,
  })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

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

  @OneToMany(() => Enrollment, (enrollment) => enrollment.session)
  enrollments: Enrollment[];
}
