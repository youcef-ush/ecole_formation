
import { AppDataSource } from "../config/database.config";
import { In } from "typeorm";
import { AccessLog, AccessStatus } from "../entities/AccessLog.entity";
import { Student } from "../entities/Student.entity";
import { Course } from "../entities/Course.entity";
import { Enrollment } from "../entities/Enrollment.entity";
import { Installment } from "../entities/Installment.entity";

export class AccessService {
    private logRepo = AppDataSource.getRepository(AccessLog);
    private studentRepo = AppDataSource.getRepository(Student);
    private enrollmentRepo = AppDataSource.getRepository(Enrollment);
    private installmentRepo = AppDataSource.getRepository(Installment);

    async scan(qrCode: string, courseId: number) {
        console.log(`[AccessService] Scan request - QR: "${qrCode}", CourseID: ${courseId}`);

        // 1. Identify Student
        const student = await this.studentRepo.findOneBy({ qrCode });
        if (!student) {
            console.log(`[AccessService] Student not found for QR: "${qrCode}"`);
            return this.logAccess(null, courseId, AccessStatus.DENIED, "QR Code inconnu");
        }
        console.log(`[AccessService] Found Student: ${student.firstName} ${student.lastName} (ID: ${student.id})`);

        // 2. Find Active Enrollment for this Course
        console.log(`[AccessService] Locking for enrollment - StudentID: ${student.id}, CourseID: ${courseId}`);

        // Debug: Check ALL enrollments for this student
        const allEnrollments = await this.enrollmentRepo.find({ where: { studentId: student.id } });
        console.log(`[AccessService] All enrollments for student ${student.id}:`, allEnrollments.map(e => ({ id: e.id, courseId: e.courseId, status: e.status })));


        const enrollment = await this.enrollmentRepo.findOne({
            where: {
                studentId: student.id,
                courseId: courseId,
                status: In(["ACTIVE", "COMPLETED"]) as any
            },
            relations: ["installments", "course"]
        });

        if (!enrollment) {
            console.log(`[AccessService] No ACTIVE enrollment found for Student ${student.id} in Course ${courseId}`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Non inscrit ou inactif");
        }

        console.log(`[AccessService] Found Enrollment ID: ${enrollment.id}, Status: ${enrollment.status}`);

        // 3. CHECK 1: FINANCE (The Barrier)
        // Rule: Are there any installments DUE (past date) and NOT PAID?
        const today = new Date();
        const overdueInstallments = enrollment.installments.filter(inst => {
            const dueDate = new Date(inst.dueDate);
            const isOverdue = !inst.isPaid && dueDate < today;
            if (isOverdue) {
                console.log(`[AccessService] Overdue Installment: Due ${dueDate.toISOString()}, Amount ${inst.amount}`);
            }
            return isOverdue;
        });

        if (overdueInstallments.length > 0) {
            // Build reason string
            const totalDebt = overdueInstallments.reduce((sum, inst) => sum + Number(inst.amount), 0);
            console.log(`[AccessService] Access DENIED - Debt: ${totalDebt} DA`);
            return this.logAccess(student.id, courseId, AccessStatus.DENIED, `Dette impayée: ${totalDebt} DA`);
        }

        // 4. CHECK 2: USAGE (For Packs)
        if (enrollment.course.type === "PACK_HEURES") {
            if (enrollment.remainingUsage <= 0) {
                return this.logAccess(student.id, courseId, AccessStatus.DENIED, "Pack épuisé (0 crédits)");
            }

            // Consolidate Usage
            enrollment.remainingUsage -= 1;
            await this.enrollmentRepo.save(enrollment);
        }

        // 5. ALL GREEN -> GRANTED
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
            order: { scanTime: "DESC" },
            take: limit,
            relations: ["student", "course"]
        });
    }
}
