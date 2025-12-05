
// @ts-nocheck
// import { AppDataSource } from '../config/database.config';

const BASE_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ecole.dz',
    password: 'admin123',
    role: 'admin'
};

async function verifyStudentsApi() {
    console.log('🚀 Starting Students API Verification...');

    try {
        // 1. Register Admin (if not exists)
        console.log('👤 Registering Admin...');
        try {
            const regRes = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ADMIN_CREDENTIALS)
            });
            if (regRes.status === 201) console.log('✅ Admin registered');
            else if (regRes.status === 409) console.log('ℹ️ Admin already exists');
            else console.warn('⚠️ Admin registration status:', regRes.status);
        } catch (e) {
            console.error('❌ Registration failed (server might be down):', e);
            return;
        }

        // 2. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password })
        });
        const loginData = await loginRes.json();
        console.log('Login Data:', JSON.stringify(loginData, null, 2));
        const token = loginData.data.token;
        console.log('✅ Login successful, token received');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('📋 Fetching students...');
        const getRes = await fetch(`${BASE_URL}/students`, { headers });
        if (!getRes.ok) throw new Error(`GET /students failed: ${getRes.status}`);
        const getData = await getRes.json();
        console.log(`✅ Fetched ${getData.data.length} students`);

        // 4. POST /students
        console.log('➕ Creating test student...');
        const newStudent = {
            firstName: 'Test',
            lastName: 'API',
            email: `test.api.${Date.now()}@example.com`,
            password: 'password123',
            phone: '1234567890',
            dateOfBirth: '2000-01-01',
            address: '123 Test St',
            city: 'Test City',
            postalCode: '12345'
        };

        const createRes = await fetch(`${BASE_URL}/students`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newStudent)
        });

        if (!createRes.ok) {
            const err = await createRes.json();
            throw new Error(`POST /students failed: ${createRes.status} - ${JSON.stringify(err)}`);
        }

        const createData = await createRes.json();
        const studentId = createData.data.id;
        console.log(`✅ Student created: ${studentId}`);

        // 5. GET /students/:id
        console.log(`🔍 Fetching student ${studentId}...`);
        const getOneRes = await fetch(`${BASE_URL}/students/${studentId}`, { headers });
        if (!getOneRes.ok) throw new Error(`GET /students/${studentId} failed`);
        console.log('✅ Student fetched');

        // 6. PUT /students/:id
        console.log(`✏️ Updating student ${studentId}...`);
        const updateRes = await fetch(`${BASE_URL}/students/${studentId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ firstName: 'Test Updated' })
        });
        if (!updateRes.ok) throw new Error(`PUT /students/${studentId} failed`);
        console.log('✅ Student updated');

        // 7. DELETE /students/:id
        console.log(`🗑️ Deleting student ${studentId}...`);
        const deleteRes = await fetch(`${BASE_URL}/students/${studentId}`, {
            method: 'DELETE',
            headers
        });
        if (!deleteRes.ok) throw new Error(`DELETE /students/${studentId} failed`);
        console.log('✅ Student deleted');

        console.log('🎉 Students API Verification PASSED');

    } catch (error: any) {
        console.error('❌ Verification FAILED:', error.message);
    }
}

verifyStudentsApi();
