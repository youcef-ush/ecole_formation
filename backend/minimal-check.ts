
import { AppDataSource } from "./src/config/database.config";
import { Enrollment } from "./src/entities/Enrollment.entity";
import { Student } from "./src/entities/Student.entity";

async function checkEnrollments() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected!");

        const student = await AppDataSource.getRepository(Student).findOneBy({ id: 1 });
        if (!student) {
            console.log("Student ID 1 not found!");
            return;
        }
        console.log(`Student: ${student.firstName} ${student.lastName}, QR: ${student.qrCode}`);

        const enrollments = await AppDataSource.getRepository(Enrollment).find({
            where: { studentId: 1 },
            relations: ["course"]
        });

        console.log(`Found ${enrollments.length} enrollments:`);
        enrollments.forEach(e => {
            console.log(`- Course ID: ${e.courseId} (${e.course?.title}) | Status: '${e.status}' | StartDate: ${e.startDate}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

checkEnrollments();
