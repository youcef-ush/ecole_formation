import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRegistrationFeeToStudents1765303886464 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add is_registration_fee_paid to students table
        await queryRunner.addColumn("students", new TableColumn({
            name: "is_registration_fee_paid",
            type: "boolean",
            default: false
        }));

        // Add type to payments table
        // Note: We use varchar with default INSTALLMENT for simplicity and to match Entity definition
        await queryRunner.addColumn("payments", new TableColumn({
            name: "type",
            type: "varchar",
            default: "'INSTALLMENT'",
            length: "50"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("payments", "type");
        await queryRunner.dropColumn("students", "is_registration_fee_paid");
    }

}
