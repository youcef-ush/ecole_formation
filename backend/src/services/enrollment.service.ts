
import { AppDataSource } from "../config/database.config"; // Assuming server.ts exports AppDataSource
import { Enrollment, EnrollmentStatus } from "../entities/Enrollment.entity";
import { Student } from "../entities/Student.entity";
import { Course, PriceModel } from "../entities/Course.entity";
import { Payment, PaymentType } from "../entities/Payment.entity";
import { PaymentPlan } from "../entities/PaymentPlan.entity";
import { Installment } from "../entities/Installment.entity";
import { QrCodeService } from "./qrcode.service";

export class EnrollmentService {
    private enrollmentRepo = AppDataSource.getRepository(Enrollment);
    private studentRepo = AppDataSource.getRepository(Student);
    private courseRepo = AppDataSource.getRepository(Course);
    private planRepo = AppDataSource.getRepository(PaymentPlan);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private qrCodeService = new QrCodeService();

    // Transactional multi-course enrollment
    async createEnrollments(
        studentId: number,
        courseIds: number[],
        paymentPlanId: number | null,
        startDate: Date = new Date(),
        registrationFee: number = 0
    ) {
        const result = await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
            // 1. Validate Student
            const student = await transactionalEntityManager.findOne(Student, { where: { id: studentId } });
            if (!student) throw new Error("Student not found");

            // 2. Validate Payment Plan (if provided)
            let plan: PaymentPlan | null = null;
            if (paymentPlanId) {
                plan = await transactionalEntityManager.findOne(PaymentPlan, { where: { id: paymentPlanId } });
                if (!plan) throw new Error("Payment plan not found");
            }

            const createdEnrollments: Enrollment[] = [];

            // 2.b Registration fee: create once BEFORE looping courses (if required)
            let registrationPayment: Payment | null = null;
            let isFeeProcessed = student.isRegistrationFeePaid;

            if (!isFeeProcessed && registrationFee > 0) {
                // Mark student as paid and create the payment (not yet linked to an enrollment)
                student.isRegistrationFeePaid = true;
                await transactionalEntityManager.save(Student, student);

                const payment = new Payment();
                payment.enrollment = null; // Link later to the first enrollment created
                payment.amount = registrationFee;
                payment.paymentDate = new Date();
                payment.method = "CASH";
                payment.type = PaymentType.REGISTRATION_FEE;
                payment.note = "Frais d'inscription (Validation)";

                registrationPayment = await transactionalEntityManager.save(Payment, payment);
                isFeeProcessed = true;
            }

            // 3. Loop through courses and create enrollments
            for (let i = 0; i < courseIds.length; i++) {
                const courseId = courseIds[i];
                const course = await transactionalEntityManager.findOne(Course, { where: { id: courseId } });
                if (!course) throw new Error(`Course with ID ${courseId} not found`);

                // Prevent duplicate active enrollment for this student+course
                const existing = await transactionalEntityManager.findOne(Enrollment, { where: { studentId: student.id, courseId: courseId, status: EnrollmentStatus.ACTIVE } });
                if (existing) {
                    throw new Error(`Student already enrolled in course ID ${courseId}`);
                }

                // Create Enrollment
                const enrollment = new Enrollment();
                enrollment.student = student;
                enrollment.course = course;
                if (plan) {
                    enrollment.paymentPlan = plan;
                }
                enrollment.startDate = this.formatDate(startDate);
                enrollment.status = EnrollmentStatus.ACTIVE;

                // Logic for Packs
                if (course.type === "PACK_HEURES") {
                    enrollment.remainingUsage = 10; // Default placeholder
                }

                // Save enrollment
                const savedEnrollment = await transactionalEntityManager.save(Enrollment, enrollment);
                createdEnrollments.push(savedEnrollment);

                // If a registration payment was created earlier, link it to the first created enrollment
                if (registrationPayment && registrationPayment.enrollmentId == null) {
                    registrationPayment.enrollment = savedEnrollment;
                    registrationPayment = await transactionalEntityManager.save(Payment, registrationPayment);
                }

                // 5. Generate Installments (if plan exists)
                if (plan) {
                    await this.generateInstallmentsTransactional(transactionalEntityManager, savedEnrollment, course, plan);
                }
            }

            // 6. Generate QR Code (Validation)
            // We can call this after transaction, but doing it here ensures consistency.
            // Note: generateStudentBadge uses its own repository call. Ideally we should pass the manager,
            // but for now we can call it. If it fails, transaction rolls back?
            // Actually, generateStudentBadge does NOT take a manager, so it runs outside this transaction context.
            // However, since we committed the student update inside the transaction, wait...
            // If we are inside a transaction, the student update is not visible outside until commit.
            // So generateStudentBadge might see old data or block?
            // BETTER: Call generateStudentBadge AFTER the transaction block returns successfully.

            return createdEnrollments;
        });

        // Generate badge after successful transaction
        if (result && result.length > 0) {
            try {
                await this.qrCodeService.generateStudentBadge(studentId);
            } catch (error) {
                console.error("Failed to generate QR badge after enrollment:", error);
            }
        }

        return result;
    }

    // New helper for transactional installments
    private async generateInstallmentsTransactional(
        manager: any,
        enrollment: Enrollment,
        course: Course,
        plan: PaymentPlan
    ) {
        let installments: Installment[] = [];
        let installmentAmount = 0;

        if (course.priceModel === PriceModel.MONTHLY) {
            const contractValue = Number(course.totalPrice) * course.durationMonths;
            installmentAmount = contractValue / plan.installmentsCount;
        } else {
            const contractValue = Number(course.totalPrice);
            installmentAmount = contractValue / plan.installmentsCount;
        }

        // Note: Registration Fee is already handled separately. Do not add to first installment unless specified.
        // Current logic in generateInstallments added regFee. 
        // User requested: "Le paiement initial est unique... Le Plan de Paiement est géré par Enrollment"
        // So we should probably NOT add the registration fee to the installments again if it was paid separately.
        // I will assume standard installments logic here without adding regFee again.

        const startObj = new Date(enrollment.startDate);

        for (let i = 0; i < plan.installmentsCount; i++) {
            const installment = new Installment();
            installment.enrollment = enrollment;

            const dueDate = new Date(startObj);
            dueDate.setDate(dueDate.getDate() + (i * plan.intervalDays));

            installment.dueDate = this.formatDate(dueDate);
            installment.amount = installmentAmount; // purely the course cost split
            installment.isPaid = false;

            installments.push(installment);
        }

        await manager.save(Installment, installments);
    }

    async createEnrollment(
        studentId: number,
        courseId: number,
        paymentPlanId: number | null,
        startDate: Date = new Date(),
        registrationFee: number = 0 // New parameter
    ) {
        // 1. Validate Entities
        const student = await this.studentRepo.findOneBy({ id: studentId });
        if (!student) throw new Error("Student not found");

        const course = await this.courseRepo.findOneBy({ id: courseId });
        if (!course) throw new Error("Course not found");

        // Prevent creating duplicate active enrollment for the same student and course
        const existing = await this.enrollmentRepo.findOne({
            where: {
                studentId: studentId,
                courseId: courseId,
                status: EnrollmentStatus.ACTIVE,
            },
        });

        if (existing) {
            throw new Error('Student already enrolled in this course');
        }

        let plan: PaymentPlan | null = null;
        if (paymentPlanId) {
            plan = await this.planRepo.findOneBy({ id: paymentPlanId });
            if (!plan) throw new Error("Payment plan not found");
        }

        // 2. Create Enrollment
        const enrollment = new Enrollment();
        enrollment.student = student;
        enrollment.course = course;
        if (plan) {
            enrollment.paymentPlan = plan;
        }
        enrollment.startDate = this.formatDate(startDate);
        enrollment.status = EnrollmentStatus.ACTIVE;

        // Logic for Packs: Initialize remaining usage
        if (course.type === "PACK_HEURES") {
            enrollment.remainingUsage = 10; // Default placeholder
        }

        // Save enrollment first to get ID
        const savedEnrollment = await this.enrollmentRepo.save(enrollment);

        // 3. Handle Registration Fee logic
        // Only process fee if student is NOT yet validated (isRegistrationFeePaid = false)
        if (!student.isRegistrationFeePaid) {
            student.isRegistrationFeePaid = true;
            await this.studentRepo.save(student);

            if (registrationFee > 0) {
                const payment = new Payment();
                payment.enrollment = savedEnrollment;
                payment.amount = registrationFee;
                payment.paymentDate = new Date();
                payment.method = "CASH"; // Default
                payment.type = PaymentType.REGISTRATION_FEE;
                payment.note = "Frais d'inscription (Validation)";

                // Need to import PaymentRepo or use manager
                // Since I didn't inject paymentRepo, let's use AppDataSource
                const paymentRepo = AppDataSource.getRepository(Payment);
                await paymentRepo.save(payment);
            }
        }

        // 4. Generate Installments only if payment plan exists
        if (plan) {
            await this.generateInstallments(savedEnrollment, course, plan);
        }

        return savedEnrollment;
    }

    private async generateInstallments(
        enrollment: Enrollment,
        course: Course,
        plan: PaymentPlan
    ) {
        let installments: Installment[] = [];
        let totalAmountToSplit = Number(course.totalPrice);

        // Logic: How to split?
        // If PriceModel is MONTHLY: Total = Price * Duration
        // If PriceModel is GLOBAL: Total = Price

        // Note: In our Schema, 'total_price' is the base.
        // If course is MONTHLY, usually total_price is 'Price Per Month'.
        // Let's refine the logic based on common sense of the schema.

        let installmentAmount = 0;

        if (course.priceModel === PriceModel.MONTHLY) {
            // If model is monthly, the total contract value is Price * Duration
            // But the PLAN dictates how we pay.
            // Usually "Mensuel" plan matches "Mensuel" price.
            // Let's simplify: The User selects a Plan that dictates the installments.
            // We divide the TOTAL COST by the Plan's count.

            // Calc Total Contract Value
            const contractValue = Number(course.totalPrice) * course.durationMonths;
            installmentAmount = contractValue / plan.installmentsCount;
        } else {
            // Global Price
            const contractValue = Number(course.totalPrice);
            installmentAmount = contractValue / plan.installmentsCount;
        }

        // Handling Registration Fees as a separate added cost or included?
        // Let's assume Registration Fee is added to the FIRST installment.
        const regFee = Number(course.registrationFee) || 0;
        const startObj = new Date(enrollment.startDate);

        for (let i = 0; i < plan.installmentsCount; i++) {
            const installment = new Installment();
            installment.enrollment = enrollment;

            // Calculate Due Date
            const dueDate = new Date(startObj);
            dueDate.setDate(dueDate.getDate() + (i * plan.intervalDays));

            installment.dueDate = this.formatDate(dueDate);

            // Calculate Amount
            let amount = installmentAmount;
            if (i === 0) {
                amount += regFee; // Add fee to first payment
            }

            installment.amount = amount;
            installment.isPaid = false;

            installments.push(installment);
        }

        await this.installmentRepo.save(installments);
    }

    private formatDate(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    async getStudentEnrollments(studentId: number) {
        return this.enrollmentRepo.find({
            where: { studentId },
            relations: ["course", "paymentPlan", "installments", "payments"],
            order: { startDate: "DESC" }
        });
    }

    async getAllEnrollments() {
        return this.enrollmentRepo.find({
            relations: ["student", "course", "paymentPlan", "installments"],
            order: { startDate: "DESC" }
        });
    }

    async createStudent(studentData: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        birthDate: string;
        address: string;
    }): Promise<Student> {
        const student = this.studentRepo.create({
            ...studentData,
            qrCode: `temp_${Date.now()}`, // Temporary QR code
        });
        return this.studentRepo.save(student);
    }

    async updateEnrollmentStatus(enrollmentId: number, status: string) {
        const enrollment = await this.enrollmentRepo.findOneBy({ id: enrollmentId });
        if (!enrollment) throw new Error("Enrollment not found");

        enrollment.status = status as EnrollmentStatus;
        return this.enrollmentRepo.save(enrollment);
    }
}

