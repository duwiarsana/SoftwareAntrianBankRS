import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socket;
}

export function connectSocket(orgId) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  s.emit('join:org', orgId);
  return s;
}

export function disconnectSocket(orgId) {
  const s = getSocket();
  if (orgId) {
    s.emit('leave:org', orgId);
  }
  s.disconnect();
}
