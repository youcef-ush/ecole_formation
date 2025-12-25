import { AppDataSource } from "../config/database.config";
import { In } from "typeorm";
import { Payment, PaymentMethod, PaymentType } from "../entities/Payment.entity";
import { Installment, InstallmentStatus } from "../entities/Installment.entity";
import { Student } from "../entities/Student.entity";
import { StudentAssignment } from "../entities/StudentAssignment.entity";
import { PaymentPlan, PaymentPlanType } from "../entities/PaymentPlan.entity";
import { TransactionModel } from "../models/transaction.model";
import { TransactionType, TransactionSource } from "../types/transaction.types";

export class PaymentService {
    private paymentRepo = AppDataSource.getRepository(Payment);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private studentRepo = AppDataSource.getRepository(Student);
    private studentAssignmentRepo = AppDataSource.getRepository(StudentAssignment);

    /**
     * Enregistrer un paiement pour un étudiant
     * paymentType: REGISTRATION, INSTALLMENT, SESSION
     */
    async processPayment(
        studentId: number,
        amount: number,
        paymentMethod: PaymentMethod = PaymentMethod.CASH,
        paymentType: PaymentType = PaymentType.REGISTRATION,
        description?: string
    ) {
        return await AppDataSource.manager.transaction(async (manager) => {
            const student = await manager.findOne(Student, { where: { id: studentId } });
            if (!student) {
                throw new Error("Student not found");
            }

            // Créer le paiement
            const payment = manager.create(Payment, {
                studentId: studentId,
                amount: amount,
                paymentMethod: paymentMethod,
                paymentType: paymentType,
                paymentDate: new Date(),
                description: description
            });

            const savedPayment = await manager.save(Payment, payment);

            // Créer une transaction financière automatiquement
            await TransactionModel.create({
                type: TransactionType.INCOME,
                source: paymentType === PaymentType.REGISTRATION 
                    ? TransactionSource.REGISTRATION_FEE 
                    : TransactionSource.PAYMENT_INSTALLMENT,
                amount: amount,
                description: description || `Paiement ${paymentType}`,
                transactionDate: new Date(),
                studentId: studentId,
            });

            // Si c'est un paiement d'échéance, appliquer aux assignments actifs
            if (paymentType === PaymentType.INSTALLMENT) {
                const activeAssignments = await manager.find(StudentAssignment, {
                    where: { studentId },
                    relations: ['installments']
                });

                if (activeAssignments.length > 0) {
                    // Collecter tous les installments IDs des assignments
                    const allInstallmentIds = activeAssignments.flatMap(assignment =>
                        assignment.installments?.map(inst => inst.id) || []
                    );

                    if (allInstallmentIds.length > 0) {
                        await this.applyPaymentToInstallments(manager, allInstallmentIds, amount);
                    }
                }
            }

            return savedPayment;
        });
    }

    /**
     * Appliquer un paiement aux échéances non payées (ordre chronologique)
     */
    private async applyPaymentToInstallments(manager: any, studentPaymentPlanIds: number[], amount: number) {
        // Récupérer les installments non payés, triés par date
        const unpaidInstallments = await manager.find(Installment, {
            where: {
                studentPaymentPlanId: In(studentPaymentPlanIds),
                status: InstallmentStatus.PENDING
            },
            order: { dueDate: 'ASC' }
        });

        let remainingAmount = amount;

        for (const installment of unpaidInstallments) {
            if (remainingAmount <= 0) break;

            const installmentAmount = Number(installment.amount);

            if (remainingAmount >= installmentAmount) {
                // Payer complètement cette échéance
                installment.status = InstallmentStatus.PAID;
                installment.paidDate = new Date();
                await manager.save(Installment, installment);

                remainingAmount -= installmentAmount;
            } else {
                // Paiement partiel (on ne marque pas comme payé)
                break;
            }
        }
    }

    /**
     * Obtenir l'historique des paiements d'un étudiant
     */
    async getStudentPayments(studentId: number) {
        return await this.paymentRepo.find({
            where: { studentId },
            order: { paymentDate: 'DESC' }
        });
    }

    /**
     * Obtenir tous les paiements
     */
    async getAllPayments() {
        return await this.paymentRepo.find({
            relations: ['student', 'student.enrollment', 'student.course'],
            order: { paymentDate: 'DESC' }
        });
    }

