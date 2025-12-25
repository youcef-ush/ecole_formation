import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'eftg',
  database: process.env.DB_DATABASE || 'ecole_formation',
  synchronize: false, // Disabled to prevent crash on startup
  logging: process.env.NODE_ENV === 'development',
  entities: [process.env.NODE_ENV === 'production' ? 'dist/entities/**/*.entity.js' : 'src/entities/**/*.entity.ts'],
  migrations: [process.env.NODE_ENV === 'production' ? 'dist/migrations/**/*.js' : 'src/migrations/**/*.ts'],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    process.exit(1);
  }
};
