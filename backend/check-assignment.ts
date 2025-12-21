import { AppDataSource } from './src/config/database.config';
import { StudentAssignment } from './src/entities/StudentAssignment.entity';

async function checkAssignment() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Vérifier si l'assignment avec ID 1 existe
    const assignmentRepo = AppDataSource.getRepository(StudentAssignment);
    const assignment = await assignmentRepo.findOne({
      where: { id: 1 },
      relations: ['installments', 'student', 'course', 'paymentPlan']
    });

    if (assignment) {
      console.log('✅ Assignment with ID 1 exists:');
      console.log('📋 Details:', {
        id: assignment.id,
        studentId: assignment.studentId,
        courseId: assignment.courseId,
        paymentPlanId: assignment.paymentPlanId,
        totalAmount: assignment.totalAmount,
        status: assignment.status,
        installmentsCount: assignment.installments?.length || 0
      });

      if (assignment.installments && assignment.installments.length > 0) {
        console.log('📅 Installments:');
        assignment.installments.forEach(inst => {
          console.log(`  - ${inst.installmentNumber}: ${inst.dueDate} - ${inst.amount} DA (${inst.status})`);
        });
      }
    } else {
      console.log('❌ Assignment with ID 1 does not exist');
      console.log('📋 All existing assignments:');

      const allAssignments = await assignmentRepo.find({
        relations: ['student', 'course']
      });

      allAssignments.forEach(assignment => {
        console.log(`  - ID ${assignment.id}: Student ${assignment.student?.enrollment?.firstName} ${assignment.student?.enrollment?.lastName} - ${assignment.course?.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkAssignment();