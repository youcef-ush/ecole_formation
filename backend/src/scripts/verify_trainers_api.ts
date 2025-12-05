
// @ts-nocheck
const BASE_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ecole.dz',
    password: 'admin123',
    role: 'admin'
};

async function verifyTrainersApi() {
    console.log('🚀 Starting Trainers API Verification...');

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const token = (await loginRes.json()).data.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. GET /trainers
        console.log('📋 Fetching trainers...');
        const getRes = await fetch(`${BASE_URL}/trainers`, { headers });
        if (!getRes.ok) {
            const err = await getRes.json();
            throw new Error(`GET /trainers failed: ${getRes.status} - ${JSON.stringify(err)}`);
        }
        console.log('✅ GET /trainers OK');

        // 3. POST /trainers
        console.log('➕ Creating trainer...');
        const newTrainer = {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: `jean.dupont.${Date.now()}@example.com`,
            phone: '0555998877',
            specialization: 'Informatique',
            hourlyRate: 2000
        };
        const createRes = await fetch(`${BASE_URL}/trainers`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newTrainer)
        });
        if (!createRes.ok) {
            const err = await createRes.json();
            throw new Error(`POST /trainers failed: ${createRes.status} - ${JSON.stringify(err)}`);
        }
        const trainerId = (await createRes.json()).data.id;
        console.log(`✅ Trainer created: ${trainerId}`);

        // 4. DELETE /trainers/:id
        console.log(`🗑️ Deleting trainer ${trainerId}...`);
        const deleteRes = await fetch(`${BASE_URL}/trainers/${trainerId}`, { method: 'DELETE', headers });
        if (!deleteRes.ok) throw new Error(`DELETE /trainers/${trainerId} failed`);
        console.log('✅ Trainer deleted');

        console.log('🎉 Trainers API Verification PASSED');

    } catch (error: any) {
        console.error('❌ Verification FAILED:', error.message);
    }
}

verifyTrainersApi();
