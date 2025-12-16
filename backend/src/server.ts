import app from './app';
import { initializeDatabase } from './config/database.config';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Start Express server with explicit error handling (helpful when port is in use)
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`✅ ENUMs fixed: course_category & course_type with correct values`);
    });

    server.on('error', (err: any) => {
      if (err && (err.code === 'EADDRINUSE' || err.errno === 'EADDRINUSE')) {
        console.error(`❌ Port ${PORT} is already in use. Free the port or set PORT env var (e.g. $env:PORT=3001).`);
        console.error(`Suggestion: run 'npx kill-port ${PORT}' or 'netstat -ano | findstr :${PORT}' then 'taskkill /PID <pid> /F' on Windows.`);
        process.exit(1);
      }
      console.error('❌ Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
