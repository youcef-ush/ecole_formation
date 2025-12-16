import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const FixDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'eftg',
    database: process.env.DB_DATABASE || 'ecole_formation',
    synchronize: false, // IMPERATIVE: False to avoid triggering the error we are fixing
    logging: true,
    entities: [], // No entities needed for raw query
    migrations: [],
    subscribers: [],
});

const fixDatabase = async () => {
    try {
        await FixDataSource.initialize();
        console.log('✅ Connected to database (Sync Disabled)');

        const countBefore = await FixDataSource.query("SELECT count(*) FROM users WHERE first_name IS NULL");
        console.log(`VALUES BEFORE: ${JSON.stringify(countBefore)}`);

        await FixDataSource.query(`
      UPDATE users 
      SET first_name = 'Admin' || id
      WHERE first_name IS NULL
    `);

        await FixDataSource.query(`
      UPDATE users 
      SET last_name = 'User' 
      WHERE last_name IS NULL
    `);

        // Fix Email
        await FixDataSource.query(`
      UPDATE users 
      SET email = 'user' || id || '@example.com' 
      WHERE email IS NULL
    `);

        // Fix Password (dummy hash)
        await FixDataSource.query(`
      UPDATE users 
      SET password = '$2b$10$abcdefg...' 
      WHERE password IS NULL
    `);

        // MANUAL SCHEMA UPDATES (Bypassing Auto-Sync)
        console.log('🔧 Applying Manual Schema Updates...');

        // Add is_registration_fee_paid to students
        await FixDataSource.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS is_registration_fee_paid BOOLEAN DEFAULT false
    `);

        // Add type to payments
        await FixDataSource.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'INSTALLMENT'
    `);

        console.log('✅ Manual Schema Updates Applied');

        const countAfter = await FixDataSource.query("SELECT count(*) FROM users WHERE first_name IS NULL");
        console.log(`VALUES AFTER: ${JSON.stringify(countAfter)}`);

        console.log('✅ Database fixed successfully');
        await FixDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing database:', error);
        process.exit(1);
    }
};

fixDatabase();
