import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket = null;

// Une seule connexion Socket.io partagée pour toute l'app, créée une fois
// l'utilisateur authentifié (le token n'est pas requis par le gateway actuel,
// mais on attend un utilisateur connu pour envoyer session:connect).
export function connectSocket() {
  if (socket) return socket;
  socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
