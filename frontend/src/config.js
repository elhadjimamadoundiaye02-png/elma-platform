// URL de l'API backend (NestJS déployé sur Render/Railway).
// En local : proxy Vite vers localhost:3000 (voir vite.config.js si besoin d'un proxy dev).
// En production : injectée au build par GitHub Actions via le secret VITE_API_URL.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
