
import { Request, Response } from 'express';
import { AccessService } from '../services/access.service';

export class ScanController {
    private accessService = new AccessService();

    scan = async (req: Request, res: Response) => {
        try {
            const { qrCode, courseId } = req.body;

            if (!qrCode || !courseId) {
                return res.status(400).json({ message: "QR Code and Course ID are required" });
            }

            const result = await this.accessService.scan(qrCode, Number(courseId));

            if (result.allowed) {
                return res.status(200).json(result);
            } else {
                return res.status(403).json(result); // Forbidden
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    };

    getHistory = async (req: Request, res: Response) => {
        try {
            const history = await this.accessService.getHistory();
            res.status(200).json(history);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };
}
