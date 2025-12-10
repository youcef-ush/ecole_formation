
import { AppDataSource } from "./src/config/database.config";
import { AccessService } from "./src/services/access.service";

async function testScan() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected!");

        const accessService = new AccessService();

        // TEST PARAMETERS
        // The QR code after your fix: STUDENT-1-1765303925333
        const qrCode = "STUDENT-1-1765303925333";
        // Try Course ID 1, 2, 3, 4, 5
        const courseIdsToTest = [1, 2, 3, 4, 5, 23];

        console.log("\n--- STARTING SCAN TESTS ---");

        for (const courseId of courseIdsToTest) {
            console.log(`\n\nTesting Scan for Course ID: ${courseId}`);
            const result = await accessService.scan(qrCode, courseId);
            console.log("RESULT:", result);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

testScan();
