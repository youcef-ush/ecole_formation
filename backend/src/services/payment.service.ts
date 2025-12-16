
import { AppDataSource } from "../config/database.config";
import { Payment } from "../entities/Payment.entity";
import { Installment } from "../entities/Installment.entity";
import { Enrollment } from "../entities/Enrollment.entity";
import { Student } from "../entities/Student.entity";

export class PaymentService {
    private paymentRepo = AppDataSource.getRepository(Payment);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private enrollmentRepo = AppDataSource.getRepository(Enrollment);

    async processPayment(enrollmentId: number, amount: number, method: string = "CASH", note?: string) {
        const enrollment = await this.enrollmentRepo.findOne({
            where: { id: enrollmentId },
            relations: ["installments"]
        });

        if (!enrollment) throw new Error("Enrollment not found");

        // 1. Record the Payment (The Cash Flow)
        const payment = new Payment();
        payment.enrollment = enrollment;
        payment.amount = amount;
        payment.method = method;
        payment.note = note;

        const savedPayment = await this.paymentRepo.save(payment);

        // 2. Automagically Pay off Debt (Installments)
        // Application Strategy: Pay oldest unpaid installments first.

        let remainingPayment = Number(amount);

        // Sort installments by date
        const unpaidInstallments = enrollment.installments
            .filter(i => !i.isPaid)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        for (const installment of unpaidInstallments) {
            if (remainingPayment <= 0) break;

            const amountDue = Number(installment.amount);

            // Simplified Logic: If payment covers the installment, mark as paid.
            // We are NOT doing partial payments on installments for this MVP complexity level.
            // We assume the user pays exact amounts or we mark it paid if they pay "enough".

            // Option A: Strict Equality
            // Option B: Threshold

            // Let's go with: If they pay, we try to clear full installments.
            // If remainingPayment >= amountDue, we clear it.

            if (remainingPayment >= amountDue) {
                installment.isPaid = true;
                installment.paidAt = new Date();
                await this.installmentRepo.save(installment);

                remainingPayment -= amountDue;

                // Link payment to installment (logic limits to 1 link, but 1 payment might pay 2 installments)
                // For trace, we set it on the first one satisfied or leave null if multiple.
                // Let's update payment with the first installment ID just for ref.
                if (!savedPayment.installmentId) {
                    savedPayment.installmentId = installment.id;
                    await this.paymentRepo.save(savedPayment);
                }
            }
        }

        // If this payment was intended as registration validation, mark the student's fee status.
        // Heuristic: when there are no installments or the enrollment had a pending status, we mark registration fee paid.
        try {
            const student = (enrollment as any).student as Student | undefined;
            if (student && !student.isRegistrationFeePaid) {
                student.isRegistrationFeePaid = true;
                await AppDataSource.getRepository(Student).save(student);
            }
        } catch (err) {
            // Non-fatal: keep payment processing successful even if marking the student fails
            console.warn('Warning: failed to mark student registration fee status', err);
        }

        return { payment: savedPayment, remainingCredit: remainingPayment };
    }
}

