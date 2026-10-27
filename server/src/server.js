const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[HostelFix Server] Running on http://localhost:${PORT}`);
      console.log(`[HostelFix Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[HostelFix Server Error]: Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
