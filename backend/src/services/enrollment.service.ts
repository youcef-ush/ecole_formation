import { AppDataSource } from "../config/database.config";
import { Enrollment } from "../entities/Enrollment.entity";
import { Student, StudentStatus } from "../entities/Student.entity";
import { Course } from "../entities/Course.entity";
import { Payment, PaymentType, PaymentMethod } from "../entities/Payment.entity";
import { Installment, InstallmentStatus } from "../entities/Installment.entity";
import { QrCodeService } from "./qrcode.service";
import { TransactionModel } from "../models/transaction.model";
import { TransactionType, TransactionSource } from "../types/transaction.types";

export class EnrollmentService {
    private enrollmentRepo = AppDataSource.getRepository(Enrollment);
    private studentRepo = AppDataSource.getRepository(Student);
    private courseRepo = AppDataSource.getRepository(Course);
    private paymentRepo = AppDataSource.getRepository(Payment);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private qrCodeService = new QrCodeService();

    /**
     * Créer une inscription (formulaire initial)
     * enrollmentData = { firstName, lastName, email, phone, birthDate, address, courseId/courseIds, registrationFee }
     */
    async createEnrollment(enrollmentData: any) {
        // Vérifier si l'étudiant existe déjà
        let existingEnrollment;
        
        if (enrollmentData.birthDate) {
            // Vérifier par nom + prénom + date de naissance
            existingEnrollment = await this.enrollmentRepo.findOne({ 
                where: { 
                    firstName: enrollmentData.firstName,
                    lastName: enrollmentData.lastName,
                    birthDate: enrollmentData.birthDate
                } 
            });
        } else {
            // Vérifier par nom + prénom seulement
            existingEnrollment = await this.enrollmentRepo.findOne({ 
                where: { 
                    firstName: enrollmentData.firstName,
                    lastName: enrollmentData.lastName
                } 
            });
        }

        if (existingEnrollment) {
            throw new Error("Un étudiant avec le même nom et prénom existe déjà");
        }

        // Support pour un ou plusieurs cours
        let courseIds: number[] = [];
        let courseTitles: string[] = [];

        if (enrollmentData.courseIds && Array.isArray(enrollmentData.courseIds)) {
            // Multi-sélection
            courseIds = enrollmentData.courseIds;
        } else if (enrollmentData.courseId) {
            // Sélection unique (rétrocompatibilité)
            courseIds = [enrollmentData.courseId];
        }

        // Récupérer les titres des cours
        if (courseIds.length > 0) {
            const courses = await this.courseRepo.findByIds(courseIds);
            courseTitles = courses.map(c => c.title);
        }

        // Créer l'inscription avec les formations (array ou string)
        const enrollment = this.enrollmentRepo.create({
            firstName: enrollmentData.firstName,
            lastName: enrollmentData.lastName,
            email: enrollmentData.email,
            phone: enrollmentData.phone,
            birthDate: enrollmentData.birthDate || null,
            address: enrollmentData.address,
            courseId: courseIds.length > 0 ? courseIds[0] : null, // Premier cours pour compatibilité
            courseTitle: courseTitles.length > 0 ? courseTitles.join(', ') : null, // Titres séparés par virgule
            registrationFee: enrollmentData.registrationFee || 0,
            isRegistrationFeePaid: false
        });

        return await this.enrollmentRepo.save(enrollment);
    }

