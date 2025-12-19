import { AppDataSource } from "../config/database.config";
import { Payment, PaymentMethod, PaymentType } from "../entities/Payment.entity";
import { Installment, InstallmentStatus } from "../entities/Installment.entity";
import { Student } from "../entities/Student.entity";
import { PaymentPlan } from "../entities/PaymentPlan.entity";

export class PaymentService {
    private paymentRepo = AppDataSource.getRepository(Payment);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private studentRepo = AppDataSource.getRepository(Student);
    private planRepo = AppDataSource.getRepository(PaymentPlan);

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

            // Si c'est un paiement d'échéance, on marque les installments comme payés
            if (paymentType === PaymentType.INSTALLMENT && student.paymentPlanId) {
                await this.applyPaymentToInstallments(manager, student.paymentPlanId, amount);
            }

            return savedPayment;
        });
    }

    /**
     * Appliquer un paiement aux échéances non payées (ordre chronologique)
     */
    private async applyPaymentToInstallments(manager: any, paymentPlanId: number, amount: number) {
        // Récupérer les installments non payés, triés par date
        const unpaidInstallments = await manager.find(Installment, {
            where: {
                paymentPlanId: paymentPlanId,
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
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (!student || !student.paymentPlanId) {
            return [];
        }

        return await this.installmentRepo.find({
            where: { paymentPlanId: student.paymentPlanId },
            order: { dueDate: 'ASC' }
        });
    }
}
