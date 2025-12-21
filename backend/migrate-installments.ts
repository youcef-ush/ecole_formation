import { AppDataSource } from './src/config/database.config';

async function runMigration() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Vérifier la structure actuelle de la table installments
    console.log('🔍 Checking current table structure...');
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'installments'
      ORDER BY ordinal_position
    `);
    console.log('📋 Current columns:', columns);

    // 1. Vérifier si la colonne student_payment_plan_id existe
    const hasStudentPaymentPlanId = columns.some((col: any) => col.column_name === 'student_payment_plan_id');
    const hasStudentAssignmentId = columns.some((col: any) => col.column_name === 'student_assignment_id');
    const hasPaymentPlanId = columns.some((col: any) => col.column_name === 'payment_plan_id');

    console.log('🔍 Column analysis:', { hasStudentPaymentPlanId, hasStudentAssignmentId, hasPaymentPlanId });

    if (hasStudentPaymentPlanId) {
      // Migrer de student_payment_plan_id vers student_assignment_id
      console.log('🔄 Migrating from student_payment_plan_id to student_assignment_id...');

      // Renommer la colonne
      await AppDataSource.query('ALTER TABLE installments RENAME COLUMN student_payment_plan_id TO student_assignment_id');
      console.log('✅ Column renamed to student_assignment_id');

      // Supprimer l'ancien index
      await AppDataSource.query('DROP INDEX IF EXISTS idx_installments_student_payment_plan_id');
      console.log('✅ Old index dropped');

      // Créer le nouvel index
      await AppDataSource.query('CREATE INDEX idx_installments_student_assignment_id ON installments(student_assignment_id)');
      console.log('✅ New index created');

      // Supprimer l'ancienne FK
      await AppDataSource.query('ALTER TABLE installments DROP CONSTRAINT IF EXISTS fk_installments_student_payment_plan');
      console.log('✅ Old FK dropped');

      // Ajouter la nouvelle FK
      await AppDataSource.query(`
        ALTER TABLE installments
        ADD CONSTRAINT fk_installments_student_assignment
        FOREIGN KEY (student_assignment_id) REFERENCES student_assignments(id) ON DELETE CASCADE
      `);
      console.log('✅ New FK added to student_assignments');

    } else if (hasPaymentPlanId) {
      // Migrer directement de payment_plan_id vers student_assignment_id
      console.log('🔄 Migrating from payment_plan_id to student_assignment_id...');

      // Renommer la colonne
      await AppDataSource.query('ALTER TABLE installments RENAME COLUMN payment_plan_id TO student_assignment_id');
      console.log('✅ Column renamed to student_assignment_id');

      // Supprimer l'ancien index
      await AppDataSource.query('DROP INDEX IF EXISTS idx_installments_payment_plan_id');
      console.log('✅ Old index dropped');

      // Créer le nouvel index
      await AppDataSource.query('CREATE INDEX idx_installments_student_assignment_id ON installments(student_assignment_id)');
      console.log('✅ New index created');

      // Supprimer l'ancienne FK
      await AppDataSource.query('ALTER TABLE installments DROP CONSTRAINT IF EXISTS installments_payment_plan_id_fkey');
      console.log('✅ Old FK dropped');

      // Ajouter la nouvelle FK
      await AppDataSource.query(`
        ALTER TABLE installments
        ADD CONSTRAINT fk_installments_student_assignment
        FOREIGN KEY (student_assignment_id) REFERENCES student_assignments(id) ON DELETE CASCADE
      `);
      console.log('✅ New FK added to student_assignments');

    } else if (!hasStudentAssignmentId) {
      // Ajouter la colonne si elle n'existe pas
      console.log('🔄 Adding student_assignment_id column...');
      await AppDataSource.query('ALTER TABLE installments ADD COLUMN student_assignment_id INTEGER');
      console.log('✅ Column added');

      // Créer l'index
      await AppDataSource.query('CREATE INDEX idx_installments_student_assignment_id ON installments(student_assignment_id)');
      console.log('✅ Index created');

      // Ajouter la FK
      await AppDataSource.query(`
        ALTER TABLE installments
        ADD CONSTRAINT fk_installments_student_assignment
        FOREIGN KEY (student_assignment_id) REFERENCES student_assignments(id) ON DELETE CASCADE
      `);
      console.log('✅ FK added');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();