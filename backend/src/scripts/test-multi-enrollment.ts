
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testMultiEnrollment() {
    try {
        console.log("🚀 Testing Multi-Course Enrollment...");

        // 0. Fetch Courses to get valid IDs
        console.log("Fetching courses...");
        const coursesRes = await axios.get(`${API_URL}/courses`);
        const courses = coursesRes.data;
        if (!courses || courses.length < 2) {
            console.error("❌ Not enough courses to test multi-enrollment (need at least 2). found:", courses?.length);
            return;
        }
        const courseIds = [courses[0].id, courses[1].id];
        console.log(`Using Course IDs: ${courseIds.join(', ')}`);

        // 1. Create a payload with a NEW student and multiple courses
        const randomSuffix = Math.floor(Math.random() * 10000);
        const payload = {
            studentData: {
                firstName: `TestUser_${randomSuffix}`,
                lastName: "MultiCourse",
                phone: `0555${randomSuffix}`,
                email: `test_${randomSuffix}@example.com`
            },
            courseIds: courseIds,
            registrationFee: 2000,
            paymentPlanId: null,
            startDate: new Date().toISOString()
        };

        console.log("Payload:", JSON.stringify(payload, null, 2));

        const response = await axios.post(`${API_URL}/enrollments`, payload);

        console.log("✅ Response Status:", response.status);
        console.log("✅ Created Enrollments:", response.data.length);
        console.log("✅ Enrollments Data:", JSON.stringify(response.data, null, 2));

        if (response.data.length === 2) {
            console.log("🎉 SUCCESS: Created 2 enrollments as expected.");
        } else {
            console.error("❌ FAILURE: Expected 2 enrollments, got", response.data.length);
        }

    } catch (error: any) {
        console.error("❌ Error Status:", error.response?.status);
        console.error("❌ Error Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("❌ Error Message:", error.message);
    }
}

testMultiEnrollment();
