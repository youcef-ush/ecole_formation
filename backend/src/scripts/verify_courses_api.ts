
// @ts-nocheck
const BASE_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ecole.dz',
    password: 'admin123',
    role: 'admin'
};

async function verifyCoursesApi() {
    console.log('🚀 Starting Courses API Verification...');

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

        // 2. GET /courses
        console.log('📋 Fetching courses...');
        const getRes = await fetch(`${BASE_URL}/courses`, { headers });
        if (!getRes.ok) {
            const err = await getRes.json();
            throw new Error(`GET /courses failed: ${getRes.status} - ${JSON.stringify(err)}`);
        }
        console.log('✅ GET /courses OK');

        // 3. POST /courses
        console.log('➕ Creating course...');
        const newCourse = {
            title: 'Test Course',
            description: 'Test Description',
            code: `TEST-${Date.now()}`,
            duration: 30,
            price: 50000,
            category: 'PROGRAMMING', // Enum check
            level: 'BEGINNER'
        };
        const createRes = await fetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newCourse)
        });
        if (!createRes.ok) {
            const err = await createRes.json();
            throw new Error(`POST /courses failed: ${createRes.status} - ${JSON.stringify(err)}`);
        }
        const courseId = (await createRes.json()).data.id;
        console.log(`✅ Course created: ${courseId}`);

        // 4. DELETE /courses/:id
        console.log(`🗑️ Deleting course ${courseId}...`);
        const deleteRes = await fetch(`${BASE_URL}/courses/${courseId}`, { method: 'DELETE', headers });
        if (!deleteRes.ok) throw new Error(`DELETE /courses/${courseId} failed`);
        console.log('✅ Course deleted');

        console.log('🎉 Courses API Verification PASSED');

    } catch (error: any) {
        console.error('❌ Verification FAILED:', error.message);
    }
}

verifyCoursesApi();
