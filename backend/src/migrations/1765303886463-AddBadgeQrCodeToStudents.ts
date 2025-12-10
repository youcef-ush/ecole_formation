import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBadgeQrCodeToStudents1765303886463 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS "badge_qr_code" TEXT;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE students 
            DROP COLUMN IF EXISTS "badge_qr_code";
        `);
    }

}
