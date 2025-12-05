
// @ts-nocheck
const BASE_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ecole.dz',
    password: 'admin123',
    role: 'admin'
};

async function verifySessionsApi() {
    console.log('🚀 Starting Sessions API Verification...');

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

        // 2. GET /sessions
        console.log('📋 Fetching sessions...');
        const getRes = await fetch(`${BASE_URL}/sessions`, { headers });
        if (!getRes.ok) {
            const err = await getRes.json();
            throw new Error(`GET /sessions failed: ${getRes.status} - ${JSON.stringify(err)}`);
        }
        console.log('✅ GET /sessions OK');

        // 3. POST /sessions
        // Need course and trainer first
        const coursesRes = await fetch(`${BASE_URL}/courses`, { headers });
        const courseId = (await coursesRes.json()).data[0]?.id || 1;

        const trainersRes = await fetch(`${BASE_URL}/trainers`, { headers });
        const trainerId = (await trainersRes.json()).data[0]?.id || 1;

        console.log('➕ Creating session...');
        const newSession = {
            courseId: courseId,
            trainerId: trainerId,
            startDate: '2025-01-01',
            endDate: '2025-01-05',
            location: 'Room 101',
            capacity: 20,
            price: 50000
        };
        const createRes = await fetch(`${BASE_URL}/sessions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newSession)
        });
        if (!createRes.ok) {
            const err = await createRes.json();
            throw new Error(`POST /sessions failed: ${createRes.status} - ${JSON.stringify(err)}`);
        }
        const sessionId = (await createRes.json()).data.id;
        console.log(`✅ Session created: ${sessionId}`);

        // 4. DELETE /sessions/:id
        console.log(`🗑️ Deleting session ${sessionId}...`);
        const deleteRes = await fetch(`${BASE_URL}/sessions/${sessionId}`, { method: 'DELETE', headers });
        if (!deleteRes.ok) throw new Error(`DELETE /sessions/${sessionId} failed`);
        console.log('✅ Session deleted');

        console.log('🎉 Sessions API Verification PASSED');

    } catch (error: any) {
        console.error('❌ Verification FAILED:', error.message);
    }
}

verifySessionsApi();
