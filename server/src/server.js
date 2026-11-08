
const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

// Import dependencies
const app = require('./app');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

// Server port
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server immediately upon database readiness
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[HostelFix Server] Running on port ${PORT}`);
      console.log(`[HostelFix Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[HostelFix Server] MongoDB Connected: ${mongoose.connection.readyState === 1}`);
    });

    // Run MongoDB diagnostics non-blockingly in the background (dev/debug only)
    if (process.env.NODE_ENV !== 'production') {
      setImmediate(async () => {
        try {
          const result = await mongoose.connection.db.admin().command({
            connectionStatus: 1,
            showPrivileges: false,
          });
          console.log(`[Database Diagnostics] Connected DB: ${mongoose.connection.name}`);
        } catch (diagnosticError) {
          // Non-critical diagnostic info
        }
      });
    }

  } catch (error) {
    console.error(
      '[HostelFix Server Error]: Failed to start server:',
      error
    );

    process.exit(1);
  }
};

// Initialize server
startServer();