    /**
     * Obtenir le total des paiements d'un étudiant
     */
    async getStudentTotalPayments(studentId: number) {
        const payments = await this.paymentRepo.find({ where: { studentId } });
        return payments.reduce((total, payment) => total + Number(payment.amount), 0);
    }

    /**
     * Obtenir les échéances d'un étudiant
     */
    async getStudentInstallments(studentId: number) {
        const studentAssignments = await this.studentAssignmentRepo.find({
            where: { studentId },
            relations: ['installments']
        });

        if (studentAssignments.length === 0) {
            return [];
        }

        // Collecter tous les installments des assignments
        const allInstallments = studentAssignments.flatMap(assignment =>
            assignment.installments || []
        );

        // Trier par date d'échéance
        return allInstallments.sort((a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
    }

    /**
     * Traiter un paiement pour une échéance spécifique
     */
    async processInstallmentPayment(
        installmentId: number,
        amount: number,
        paymentMethod: PaymentMethod = PaymentMethod.CASH,
        description?: string
    ) {
        return await AppDataSource.manager.transaction(async (manager) => {
            // Récupérer l'échéance
            const installment = await manager.findOne(Installment, {
                where: { id: installmentId },
                relations: ['studentAssignment', 'studentAssignment.student', 'studentAssignment.paymentPlan']
            });

            if (!installment) {
                throw new Error("Installment not found");
            }

            if (installment.status === InstallmentStatus.PAID) {
                throw new Error("Installment is already paid");
            }

            // Créer le paiement
            const payment = manager.create(Payment, {
                studentId: installment.studentAssignment.studentId,
                amount: amount,
                paymentMethod: paymentMethod,
                paymentType: PaymentType.INSTALLMENT,
                paymentDate: new Date(),
                description: description || `Paiement échéance N°${installment.installmentNumber}`
            });

            const savedPayment = await manager.save(Payment, payment);

            // Créer une transaction financière automatiquement
            await TransactionModel.create({
                type: TransactionType.INCOME,
                source: TransactionSource.PAYMENT_INSTALLMENT,
                amount: amount,
                description: description || `Paiement échéance N°${installment.installmentNumber}`,
                transactionDate: new Date(),
                studentId: installment.studentAssignment.studentId,
            });

            // Mettre à jour le statut de l'échéance
            installment.status = InstallmentStatus.PAID;
            installment.paidDate = new Date();
            await manager.save(Installment, installment);

            // Créer la prochaine échéance si nécessaire
            const paymentPlan = installment.studentAssignment.paymentPlan;
            console.log('Payment plan type:', paymentPlan?.type, 'installmentsCount:', paymentPlan?.installmentsCount);
            if (paymentPlan) {
                if (paymentPlan.type === PaymentPlanType.INSTALLMENTS) {
                    console.log('Creating next INSTALLMENTS installment');
                    const nextInstallmentNumber = installment.installmentNumber + 1;
                    const nextDueDate = new Date(installment.dueDate);
                    nextDueDate.setDate(nextDueDate.getDate() + (paymentPlan.intervalDays || 30));

                    const installmentAmount = Number(installment.studentAssignment.totalAmount) / paymentPlan.installmentsCount;

                    const nextInstallment = manager.create(Installment, {
                        studentAssignmentId: installment.studentAssignmentId,
                        installmentNumber: nextInstallmentNumber,
                        amount: Number(installmentAmount.toFixed(2)),
                        dueDate: nextDueDate.toISOString().split('T')[0],
                        status: InstallmentStatus.PENDING
                    });

                    await manager.save(Installment, nextInstallment);
                } else if (paymentPlan.type === PaymentPlanType.MONTHLY) {
                    console.log('Creating next MONTHLY installment');
                    // Pour les plans mensuels, créer la prochaine échéance mensuelle
                    const nextDueDate = new Date(installment.dueDate);
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

                    const nextInstallmentNumber = installment.installmentNumber + 1;
                    const installmentAmount = Number(installment.studentAssignment.totalAmount) / (paymentPlan.installmentsCount || 12); // default 12 months

                    const nextInstallment = manager.create(Installment, {
                        studentAssignmentId: installment.studentAssignmentId,
                        installmentNumber: nextInstallmentNumber,
                        amount: Number(installmentAmount.toFixed(2)),
                        dueDate: nextDueDate.toISOString().split('T')[0],
                        status: InstallmentStatus.PENDING
                    });

                    await manager.save(Installment, nextInstallment);
                }
            }

            return {
                payment: savedPayment,
                installment: installment,
                message: "Payment processed successfully"
            };
        });
    }
}
