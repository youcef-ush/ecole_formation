import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DayOfWeek {
  MONDAY = 'Lundi',
  TUESDAY = 'Mardi',
  WEDNESDAY = 'Mercredi',
  THURSDAY = 'Jeudi',
  FRIDAY = 'Vendredi',
  SATURDAY = 'Samedi',
  SUNDAY = 'Dimanche',
}

/**
 * Entité pour gérer les créneaux horaires standard de l'école
 */
@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek; // Jour de la semaine

  @Column({ type: 'time' })
  startTime: string; // Heure de début (format HH:MM)

  @Column({ type: 'time' })
  endTime: string; // Heure de fin (format HH:MM)

  @Column({ type: 'varchar', nullable: true })
  label: string; // Label optionnel (ex: "Matin", "Après-midi")

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
