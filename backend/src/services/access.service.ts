import { AppDataSource } from "../config/database.config";
import { In } from "typeorm";
import { AccessLog, AccessStatus } from "../entities/AccessLog.entity";
import { Student, StudentStatus } from "../entities/Student.entity";
import { Course } from "../entities/Course.entity";
import { Enrollment } from "../entities/Enrollment.entity";
import { Installment, InstallmentStatus } from "../entities/Installment.entity";
import { StudentAssignment } from "../entities/StudentAssignment.entity";

export class AccessService {
    private logRepo = AppDataSource.getRepository(AccessLog);
    private studentRepo = AppDataSource.getRepository(Student);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private studentAssignmentRepo = AppDataSource.getRepository(StudentAssignment);

    async scan(qrCode: string, courseId: number) {
        const cleanQrCode = qrCode.trim();
        console.log(`[AccessService] Scan request - QR: "${cleanQrCode}", CourseID: ${courseId}`);

        // 1. Identify Student
        let student = await this.studentRepo.findOne({ 
            where: { qrCode: cleanQrCode },
            relations: ['enrollment', 'course', 'studentPaymentPlans']
        });

        // Fallback: Si non trouvé, essayer de voir si c'est juste l'ID numérique (studentId ou enrollmentId)
        if (!student && !isNaN(Number(cleanQrCode))) {
            const id = Number(cleanQrCode);
            student = await this.studentRepo.findOne({
                where: [{ id: id }, { enrollmentId: id }],
                relations: ['enrollment', 'course', 'studentPaymentPlans']
            });
        }

        if (!student) {
            console.log(`[AccessService] Student not found for QR: "${qrCode}"`);
            // On ne peut pas logger si l'étudiant est inconnu car student_id est NOT NULL en DB
            return {
                allowed: false,
                status: AccessStatus.DENIED,
                reason: "QR Code inconnu",
                studentId: null
            };
        }

        const studentName = student.enrollment 
            ? `${student.enrollment.firstName} ${student.enrollment.lastName}`
            : `Student #${student.id}`;

        console.log(`[AccessService] Found Student: ${studentName} (ID: ${student.id})`);

        // 2. Vérifier l'affectation à la formation (Course)
        // On cherche l'affectation spécifique pour ce cours
        const assignment = await this.studentAssignmentRepo.findOne({
            where: { studentId: student.id, courseId: courseId },
            relations: ['installments']
        });

        if (!assignment) {
            console.log(`[AccessService] Student not assigned to course ${courseId}`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Non inscrit à cette formation");
        }

        // 3. Vérifier le statut de l'étudiant
        if (student.status === StudentStatus.CANCELLED) {
            console.log(`[AccessService] Student cancelled`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Inscription annulée");
        }

        if (!student.isActive) {
            console.log(`[AccessService] Student inactive`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Compte inactif");
        }

        // 4. CHECK FINANCE: Vérifier les échéances impayées pour CETTE formation
        const overdueInstallments = (assignment.installments || []).filter(inst =>
            inst.status === InstallmentStatus.PENDING
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0); // On compare uniquement les dates

        const actuallyOverdue = overdueInstallments.filter(inst => {
            const dueDate = new Date(inst.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            // On bloque si la date d'échéance est aujourd'hui ou déjà passée
            return dueDate <= today;
        });

        if (actuallyOverdue.length > 0) {
            const totalDebt = actuallyOverdue.reduce((sum, inst) => sum + Number(inst.amount), 0);
            console.log(`[AccessService] Access DENIED - Debt: ${totalDebt} DA for course ${courseId}`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, `Dette impayée: ${totalDebt} DA`);
        }

        // 5. ALL GREEN -> GRANTED
        console.log(`[AccessService] Access GRANTED for ${studentName} on course ${courseId}`);
        return this.logAccess(student.id, courseId, AccessStatus.GRANTED, "Bienvenue");
    }

    private async logAccess(studentId: number, courseId: number, status: AccessStatus, reason?: string) {
        const log = new AccessLog();
        log.studentId = studentId;
        log.courseId = courseId;
        log.status = status;
        log.denialReason = reason;
        log.accessTime = new Date(); // Fix: Set accessTime explicitly

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
