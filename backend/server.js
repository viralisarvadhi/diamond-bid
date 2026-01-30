const http = require('http');
const app = require('./src/app');
const { initializeSocket } = require('./src/utils/socket');
const { startDiamondScheduler } = require('./src/services/diamondScheduler');
require('dotenv').config();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start automatic diamond closure scheduler
startDiamondScheduler();

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ API: http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`✓ Socket.IO: ws://localhost:${PORT}`);
});
