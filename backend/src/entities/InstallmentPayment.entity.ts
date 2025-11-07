import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Registration } from './Registration.entity'

@Entity('installment_payments')
export class InstallmentPayment {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Registration, registration => registration.installmentPayments)
  registration!: Registration

  @Column()
  installmentNumber!: number

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number

  @Column({ type: 'date' })
  dueDate!: Date

  @Column({ type: 'date', nullable: true })
  paymentDate!: Date | null

  @Column({ nullable: true })
  paymentMethod!: string | null

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PAID', 'OVERDUE'],
    default: 'PENDING'
  })
  status!: 'PENDING' | 'PAID' | 'OVERDUE'

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
