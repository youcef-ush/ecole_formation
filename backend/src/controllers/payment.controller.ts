
import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
    private paymentService = new PaymentService();

    create = async (req: Request, res: Response) => {
        try {
            const { enrollmentId, amount, method, note } = req.body;

            if (!enrollmentId || !amount) {
                return res.status(400).json({ message: "Enrollment ID and Amount are required" });
            }

            const result = await this.paymentService.processPayment(
                Number(enrollmentId),
                Number(amount),
                method || "CASH",
                note
            );

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    };
}
