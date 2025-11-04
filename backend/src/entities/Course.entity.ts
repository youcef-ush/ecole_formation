import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from './Session.entity';
import { Room } from './Room.entity';
import { TimeSlot } from './TimeSlot.entity';
import { Trainer } from './Trainer.entity';

export enum CourseCategory {
  TUTORING = 'Soutien scolaire',
  PROFESSIONAL = 'Formation professionnelle',
  PERSONAL_DEV = 'Développement personnel',
  LANGUAGES = 'Langues',
  COOKING = 'Cuisine',
  SEWING = 'Couture',
  IT = 'Informatique',
  OTHER = 'Autre',
}

export enum CourseType {
  QUALIFYING = 'Formation Qualifiante',
  TUTORING_GROUP = 'Soutien Scolaire (Groupe)',
  TUTORING_INDIVIDUAL = 'Soutien Scolaire (Individuel)',
  TUTORING_ONLINE = 'Soutien Scolaire (En ligne)',
}

export enum CourseCertificate {
  SCHOOL_CERTIFICATE = 'Certificat école',
  CQP = 'CQP',
  STATE_DIPLOMA = 'Diplôme État',
  NONE = 'Aucun',
}

// Niveaux scolaires
export enum SchoolLevel {
  // Primaire
  PRIMAIRE_1 = '1ère année primaire',
  PRIMAIRE_2 = '2ème année primaire',
  PRIMAIRE_3 = '3ème année primaire',
  PRIMAIRE_4 = '4ème année primaire',
  PRIMAIRE_5 = '5ème année primaire',
  // Collège (CEM)
  CEM_1 = '1ère année collège',
  CEM_2 = '2ème année collège',
  CEM_3 = '3ème année collège',
  CEM_4 = '4ème année collège (BEM)',
  // Lycée
  LYCEE_1 = '1ère année secondaire',
  LYCEE_2 = '2ème année secondaire',
  LYCEE_3 = '3ème année secondaire (BAC)',
}

// Branches du lycée
export enum LyceeBranch {
  SCIENCES = 'Sciences Expérimentales',
  MATH = 'Mathématiques',
  TECH_MATH = 'Techniques Mathématiques',
  GESTION = 'Gestion et Économie',
  LETTRES = 'Lettres et Philosophie',
  LANGUES = 'Langues Étrangères',
}

// Matières/Modules
export enum SubjectModule {
  // Matières scientifiques
  MATH = 'Mathématiques',
  PHYSICS = 'Physique',
  CHEMISTRY = 'Chimie',
  SCIENCES = 'Sciences Naturelles',
  // Langues
  ARABIC = 'Arabe',
  FRENCH = 'Français',
  ENGLISH = 'Anglais',
  // Autres
  HISTORY = 'Histoire-Géographie',
  PHILOSOPHY = 'Philosophie',
  ISLAMIC = 'Éducation Islamique',
  CIVIC = 'Éducation Civique',
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: CourseCategory,
    default: CourseCategory.OTHER,
  })
  category: CourseCategory;

  @Column({
    type: 'enum',
    enum: CourseType,
    default: CourseType.QUALIFYING,
  })
  type: CourseType;

  @Column({
    type: 'enum',
    enum: CourseCertificate,
    default: CourseCertificate.SCHOOL_CERTIFICATE,
  })
  certificate: CourseCertificate;

  @Column({ type: 'int' })
  durationHours: number;

  @Column({ type: 'varchar', nullable: true })
  durationDescription: string; // Ex: "3 mois", "6 semaines"

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerSession: number; // Pour les cours particuliers

  @Column({ type: 'text', nullable: true })
  prerequisites: string;

  @Column({ type: 'int', default: 16 })
  minAge: number;

  @Column({ type: 'int', nullable: true })
  maxStudents: number; // Capacité max pour les cours en groupe

  @Column({ type: 'text', nullable: true })
  practicalContent: string; // Contenu pratique

  // Champs spécifiques pour cours de soutien
  @Column({ type: 'varchar', nullable: true })
  teacherName: string; // Nom de l'enseignant - legacy

  @Column({ type: 'varchar', nullable: true })
  room: string; // Salle (ex: "Salle 101", "Bloc A") - legacy

  @Column({ type: 'varchar', nullable: true })
  schedule: string; // Créneaux horaires (ex: "Lundi 14h-16h, Mercredi 10h-12h") - legacy

  // Relations vers Trainer, Room et TimeSlot (nouvelles)
  @ManyToOne(() => Trainer, { nullable: true, eager: true })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column({ nullable: true })
  trainerId: number;

  @ManyToOne(() => Room, { nullable: true, eager: true })
  @JoinColumn({ name: 'roomId' })
  roomEntity: Room;

  @Column({ nullable: true })
  roomId: number;

  @ManyToOne(() => TimeSlot, { nullable: true, eager: true })
  @JoinColumn({ name: 'timeSlotId' })
  timeSlotEntity: TimeSlot;

  @Column({ nullable: true })
  timeSlotId: number;

  @Column({ type: 'simple-array', nullable: true })
  schoolLevels: string[]; // Niveaux scolaires acceptés

  @Column({ type: 'simple-array', nullable: true })
  lyceeBranches: string[]; // Branches du lycée (si applicable)

  @Column({ type: 'varchar', nullable: true })
  subjectModule: string; // Matière/Module enseigné

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Session, (session) => session.course)
  sessions: Session[];
}
