import { AppDataSource } from './src/config/database.config';
import { StudentAssignment } from './src/entities/StudentAssignment.entity';

async function testEndpoint() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Vérifier qu'il y a des StudentAssignment
    const assignments = await AppDataSource.getRepository(StudentAssignment).find({
      take: 5,
      relations: ['installments']
    });

    console.log('📋 Found assignments:', assignments.length);
    assignments.forEach((assignment, index) => {
      console.log(`Assignment ${index + 1}: ID=${assignment.id}, Installments=${assignment.installments?.length || 0}`);
    });

    // Tester la création d'installments
    if (assignments.length > 0) {
      const testAssignment = assignments[0];
      console.log('🧪 Testing createInstallments for assignment ID:', testAssignment.id);

      const testInstallments = [
        {
          installmentNumber: 1,
          dueDate: '2025-01-15',
          amount: 500.00
        },
        {
          installmentNumber: 2,
          dueDate: '2025-02-15',
          amount: 500.00
        }
      ];

      // Simuler ce que fait le contrôleur
      const installmentRepo = AppDataSource.getRepository('Installment');

      // Supprimer les installments existants
      if (testAssignment.installments && testAssignment.installments.length > 0) {
        console.log('🗑️ Removing existing installments:', testAssignment.installments.length);
        await installmentRepo.remove(testAssignment.installments);
      }

      // Créer les nouveaux installments
      console.log('📝 Creating new installments:', testInstallments.length);
      const newInstallments = testInstallments.map((inst: any, index: number) => ({
        studentAssignmentId: testAssignment.id,
        installmentNumber: inst.installmentNumber || (index + 1),
        dueDate: inst.dueDate,
        amount: inst.amount,
        status: 'PENDING'
      }));

      console.log('💾 Saving installments...');
      const savedInstallments = await installmentRepo.save(newInstallments);
      console.log('✅ Successfully created installments:', savedInstallments.length);

      console.log('🎉 Test completed successfully!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testEndpoint();