    /**
     * Marquer le paiement des frais d'inscription et créer automatiquement un Student
     */
    async markEnrollmentPaid(enrollmentId: number) {
        // Exécuter d'abord la transaction TypeORM
        const result = await AppDataSource.manager.transaction(async (manager) => {
            // 1. Récupérer l'enrollment
            const enrollment = await manager.findOne(Enrollment, { where: { id: enrollmentId } });
            if (!enrollment) {
                throw new Error("Enrollment not found");
            }

            if (enrollment.isRegistrationFeePaid) {
                throw new Error("Enrollment already paid");
            }

            // 2. Marquer comme payé
            enrollment.isRegistrationFeePaid = true;
            enrollment.registrationFeePaidAt = new Date();
            await manager.save(Enrollment, enrollment);

            // 3. Créer automatiquement le Student avec QR code AVANT le paiement
            const course = await manager.findOne(Course, { where: { id: enrollment.courseId! } });
            if (!course) {
                throw new Error("Course not found");
            }

            // Créer le Student d'abord (sans QR)
            const student = manager.create(Student, {
                enrollmentId: enrollment.id,
                qrCode: "", // Temporaire - sera mis à jour après
                courseId: course.id,
                status: StudentStatus.ACTIVE,
                isActive: true
            });

            const savedStudent = await manager.save(Student, student);

            // 4. Générer le badge QR maintenant qu'on a l'ID de Student
            const qrCodeData = await this.qrCodeService.generateStudentBadge(savedStudent.id);
            savedStudent.qrCode = qrCodeData.qrCode;
            savedStudent.badgeQrCode = qrCodeData.badgeQrCode;
            
            // Sauvegarder l'étudiant avec les QR codes
            await manager.save(Student, savedStudent);

            // 5. Créer l'enregistrement du paiement avec le student_id
            if (enrollment.registrationFee && enrollment.registrationFee > 0) {
                const payment = manager.create(Payment, {
                    studentId: savedStudent.id,
                    amount: enrollment.registrationFee,
                    paymentMethod: PaymentMethod.CASH,
                    paymentType: PaymentType.REGISTRATION,
                    paymentDate: new Date(),
                    description: `Frais d'inscription - ${enrollment.firstName} ${enrollment.lastName}`
                });
                await manager.save(Payment, payment);
            }

            return { enrollment, student: savedStudent };
        });

        // 6. APRÈS que la transaction TypeORM soit commitée, créer la transaction financière
        if (result.enrollment.registrationFee && result.enrollment.registrationFee > 0) {
            try {
                await TransactionModel.create({
                    type: TransactionType.INCOME,
                    source: TransactionSource.REGISTRATION_FEE,
                    amount: result.enrollment.registrationFee,
                    description: `Frais d'inscription - ${result.enrollment.firstName} ${result.enrollment.lastName}`,
                    transactionDate: new Date(),
                    studentId: result.student.id,
                });
            } catch (error) {
                console.error('Erreur lors de la création de la transaction financière:', error);
                // Ne pas faire échouer l'inscription si la transaction financière échoue
            }
        }

        return result;
    }

    /**
     * Lister toutes les inscriptions
     */
    async getAllEnrollments() {
        return await this.enrollmentRepo.find({
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Récupérer une inscription par ID
     */
    async getEnrollmentById(id: number) {
        const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
        if (!enrollment) {
            throw new Error("Enrollment not found");
        }

        // Vérifier si un student a été créé pour cet enrollment
        const student = await this.studentRepo.findOne({
            where: { enrollmentId: id },
            relations: ['course']
        });

        return { enrollment, student };
    }

    /**
     * Mettre à jour une inscription
     */
    async updateEnrollment(id: number, updateData: Partial<Enrollment>) {
        const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
        if (!enrollment) {
            throw new Error("Enrollment not found");
        }

        // Gérer les champs date vides (convertir "" en null)
        if ('birthDate' in updateData && updateData.birthDate === '') {
            updateData.birthDate = null as any;
        }

        Object.assign(enrollment, updateData);
        return await this.enrollmentRepo.save(enrollment);
    }

    /**
     * Supprimer une inscription
     */
    async deleteEnrollment(id: number) {
        const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
        if (!enrollment) {
            throw new Error("Enrollment not found");
        }

        // Si un student existe, ne pas permettre la suppression
        const student = await this.studentRepo.findOne({ where: { enrollmentId: id } });
        if (student) {
            throw new Error("Cannot delete enrollment: Student already created");
        }

        await this.enrollmentRepo.remove(enrollment);
        return { message: "Enrollment deleted successfully" };
    }
}
