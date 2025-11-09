-- Vérifier qu'il n'y a plus de courseId NULL
SELECT COUNT(*) as count_null FROM enrollments WHERE "courseId" IS NULL;

-- Rendre sessionId nullable
ALTER TABLE enrollments ALTER COLUMN "sessionId" DROP NOT NULL;
