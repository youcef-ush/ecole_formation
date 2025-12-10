import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { QrCodeService } from '../services/qrcode.service';

async function regenerateQrCodes() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const studentRepository = AppDataSource.getRepository(Student);
    const qrCodeService = new QrCodeService();

    // Get all students
    const students = await studentRepository.find();
    console.log(`Found ${students.length} students`);

    let updated = 0;
    for (const student of students) {
      try {
        console.log(`Regenerating QR code for ${student.firstName} ${student.lastName} (ID: ${student.id})`);
        await qrCodeService.generateStudentBadge(student.id);
        updated++;
      } catch (error) {
        console.error(`Failed to generate QR code for student ${student.id}:`, error);
      }
    }

    console.log(`✅ Successfully regenerated QR codes for ${updated}/${students.length} students`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error regenerating QR codes:', error);
    process.exit(1);
  }
}

regenerateQrCodes();