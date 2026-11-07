
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

    console.log('\n========== MONGODB DIAGNOSTICS ==========');

    // Verify MongoDB connection and permissions
    try {
      const result = await mongoose.connection.db.admin().command({
        connectionStatus: 1,
        showPrivileges: true
      });

      console.log(
        'DATABASE:',
        mongoose.connection.name
      );

      console.log(
        'AUTHENTICATED USERS:',
        JSON.stringify(
          result.authInfo.authenticatedUsers,
          null,
          2
        )
      );

      console.log(
        'ASSIGNED ROLES:',
        JSON.stringify(
          result.authInfo.authenticatedUserRoles,
          null,
          2
        )
      );

      console.log(
        'INHERITED PRIVILEGES:',
        JSON.stringify(
          result.authInfo.authenticatedUserPrivileges,
          null,
          2
        )
      );

    } catch (diagnosticError) {
      console.error(
        '[MongoDB Diagnostic Error]:',
        diagnosticError.message
      );
    }

    console.log('========================================\n');

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `[HostelFix Server] Running on port ${PORT}`
      );

      console.log(
        `[HostelFix Server] Environment: ${process.env.NODE_ENV || 'development'
        }`
      );

      console.log(
        '[HostelFix Server] MongoDB Connected:',
        mongoose.connection.readyState === 1
      );
    });

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
