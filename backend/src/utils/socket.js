const jwt = require('jsonwebtoken');

let io;

/**
 * Initialize Socket.IO with authentication
 */
function initializeSocket(httpServer) {
    const { Server } = require('socket.io');

    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
            credentials: true,
        },
    });

    // Middleware to verify JWT token
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`✓ User connected: ${socket.userId} (Role: ${socket.userRole})`);

        // Join admin room for real-time bid updates
        if (socket.userRole === 'admin' || socket.userRole === 'ADMIN') {
            socket.join('admin_bids');
            console.log(`✓ Admin ${socket.userId} joined admin_bids room`);
            console.log(`✓ Room members: ${io.sockets.adapter.rooms.get('admin_bids')?.size || 0}`);
        }

        // Handle user joining a diamond room
        socket.on('join_diamond', (diamondId) => {
            const roomName = `diamond_${diamondId}`;
            socket.join(roomName);
            socket.currentDiamondRoom = roomName;

            const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
            console.log(`✓ User ${socket.userId} joined ${roomName}, Total users: ${roomSize}`);

            // Emit updated user count to all users in this diamond room and admins
            io.to(roomName).emit('active_users_update', { diamondId, count: roomSize });
            io.to('admin_bids').emit('active_users_update', { diamondId, count: roomSize });
        });

        // Handle user leaving a diamond room
        socket.on('leave_diamond', (diamondId) => {
            const roomName = `diamond_${diamondId}`;
            socket.leave(roomName);

            const roomSize = io.sockets.adapter.rooms.get(roomName)?.size || 0;
            console.log(`✗ User ${socket.userId} left ${roomName}, Remaining users: ${roomSize}`);

            // Emit updated user count
            io.to(roomName).emit('active_users_update', { diamondId, count: roomSize });
            io.to('admin_bids').emit('active_users_update', { diamondId, count: roomSize });

            socket.currentDiamondRoom = null;
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`✗ User disconnected: ${socket.userId}`);

            // If user was in a diamond room, update the count
            if (socket.currentDiamondRoom) {
                const roomSize = io.sockets.adapter.rooms.get(socket.currentDiamondRoom)?.size || 0;
                const diamondId = socket.currentDiamondRoom.replace('diamond_', '');
                console.log(`✗ User left ${socket.currentDiamondRoom} on disconnect, Remaining: ${roomSize}`);

                io.to(socket.currentDiamondRoom).emit('active_users_update', { diamondId, count: roomSize });
                io.to('admin_bids').emit('active_users_update', { diamondId, count: roomSize });
            }
        });
    });

    return io;
}

/**
 * Get Socket.IO instance
 */
function getSocket() {
    return io;
}

/**
 * Emit bid update to admin room
 */
function emitBidUpdate(bidData) {
    if (io) {
        const eventName = bidData.event || 'bid_placed';
        console.log(`📡 Emitting ${eventName} to admin_bids room:`, bidData);
        io.to('admin_bids').emit(eventName, {
            timestamp: new Date().toISOString(),
            ...bidData,
        });
    } else {
        console.log('⚠️ Socket.IO not initialized, cannot emit event');
    }
}

/**
 * Emit bid update (same as emitBidUpdate)
 */
function emitBidUpdated(bidData) {
    emitBidUpdate(bidData);
}

module.exports = {
    initializeSocket,
    getSocket,
    emitBidUpdate,
    emitBidUpdated,
};
