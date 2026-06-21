/**
 * Socket.io Server Setup — Real-time event system for VAANI
 */

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Subscribe to complaint updates
    socket.on('subscribe-complaint', (complaintId) => {
      socket.join(`complaint-${complaintId}`);
    });

    // Subscribe to district updates
    socket.on('subscribe-district', (districtName) => {
      socket.join(`dm-${districtName}`);
    });

    // Subscribe to CM war room
    socket.on('subscribe-cm-room', () => {
      socket.join('cm-room');
    });

    // Subscribe to CMO room
    socket.on('subscribe-cmo-room', () => {
      socket.join('cmo-room');
    });

    // Subscribe to officer updates
    socket.on('subscribe-officer', (officerId) => {
      socket.join(`officer-${officerId}`);
    });

    // Subscribe to user notifications
    socket.on('subscribe-user', (userId) => {
      socket.join(`user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;
