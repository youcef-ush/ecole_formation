const { AppDataSource } = require('./dist/config/database.config');
const { Student } = require('./dist/entities/Student.entity');

async function checkStudents() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');

    const repo = AppDataSource.getRepository(Student);
    const students = await repo.find();

    console.log('Students with QR codes:');
    students.forEach(s => {
      console.log(`ID: ${s.id}, Name: ${s.firstName} ${s.lastName}`);
      console.log(`  qrCode: ${s.qrCode ? s.qrCode.substring(0, 30) + '...' : 'null'}`);
      console.log(`  badgeQrCode length: ${s.badgeQrCode ? s.badgeQrCode.length : 0}`);
      console.log('---');
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStudents();