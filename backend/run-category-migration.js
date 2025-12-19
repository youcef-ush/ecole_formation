const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecole_formation',
  password: 'eftg',
  port: 5432
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const migrationFile = path.join(__dirname, 'migrations', 'update_course_category_enum.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('🔄 Exécution de la migration pour mettre à jour category...');
    await client.query(sql);
    console.log('✅ Migration réussie !');
    
    // Vérifier le résultat
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'category'
    `);
    console.log('\n📋 Nouvelle structure de la colonne category :');
    console.log(result.rows[0]);
    
  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
