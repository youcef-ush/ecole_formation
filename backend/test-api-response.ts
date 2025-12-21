import { AppDataSource } from './src/config/database.config';
import { StudentAssignment } from './src/entities/StudentAssignment.entity';

async function testAPIResponse() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Simuler la requête API GET /api/students/1/assignments
    const assignmentRepo = AppDataSource.getRepository(StudentAssignment);

    const assignments = await assignmentRepo.find({
      where: { studentId: 1 },
      relations: ['course', 'paymentPlan', 'installments'],
      order: { createdAt: 'DESC' },
    });

    console.log('📋 API Response simulation:');
    console.log('Number of assignments:', assignments.length);

    assignments.forEach((assignment, index) => {
      console.log(`\n--- Assignment ${index + 1} ---`);
      console.log('ID:', assignment.id);
      console.log('Total Amount:', assignment.totalAmount);
      console.log('Status:', assignment.status);
      console.log('Installments count:', assignment.installments?.length || 0);

      if (assignment.installments && assignment.installments.length > 0) {
        console.log('Installments:');
        assignment.installments.forEach((inst, i) => {
          console.log(`  ${i + 1}. Number: ${inst.installmentNumber}, Due: ${inst.dueDate}, Amount: ${inst.amount}, Status: ${inst.status}`);
        });

        // Simuler getNextInstallment
        const pending = assignment.installments
          .filter(i => i.status === 'PENDING')
          .sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            return dateA - dateB;
          });

        const nextInstallment = pending[0] || null;
        console.log('Next installment (simulated):', nextInstallment ? {
          number: nextInstallment.installmentNumber,
          dueDate: nextInstallment.dueDate,
          amount: nextInstallment.amount
        } : 'None');
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testAPIResponse();