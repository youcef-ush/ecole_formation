
// @ts-nocheck
const BASE_URL = 'http://127.0.0.1:3000/api';
const ADMIN_CREDENTIALS = {
    email: 'admin@ecole.dz',
    password: 'admin123',
    role: 'admin'
};

async function verifyGlobalApi() {
    console.log('🚀 Starting Global API Health Check...');
    const report = {};

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

        const endpoints = [
            'students',
            'registrations',
            'trainers',
            'courses',
            'sessions',
            'enrollments'
        ];

        for (const endpoint of endpoints) {
            console.log(`\n📋 Checking GET /${endpoint}...`);
            try {
                const res = await fetch(`${BASE_URL}/${endpoint}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    console.log(`✅ ${endpoint}: OK (${data.data ? data.data.length : 0} items)`);
                    report[endpoint] = 'OK';
                } else {
                    const err = await res.json().catch(() => ({ message: res.statusText }));
                    console.error(`❌ ${endpoint}: FAILED (${res.status}) - ${JSON.stringify(err)}`);
                    report[endpoint] = `FAILED: ${res.status} - ${err.message || JSON.stringify(err)}`;
                }
            } catch (err) {
                console.error(`❌ ${endpoint}: ERROR - ${err.message}`);
                report[endpoint] = `ERROR: ${err.message}`;
            }
        }

    } catch (error: any) {
        console.error('❌ Fatal error:', error.message);
    }

    console.log('\n📊 Summary Report:');
    console.table(report);
}

verifyGlobalApi();
