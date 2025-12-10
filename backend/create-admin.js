const { AppDataSource } = require('./src/config/database.config');
const { User } = require('./src/entities/User.entity');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepo = AppDataSource.getRepository(User);

    // Check if admin exists
    const existingAdmin = await userRepo.findOne({ where: { email: 'admin@ecole.dz' } });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Password hashed');

    // Create admin user
    const admin = userRepo.create({
      email: 'admin@ecole.dz',
      password: hashedPassword,
      role: 'ADMIN'
    });

    await userRepo.save(admin);
    console.log('Admin user created successfully');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createAdmin();