import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { StudentPaymentPlan } from "./StudentPaymentPlan.entity";
import { StudentAssignment } from "./StudentAssignment.entity";
import { Installment } from "./Installment.entity";

// Types de plans de paiement
export enum PaymentPlanType {
  UNIQUE = "UNIQUE",           // Paiement unique (100% à l'inscription)
  MONTHLY = "MONTHLY",         // Mensuel (abonnement)
  INSTALLMENTS = "INSTALLMENTS", // Par tranches échelonnées
  CONSUMPTION = "CONSUMPTION"  // Pack de séances
}

// TEMPLATE de plan de paiement (réutilisable pour plusieurs étudiants)
@Entity("payment_plans")
export class PaymentPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: "varchar",
    length: 200,
    comment: "Nom du template (ex: 'Paiement 3 fois', 'Mensuel')"
  })
  name: string;

  @Column({ 
    type: "enum", 
    enum: PaymentPlanType, 
    default: PaymentPlanType.UNIQUE,
    comment: "Type de plan: UNIQUE, MONTHLY, INSTALLMENTS, CONSUMPTION"
  })
  type: PaymentPlanType;

  @Column({ 
    name: "installments_count",
    comment: "Nombre d'échéances/mois/tranches ou crédit de séances",
    default: 1
  })
  installmentsCount: number;

  @Column({ 
    type: "int",
    name: "interval_days",
    nullable: true,
    comment: "Pour type INSTALLMENTS: intervalle en jours entre échéances"
  })
  intervalDays?: number;

  @Column({ 
    type: "int",
    name: "day_of_month",
    nullable: true,
    default: 5,
    comment: "Pour type MONTHLY: jour du mois pour le paiement (1-31)"
  })
  dayOfMonth?: number;

  @Column({ 
    type: "text",
    nullable: true,
    comment: "Description du plan"
  })
  description?: string;

  // Relation avec les affectations aux étudiants
  @OneToMany(() => StudentPaymentPlan, (spp) => spp.paymentPlan)
  studentPaymentPlans: StudentPaymentPlan[];

  @OneToMany(() => StudentAssignment, (assignment) => assignment.paymentPlan)
  studentAssignments: StudentAssignment[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
