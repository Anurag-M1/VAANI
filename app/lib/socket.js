import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
    });
  }
  return socket;
};

export const connectSocket = (userId, role, district) => {
  const s = getSocket();
  if (s) {
    if (!s.connected) {
      s.connect();
      s.on('connect', () => {
        console.log('🔌 Real-time socket connected:', s.id);
        
        // Subscribe based on role
        if (role === 'cm' || role === 'cm_staff' || role === 'super_admin') {
          s.emit('subscribe-cm-room');
        }
        if (userId) {
          s.emit('subscribe-officer', userId);
          s.emit('subscribe-user', userId);
        }
        if (role === 'district_officer' && district) {
          s.emit('subscribe-district', district);
        }
      });
    }
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
