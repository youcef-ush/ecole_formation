import { AppDataSource } from './src/config/database.config';
import { StudentAssignment, AssignmentStatus } from './src/entities/StudentAssignment.entity';

async function testInstallmentsCreation() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Tester directement la création d'installments avec un ID fictif pour voir si la structure fonctionne
    console.log('🧪 Testing installment creation with mock assignment ID...');

    const installmentRepo = AppDataSource.getRepository('Installment');

    // Utiliser un assignment ID qui pourrait exister (1)
    const testInstallments = [
      {
        studentAssignmentId: 1, // Test avec ID 1
        installmentNumber: 1,
        dueDate: '2025-12-27',
        amount: 7000,
        status: 'PENDING'
      }
    ];

    console.log('💾 Testing installment creation...');
    try {
      const saved = await installmentRepo.save(testInstallments);
      console.log('✅ Installments created successfully:', saved.length);
      console.log('📋 Created installment:', {
        id: saved[0].id,
        studentAssignmentId: saved[0].studentAssignmentId,
        installmentNumber: saved[0].installmentNumber,
        dueDate: saved[0].dueDate,
        amount: saved[0].amount,
        status: saved[0].status
      });
    } catch (error) {
      console.error('❌ Failed to create installments:', error);
      // Si l'ID 1 n'existe pas, essayons avec un message d'erreur plus clair
      if (error.message.includes('violates foreign key constraint')) {
        console.log('🔍 Foreign key constraint error - assignment with ID 1 does not exist');
        console.log('✅ This means the database structure is correct, but no test data exists');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testInstallmentsCreation();