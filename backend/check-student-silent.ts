
import { DataSource } from "typeorm";
import { Student } from "./src/entities/Student.entity";
import { Enrollment } from "./src/entities/Enrollment.entity";
import { Course } from "./src/entities/Course.entity";
import { Payment } from "./src/entities/Payment.entity";
import { Installment } from "./src/entities/Installment.entity";
import { AccessLog } from "./src/entities/AccessLog.entity";
import { User } from "./src/entities/User.entity";
import * as dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "ecole_formation",
    entities: [Student, Enrollment, Course, Payment, Installment, AccessLog, User],
    synchronize: false,
    logging: false // DISABLE LOGGING
});

async function verifyStudentData() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected!");

        // 1. Check Student
        const student = await AppDataSource.getRepository(Student).findOneBy({ id: 1 });
        console.log("\n--- STUDENT ---");
        if (student) {
            console.log(`Found Student ID 1: ${student.firstName} ${student.lastName}`);
            console.log(`QR Code: ${student.qrCode}`);
        } else {
            console.error("Student ID 1 NOT FOUND!");
            return;
        }

        // 2. Check Enrollments
        const enrollments = await AppDataSource.getRepository(Enrollment).find({
            where: { studentId: 1 },
            relations: ["course"]
        });

        console.log("\n--- ENROLLMENTS (Inscriptions) ---");
        if (enrollments.length === 0) {
            console.log("No enrollments found for this student.");
        } else {
            enrollments.forEach(enr => {
                console.log(`\n- Enrollment ID: ${enr.id}`);
                console.log(`  Course: ${enr.course.title} (ID: ${enr.courseId})`);
                console.log(`  Status: ${enr.status}`); // Should be ACTIVE
                console.log(`  Start Date: ${enr.startDate}`);
            });
        }

        // 3. List All Courses (for reference)
        console.log("\n--- ALL COURSES ---");
        const courses = await AppDataSource.getRepository(Course).find();
        courses.forEach(c => {
            console.log(`ID: ${c.id} - ${c.title} (${c.type})`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyStudentData();
