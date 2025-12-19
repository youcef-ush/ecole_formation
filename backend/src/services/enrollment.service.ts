import { AppDataSource } from "../config/database.config";
import { Enrollment } from "../entities/Enrollment.entity";
import { Student, StudentStatus } from "../entities/Student.entity";
import { Course } from "../entities/Course.entity";
import { Payment, PaymentType } from "../entities/Payment.entity";
import { PaymentPlan } from "../entities/PaymentPlan.entity";
import { Installment, InstallmentStatus } from "../entities/Installment.entity";
import { QrCodeService } from "./qrcode.service";

export class EnrollmentService {
    private enrollmentRepo = AppDataSource.getRepository(Enrollment);
    private studentRepo = AppDataSource.getRepository(Student);
    private courseRepo = AppDataSource.getRepository(Course);
    private paymentRepo = AppDataSource.getRepository(Payment);
    private planRepo = AppDataSource.getRepository(PaymentPlan);
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
        return await AppDataSource.manager.transaction(async (manager) => {
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

            // 3. Créer automatiquement le Student avec QR code
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

            return { enrollment, student: savedStudent };
        });
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

    /**
     * Créer un plan de paiement pour un étudiant
     */
    async createPaymentPlan(studentId: number, totalAmount: number, numberOfInstallments: number) {
        const student = await this.studentRepo.findOne({ where: { id: studentId } });
        if (!student) {
            throw new Error("Student not found");
        }

        return await AppDataSource.manager.transaction(async (manager) => {
            // Créer le plan de paiement
            const plan = manager.create(PaymentPlan, {
                studentId: studentId,
                totalAmount: totalAmount,
                numberOfInstallments: numberOfInstallments
            });

            const savedPlan = await manager.save(PaymentPlan, plan);

            // Générer les échéances
            const installmentAmount = totalAmount / numberOfInstallments;
            const installments: Installment[] = [];

            for (let i = 0; i < numberOfInstallments; i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i + 1); // Chaque mois

                const installment = manager.create(Installment, {
                    paymentPlanId: savedPlan.id,
                    installmentNumber: i + 1,
                    amount: installmentAmount,
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: InstallmentStatus.PENDING
                });

                installments.push(installment);
            }

            await manager.save(Installment, installments);

            // Lier le plan à l'étudiant
            student.paymentPlanId = savedPlan.id;
            await manager.save(Student, student);

            return { plan: savedPlan, installments };
        });
    }
}
