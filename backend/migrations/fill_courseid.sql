-- Remplir les courseId manquants
UPDATE enrollments 
SET "courseId" = sessions."courseId"
FROM sessions
WHERE enrollments."sessionId" = sessions.id
AND enrollments."courseId" IS NULL;
