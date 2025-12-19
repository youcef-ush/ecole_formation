const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecole_formation',
  password: 'eftg',
  port: 5432
});

async function checkCoursesTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Structure de la table "courses" :');
    console.log('='.repeat(60));
    console.log(`Nombre de colonnes: ${result.rows.length}\n`);
    
    result.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''})`);
    });
    
    console.log('='.repeat(60));
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

checkCoursesTable();
