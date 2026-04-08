export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join organization room
    socket.on('join:org', (orgId) => {
      socket.join(`org:${orgId}`);
      console.log(`📌 Socket ${socket.id} joined org:${orgId}`);
    });

    // Leave organization room
    socket.on('leave:org', (orgId) => {
      socket.leave(`org:${orgId}`);
      console.log(`📌 Socket ${socket.id} left org:${orgId}`);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });
}
