
// @ts-nocheck
const BASE_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ecole.dz',
    password: 'admin123',
    role: 'admin'
};

async function verifyRegistrationsApi() {
    console.log('🚀 Starting Registrations API Verification...');

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('✅ Login successful');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. GET /registrations
        console.log('📋 Fetching registrations...');
        const getRes = await fetch(`${BASE_URL}/registrations`, { headers });

        if (!getRes.ok) {
            const err = await getRes.json();
            throw new Error(`GET /registrations failed: ${getRes.status} - ${JSON.stringify(err)}`);
        }

        const getData = await getRes.json();
        console.log(`✅ Fetched ${getData.data.length} registrations`);

        // 3. POST /registrations (Need a course first)
        // We assume course ID 1 exists or we fetch one
        console.log('🔍 Fetching courses to get an ID...');
        const coursesRes = await fetch(`${BASE_URL}/courses`, { headers });
        const coursesData = await coursesRes.json();
        const courseId = coursesData.data && coursesData.data.length > 0 ? coursesData.data[0].id : 1;
        console.log(`ℹ️ Using Course ID: ${courseId}`);

        console.log('➕ Creating test registration...');
        const newRegistration = {
            firstName: 'Test',
            lastName: 'Registration',
            email: `test.reg.${Date.now()}@example.com`,
            phone: '0555123456',
            courseId: courseId,
            notes: 'Test registration via script'
        };

        const createRes = await fetch(`${BASE_URL}/registrations`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newRegistration)
        });

        if (!createRes.ok) {
            const err = await createRes.json();
            throw new Error(`POST /registrations failed: ${createRes.status} - ${JSON.stringify(err)}`);
        }

        const createData = await createRes.json();
        const registrationId = createData.data.id;
        console.log(`✅ Registration created: ${registrationId}`);

        // 4. GET /registrations/:id
        console.log(`🔍 Fetching registration ${registrationId}...`);
        const getOneRes = await fetch(`${BASE_URL}/registrations/${registrationId}`, { headers });
        if (!getOneRes.ok) throw new Error(`GET /registrations/${registrationId} failed`);
        console.log('✅ Registration fetched');

        // 5. PUT /registrations/:id
        console.log(`✏️ Updating registration ${registrationId}...`);
        const updateRes = await fetch(`${BASE_URL}/registrations/${registrationId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ notes: 'Updated notes' })
        });
        if (!updateRes.ok) throw new Error(`PUT /registrations/${registrationId} failed`);
        console.log('✅ Registration updated');

        // 6. DELETE /registrations/:id
        console.log(`🗑️ Deleting registration ${registrationId}...`);
        const deleteRes = await fetch(`${BASE_URL}/registrations/${registrationId}`, {
            method: 'DELETE',
            headers
        });
        if (!deleteRes.ok) throw new Error(`DELETE /registrations/${registrationId} failed`);
        console.log('✅ Registration deleted');

        console.log('🎉 Registrations API Verification PASSED');

    } catch (error: any) {
        console.error('❌ Verification FAILED:', error.message);
    }
}

verifyRegistrationsApi();
