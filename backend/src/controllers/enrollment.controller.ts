
import { Request, Response } from 'express';
import { EnrollmentService } from '../services/enrollment.service';

export class EnrollmentController {
    private enrollmentService = new EnrollmentService();

    create = async (req: Request, res: Response) => {
        try {
            const { studentId, courseId, paymentPlanId, startDate } = req.body;

            if (!studentId || !courseId || !paymentPlanId) {
                return res.status(400).json({ message: "Student, Course, and Payment Plan IDs are required" });
            }

            const enrollment = await this.enrollmentService.createEnrollment(
                Number(studentId),
                Number(courseId),
                Number(paymentPlanId),
                startDate ? new Date(startDate) : new Date()
            );

            return res.status(201).json(enrollment);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    };

    getByStudent = async (req: Request, res: Response) => {
        try {
            const { studentId } = req.params;
            const enrollments = await this.enrollmentService.getStudentEnrollments(Number(studentId));
            res.status(200).json(enrollments);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };
}
