import { AppDataSource } from './src/config/database.config';
import { StudentPaymentPlan } from './src/entities/StudentPaymentPlan.entity';

async function checkData() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const repo = AppDataSource.getRepository(StudentPaymentPlan);
    const plans = await repo.find({
      relations: ['student', 'paymentPlan', 'installments']
    });

    console.log(`📊 Found ${plans.length} StudentPaymentPlans:`);
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ID: ${plan.id}, Student: ${plan.student?.enrollment?.firstName} ${plan.student?.enrollment?.lastName}, PaymentPlan: ${plan.paymentPlan?.name}`);
      console.log(`   Installments: ${plan.installments?.length || 0}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();