const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdminPassword() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'ecole_formation',
        user: 'postgres',
        password: 'eftg'
    });

    try {
        await client.connect();
        console.log('✅ Connecté à PostgreSQL');

        // Générer un nouveau hash pour "admin123"
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        console.log('🔐 Nouveau hash généré:', hash);

        // Vérifier que le hash fonctionne
        const isValid = await bcrypt.compare(password, hash);
        console.log('✔️  Vérification hash:', isValid);

        // Mettre à jour dans la base de données
        const result = await client.query(
            'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
            [hash, 'admin@ecole.dz']
        );

        if (result.rowCount > 0) {
            console.log('✅ Mot de passe mis à jour pour:', result.rows[0].email);
            console.log('\n📧 Email: admin@ecole.dz');
            console.log('🔑 Mot de passe: admin123');
        } else {
            console.log('❌ Aucun utilisateur trouvé');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.end();
    }
}

resetAdminPassword();
