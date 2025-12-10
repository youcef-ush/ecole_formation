import { AppDataSource } from './config/database.config';
import { User, UserRole } from './entities/User.entity';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepo.findOne({ 
      where: { email: 'admin2@ecole.dz' } 
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin2@ecole.dz');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = userRepo.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin2@ecole.dz',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepo.save(adminUser);

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin2@ecole.dz');
    console.log('🔑 Password: admin123');
    console.log('\n🚀 You can now login to the frontend!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
