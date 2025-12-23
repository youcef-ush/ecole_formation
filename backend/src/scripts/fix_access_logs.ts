import { AppDataSource } from '../config/database.config';
import * as fs from 'fs';
import * as path from 'path';

async function fixAccessLogs() {
    console.log('🚀 Starting Access Logs Fix...');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const migrationFile = 'add_status_to_access_logs.sql';
        const migrationsDir = path.join(__dirname, '../../migrations');
        const filePath = path.join(migrationsDir, migrationFile);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        console.log(`\n📄 Processing ${migrationFile}...`);
        const sql = fs.readFileSync(filePath, 'utf-8');

        try {
            await AppDataSource.query(sql);
            console.log(`✅ Successfully executed ${migrationFile}`);
        } catch (err: any) {
            console.error(`❌ Error executing ${migrationFile}:`, err.message);
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('👋 Database connection closed');
        }
    }
}

fixAccessLogs();
