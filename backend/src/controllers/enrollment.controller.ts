
import { Request, Response } from 'express';
import { EnrollmentService } from '../services/enrollment.service';

export class EnrollmentController {
    private enrollmentService = new EnrollmentService();

    create = async (req: Request, res: Response) => {
        try {
            const { studentId, courseId, paymentPlanId, startDate, studentData } = req.body;

            let finalStudentId = studentId;

            // If studentData provided, create new student
            if (studentData && !studentId) {
                const { firstName, lastName, phone, email } = studentData;
                if (!firstName || !lastName || !phone) {
                    return res.status(400).json({ message: "First name, last name, and phone are required for new student" });
                }
                const newStudent = await this.enrollmentService.createStudent({
                    firstName,
                    lastName,
                    phone,
                    email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                    birthDate: '2000-01-01', // Default
                    address: '',
                });
                finalStudentId = newStudent.id;
            }

            if (!finalStudentId || !courseId) {
                return res.status(400).json({ message: "Student and Course IDs are required" });
            }

            const enrollment = await this.enrollmentService.createEnrollment(
                Number(finalStudentId),
                Number(courseId),
                paymentPlanId ? Number(paymentPlanId) : null,
                startDate ? new Date(startDate) : new Date(),
                req.body.registrationFee ? Number(req.body.registrationFee) : 0
            );

            return res.status(201).json(enrollment);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const enrollments = await this.enrollmentService.getAllEnrollments();
            res.status(200).json(enrollments);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
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

    updateStatus = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ message: "Status is required" });
            }

            const enrollment = await this.enrollmentService.updateEnrollmentStatus(Number(id), status);
            res.status(200).json(enrollment);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };
}
