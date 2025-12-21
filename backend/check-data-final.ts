import { AppDataSource } from './src/config/database.config';
import { StudentPaymentPlan } from './src/entities/StudentPaymentPlan.entity';
import { StudentAssignment } from './src/entities/StudentAssignment.entity';

async function checkData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Check StudentPaymentPlans
    const sppRepo = AppDataSource.getRepository(StudentPaymentPlan);
    const plans = await sppRepo.find({
      relations: ['student', 'paymentPlan', 'installments']
    });
    console.log(`📊 Found ${plans.length} StudentPaymentPlans:`);
    plans.forEach((plan, i) => {
      console.log(`${i+1}. ID: ${plan.id}, Student: ${plan.student?.enrollment?.firstName} ${plan.student?.enrollment?.lastName}, Installments: ${plan.installments?.length || 0}`);
    });

    // Check StudentAssignments
    const assignRepo = AppDataSource.getRepository(StudentAssignment);
    const assignments = await assignRepo.find({
      relations: ['student', 'course', 'paymentPlan']
    });
    console.log(`📋 Found ${assignments.length} StudentAssignments:`);
    assignments.forEach((assign, i) => {
      console.log(`${i+1}. ID: ${assign.id}, Student: ${assign.student?.enrollment?.firstName} ${assign.student?.enrollment?.lastName}, Course: ${assign.course?.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();