
import { AppDataSource } from "../config/database.config"; // Assuming server.ts exports AppDataSource
import { Enrollment, EnrollmentStatus } from "../entities/Enrollment.entity";
import { Student } from "../entities/Student.entity";
import { Course, PriceModel } from "../entities/Course.entity";
import { PaymentPlan } from "../entities/PaymentPlan.entity";
import { Installment } from "../entities/Installment.entity";

export class EnrollmentService {
    private enrollmentRepo = AppDataSource.getRepository(Enrollment);
    private studentRepo = AppDataSource.getRepository(Student);
    private courseRepo = AppDataSource.getRepository(Course);
    private planRepo = AppDataSource.getRepository(PaymentPlan);
    private installmentRepo = AppDataSource.getRepository(Installment);

    async createEnrollment(
        studentId: number,
        courseId: number,
        paymentPlanId: number,
        startDate: Date = new Date()
    ) {
        // 1. Validate Entities
        const student = await this.studentRepo.findOneBy({ id: studentId });
        if (!student) throw new Error("Student not found");

        const course = await this.courseRepo.findOneBy({ id: courseId });
        if (!course) throw new Error("Course not found");

        const plan = await this.planRepo.findOneBy({ id: paymentPlanId });
        if (!plan) throw new Error("Payment plan not found");

        // 2. Create Enrollment
        const enrollment = new Enrollment();
        enrollment.student = student;
        enrollment.course = course;
        enrollment.paymentPlan = plan;
        enrollment.startDate = this.formatDate(startDate);
        enrollment.status = EnrollmentStatus.ACTIVE;

        // Logic for Packs: Initialize remaining usage
        if (course.type === "PACK_HEURES") {
            // Assuming a standard pack size or we could add 'pack_size' to course. 
            // For now, let's assume the course title might contain info or we default to 10 for packs if not specified.
            // Better: Add 'default_usage_limit' to Course entity. For this MVP, let's hardcode or derive.
            enrollment.remainingUsage = 10; // Default placeholder, or 0 if not needed
        }

        // Save enrollment first to get ID
        const savedEnrollment = await this.enrollmentRepo.save(enrollment);

        // 3. Generate Installments (The Financial Contract)
        await this.generateInstallments(savedEnrollment, course, plan);

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
}

