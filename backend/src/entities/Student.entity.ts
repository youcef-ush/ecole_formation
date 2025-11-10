import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Enrollment } from './Enrollment.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  // Badge QR Code (généré lors de la validation de l'inscription)
  @Column({ unique: true, nullable: true })
  badgeQrCode: string;

  // Date d'expiration du badge (renouvelable chaque année)
  @Column({ type: 'date', nullable: true })
  badgeExpiry: Date;

  // Statut actif/inactif de l'étudiant
  @Column({ default: true })
  isActive: boolean;

  // Contact d'urgence
  @Column({ nullable: true })
  emergencyContact: string;

  // Niveau scolaire (ex: "Lycée", "Université", "Professionnel")
  @Column({ nullable: true })
  schoolLevel: string;

  // Code QR unique pour chaque étudiant (DÉPRÉCIÉ - utiliser badgeQrCode)
  @Column({ unique: true, nullable: true })
  qrCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.student)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
