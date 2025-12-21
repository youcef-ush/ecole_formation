import { AppDataSource } from './src/config/database.config';
import { StudentPaymentPlan } from './src/entities/StudentPaymentPlan.entity';
import { StudentAssignment } from './src/entities/StudentAssignment.entity';

async function createMissingStudentPaymentPlans() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const sppRepo = AppDataSource.getRepository(StudentPaymentPlan);
    const assignRepo = AppDataSource.getRepository(StudentAssignment);

    // Trouver tous les assignments sans StudentPaymentPlan
    const assignments = await assignRepo.find({
      relations: ['student', 'course', 'paymentPlan']
    });

    console.log(`📋 Found ${assignments.length} assignments`);

    for (const assignment of assignments) {
      // Vérifier si un StudentPaymentPlan existe déjà
      const existingSPP = await sppRepo.findOne({
        where: {
          studentId: assignment.studentId,
          paymentPlanId: assignment.paymentPlanId
        }
      });

      if (!existingSPP) {
        console.log(`🔄 Creating StudentPaymentPlan for assignment ${assignment.id}`);

        const newSPP = sppRepo.create({
          studentId: assignment.studentId,
          paymentPlanId: assignment.paymentPlanId,
          totalAmount: assignment.totalAmount,
          status: 'ACTIVE'
        });

        await sppRepo.save(newSPP);
        console.log(`✅ Created StudentPaymentPlan ID: ${newSPP.id}`);
      } else {
        console.log(`⏭️ StudentPaymentPlan already exists for assignment ${assignment.id}`);
      }
    }

    // Vérifier le résultat final
    const finalSPP = await sppRepo.find({ relations: ['student', 'paymentPlan'] });
    console.log(`📊 Final count: ${finalSPP.length} StudentPaymentPlans`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createMissingStudentPaymentPlans();