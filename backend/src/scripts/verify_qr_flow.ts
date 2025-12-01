
import { AppDataSource } from '../config/database.config';
import { QrCodeService } from '../services/qrcode.service';
import { AttendanceService } from '../services/attendance.service';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';
import { Course } from '../entities/Course.entity';
import { Trainer } from '../entities/Trainer.entity';
import { Room } from '../entities/Room.entity';
import { User } from '../entities/User.entity';

async function verifyQrFlow() {
    console.log('🚀 Starting QR Flow Verification...');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const qrService = new QrCodeService();
        const attendanceService = new AttendanceService();

        // 1. Create Dummy Data
        console.log('📝 Creating dummy data...');

        // Create User for Student
        const user = new User();
        user.email = `test.student.${Date.now()}@example.com`;
        user.password = 'password123';
        user.role = 'student' as any;
        await AppDataSource.manager.save(user);

        // Create Student
        const student = new Student();
        student.firstName = 'Test';
        student.lastName = 'Student';
        student.dateOfBirth = new Date('2000-01-01');
        student.phone = '1234567890';
        student.user = user;
        student.userId = user.id;
        await AppDataSource.manager.save(student);
        console.log(`👤 Student created: ${student.id}`);

        // Create Course
        const course = new Course();
        course.title = 'Test Course';
        course.description = 'Test Description';
        course.price = 1000;
        course.pricePerMonth = 1000;
        course.durationHours = 10;
        course.durationMonths = 1;
        await AppDataSource.manager.save(course);

        // Create User for Trainer
        const trainerUser = new User();
        trainerUser.email = `test.trainer.${Date.now()}@example.com`;
        trainerUser.password = 'password123';
        trainerUser.role = 'trainer' as any;
        await AppDataSource.manager.save(trainerUser);

        // Create Trainer
        const trainer = new Trainer();
        trainer.firstName = 'Test';
        trainer.lastName = 'Trainer';
        trainer.phone = '0123456789';
        trainer.specialties = ['Testing'];
        trainer.user = trainerUser;
        trainer.userId = trainerUser.id;
        await AppDataSource.manager.save(trainer);

        // Create Session
        const session = new Session();
        session.startDate = new Date();
        session.endDate = new Date();
        session.course = course;
        session.courseId = course.id;
        session.trainer = trainer;
        session.trainerId = trainer.id;
        session.location = 'Room 101';
        session.capacity = 20;
        await AppDataSource.manager.save(session);
        console.log(`📅 Session created: ${session.id}`);

        // 2. Generate Student Badge
        console.log('🎫 Generating Student Badge...');
        const badgeQr = await qrService.generateStudentBadge(student.id);
        console.log(`✅ Badge QR: ${badgeQr}`);

        // 3. Generate Session QR
        console.log('🎫 Generating Session QR...');
        const sessionQr = await qrService.generateSessionQr(session.id);
        console.log(`✅ Session QR: ${sessionQr}`);

        // 4. Validate Scan (Simulate Attendance)
        console.log('📸 Simulating QR Scan...');
        const result = await attendanceService.recordAttendance(
            sessionQr,
            badgeQr
        );

        console.log('✅ Attendance Result:', result);

        if (result.attendance.status === 'Présent') {
            console.log('🎉 SUCCESS: Attendance recorded as PRESENT');
        } else {
            console.error('❌ FAILURE: Unexpected status', result.attendance.status);
        }

    } catch (error: any) {
        console.error('❌ Error during verification:');
        console.error('Message:', error.message);
        console.error('Detail:', error.detail);
        console.error('Code:', error.code);
        console.error('Table:', error.table);
        console.error('Column:', error.column);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyQrFlow();
