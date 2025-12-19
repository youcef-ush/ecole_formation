import { AppDataSource } from "../config/database.config";
import { In } from "typeorm";
import { AccessLog, AccessStatus } from "../entities/AccessLog.entity";
import { Student, StudentStatus } from "../entities/Student.entity";
import { Course } from "../entities/Course.entity";
import { Enrollment } from "../entities/Enrollment.entity";
import { Installment, InstallmentStatus } from "../entities/Installment.entity";

export class AccessService {
    private logRepo = AppDataSource.getRepository(AccessLog);
    private studentRepo = AppDataSource.getRepository(Student);
    private installmentRepo = AppDataSource.getRepository(Installment);

    async scan(qrCode: string, courseId: number) {
        console.log(`[AccessService] Scan request - QR: "${qrCode}", CourseID: ${courseId}`);

        // 1. Identify Student
        const student = await this.studentRepo.findOne({ 
            where: { qrCode },
            relations: ['enrollment', 'course', 'paymentPlan']
        });

        if (!student) {
            console.log(`[AccessService] Student not found for QR: "${qrCode}"`);
            return this.logAccess(null, courseId, AccessStatus.DENIED, "QR Code inconnu");
        }

        const studentName = student.enrollment 
            ? `${student.enrollment.firstName} ${student.enrollment.lastName}`
            : `Student #${student.id}`;

        console.log(`[AccessService] Found Student: ${studentName} (ID: ${student.id})`);

        // 2. Vérifier que l'étudiant est dans le bon cours
        if (student.courseId !== courseId) {
            console.log(`[AccessService] Student is enrolled in course ${student.courseId}, not ${courseId}`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Non inscrit à ce cours");
        }

        // 3. Vérifier le statut de l'étudiant
        if (student.status === StudentStatus.CANCELLED) {
            console.log(`[AccessService] Student cancelled`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Inscription annulée");
        }

        if (student.status === StudentStatus.PENDING) {
            console.log(`[AccessService] Student pending payment`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Inscription en attente de paiement");
        }

        if (!student.isActive) {
            console.log(`[AccessService] Student inactive`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Compte inactif");
        }

        // 4. CHECK FINANCE: Vérifier les échéances impayées
        if (student.paymentPlanId) {
            const overdueInstallments = await this.installmentRepo.find({
                where: {
                    paymentPlanId: student.paymentPlanId,
                    status: InstallmentStatus.PENDING
                },
                order: { dueDate: 'ASC' }
            });

            const today = new Date();
            const actuallyOverdue = overdueInstallments.filter(inst => {
                const dueDate = new Date(inst.dueDate);
                return dueDate < today;
            });

            if (actuallyOverdue.length > 0) {
                const totalDebt = actuallyOverdue.reduce((sum, inst) => sum + Number(inst.amount), 0);
                console.log(`[AccessService] Access DENIED - Debt: ${totalDebt} DA`);
                return this.logAccess(student.id, courseId, AccessStatus.DENIED, `Dette impayée: ${totalDebt} DA`);
            }
        }

        // 5. ALL GREEN -> GRANTED
        console.log(`[AccessService] Access GRANTED for ${studentName}`);
        return this.logAccess(student.id, courseId, AccessStatus.GRANTED, "Bienvenue");
    }

    private async logAccess(studentId: number | null, courseId: number, status: AccessStatus, reason?: string) {
        const log = new AccessLog();
        if (studentId) log.studentId = studentId;
        log.courseId = courseId;
        log.status = status;
        log.denialReason = reason;

        await this.logRepo.save(log);

        return {
            allowed: status === AccessStatus.GRANTED,
            status,
            reason,
            studentId
        };
    }

    async getHistory(limit: number = 20) {
        return this.logRepo.find({
            order: { accessTime: "DESC" },
            take: limit,
            relations: ["student", "student.enrollment", "course"]
        });
    }
}
