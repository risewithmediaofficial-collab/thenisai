import app from './app.js';
import { connectDB, MONGODB_URI } from './config/db.js';
import { seedIfEmpty } from './utils/catalogSync.js';

const PORT = process.env.PORT || 5003;

export async function startServer() {
  try {
    await connectDB();
    await seedIfEmpty();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`✨ THENISAI SWEETS BACKEND SERVER RUNNING`);
      console.log(`📍 Port: http://localhost:${PORT}`);
      console.log(`🍃 MongoDB: ${MONGODB_URI}`);
      console.log(`📡 Health: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another running instance.`);
        console.error(`👉 To free port ${PORT} in PowerShell, run:`);
        console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
        process.exit(1);
      } else {
        console.error('❌ Server startup error:', err);
        process.exit(1);
      }
    });

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Auto-start when executed directly
startServer();
