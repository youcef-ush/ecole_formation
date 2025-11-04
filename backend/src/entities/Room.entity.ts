import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Session } from './Session.entity';
import { TutoringSession } from './TutoringSession.entity';

export enum RoomType {
  THEORETICAL = 'Théorique',
  PRACTICAL = 'Pratique',
  IT = 'Informatique',
  WORKSHOP = 'Atelier',
}

/**
 * Entité pour gérer les salles/classes de l'école
 */
@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // Ex: "Salle A", "Atelier Cuisine 1"

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.THEORETICAL,
  })
  type: RoomType;

  @Column({ type: 'int' })
  capacity: number; // Capacité maximale d'accueil

  @Column({ type: 'text', nullable: true })
  description: string; // Description optionnelle

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Session, (session) => session.room)
  sessions: Session[];

  @OneToMany(() => TutoringSession, (tutoringSession) => tutoringSession.roomEntity)
  tutoringSessions: TutoringSession[];
}
