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

        console.log('🔧 Fixing NULL values in users table...');

        await FixDataSource.query(`
      UPDATE users 
      SET first_name = 'Admin' 
      WHERE first_name IS NULL
    `);

        await FixDataSource.query(`
      UPDATE users 
      SET last_name = 'User' 
      WHERE last_name IS NULL
    `);

        console.log('✅ Database fixed successfully');
        await FixDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing database:', error);
        process.exit(1);
    }
};

fixDatabase();
