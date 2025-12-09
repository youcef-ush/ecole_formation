
import { AppDataSource } from "../config/database.config";
import { EnrollmentService } from "../services/enrollment.service";
import { PaymentService } from "../services/payment.service";
import { AccessService } from "../services/access.service";
import { Student } from "../entities/Student.entity";
import { Course, CourseType, PriceModel } from "../entities/Course.entity";
import { PaymentPlan } from "../entities/PaymentPlan.entity";
import { QrCodeService } from "../services/qrcode.service";

async function runVerification() {
    console.log("🚀 Starting Verification Script: Scan & Pay Logic...");

    // Wait for DB to be initialized by server import or init explicitly
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const enrollmentService = new EnrollmentService();
    const paymentService = new PaymentService();
    const accessService = new AccessService();
    const qrService = new QrCodeService();

    const studentRepo = AppDataSource.getRepository(Student);
    const courseRepo = AppDataSource.getRepository(Course);
    const planRepo = AppDataSource.getRepository(PaymentPlan);

    try {
        // 1. Setup Data
        console.log("\n--- 1. Setting up Test Data ---");

        // Create Student
        const student = new Student();
        student.firstName = "Test";
        student.lastName = "Student";
        student.qrCode = "TEMP-QR-" + Date.now(); // Will be updated by service
        const savedStudent = await studentRepo.save(student);

        // Generate Valid QR
        await qrService.generateStudentBadge(savedStudent.id);
        const refreshedStudent = await studentRepo.findOneBy({ id: savedStudent.id }) as Student;
        console.log(`Student Created: ${refreshedStudent.firstName} (QR: ${refreshedStudent.qrCode})`);

        // Create Course (3 Months, 30000 DA)
        const course = new Course();
        course.title = "Test Course 3 Months";
        course.totalPrice = 30000;
        course.durationMonths = 3;
        course.type = CourseType.ABONNEMENT;
        course.priceModel = PriceModel.GLOBAL;
        const savedCourse = await courseRepo.save(course);
        console.log(`Course Created: ${savedCourse.title}`);

        // Create Payment Plan (3 Tranches)
        const plan = new PaymentPlan();
        plan.name = "3 Tranches Test";
        plan.installmentsCount = 3;
        plan.intervalDays = 30;
        const savedPlan = await planRepo.save(plan);
        console.log(`Plan Created: ${savedPlan.name}`);

        // 2. Enrollment
        console.log("\n--- 2. Enrollment ---");
        const enrollment = await enrollmentService.createEnrollment(savedStudent.id, savedCourse.id, savedPlan.id);
        console.log(`Enrollment ID: ${enrollment.id}`);
        console.log(`Installments Generated: ${enrollment.installments?.length || "Checked via Service"}`);

        // 3. Scan Check 1 (Should Fail - Unpaid)
        console.log("\n--- 3. Scan Attempt 1 (Unpaid) ---");
        // The first installment is DUE TODAY (enrollment date).
        const scan1 = await accessService.scan(refreshedStudent.qrCode, savedCourse.id);
        console.log(`Scan Result: ${scan1.status} (${scan1.reason})`);

        if (scan1.status !== "DENIED") console.error("❌ TEST FAILED: Should be DENIED due to unpaid debt.");
        else console.log("✅ TEST PASSED: Access Denied correctly.");

        // 4. Payment
        console.log("\n--- 4. Making Payment ---");
        // Pay 10000 DA (Amount of 1 installment: 30000 / 3)
        await paymentService.processPayment(enrollment.id, 10000, "CASH");
        console.log("Payment of 10000 DA recorded.");

        // 5. Scan Check 2 (Should Pass)
        console.log("\n--- 5. Scan Attempt 2 (Paid) ---");
        const scan2 = await accessService.scan(refreshedStudent.qrCode, savedCourse.id);
        console.log(`Scan Result: ${scan2.status} (${scan2.reason})`);

        if (scan2.status !== "GRANTED") console.error("❌ TEST FAILED: Should be GRANTED after payment.");
        else console.log("✅ TEST PASSED: Access Granted correctly.");

    } catch (error) {
        console.error("❌ Verification Failed with Error:", error);
    } finally {
        process.exit();
    }
}

runVerification();
