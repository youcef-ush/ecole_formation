
import { AppDataSource } from '../config/database.config';
import * as fs from 'fs';
import * as path from 'path';

async function runSqlMigrations() {
    console.log('🚀 Starting SQL Migrations...');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const migrationFiles = [
            'add_qr_fields_to_students.sql',
            'add_qr_fields_to_sessions.sql',
            'create_attendances_table.sql',
            'create_attendance_reports_table.sql',
            'fix_missing_student_columns.sql',
            'fix_missing_session_columns.sql'
        ];

        const migrationsDir = path.join(__dirname, '../../migrations');

        for (const file of migrationFiles) {
            console.log(`\n📄 Processing ${file}...`);
            const filePath = path.join(migrationsDir, file);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                continue;
            }

            const sql = fs.readFileSync(filePath, 'utf-8');

            try {
                await AppDataSource.query(sql);
                console.log(`✅ Successfully executed ${file}`);
            } catch (err: any) {
                console.error(`❌ Error executing ${file}:`, err.message);
            }
        }

        console.log('\n🏁 All migrations processed.');

    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

runSqlMigrations();
