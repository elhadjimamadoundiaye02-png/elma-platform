import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setTokens, getAccessToken, clearTokens, decodeToken } from './api';
import { connectSocket, disconnectSocket } from './socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { userId, email, role }
  const [loading, setLoading] = useState(true);

  // Au chargement : si un token existe déjà (localStorage), on restaure la session
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = decodeToken(token);
      if (payload) setUser({ userId: payload.sub, email: payload.email, role: payload.role });
    }
    setLoading(false);
  }, []);

  const applyAuth = useCallback((tokens) => {
    setTokens(tokens);
    const payload = decodeToken(tokens.accessToken);
    const u = { userId: payload.sub, email: payload.email, role: payload.role };
    setUser(u);
    const socket = connectSocket();
    socket.emit('session:connect', { userId: u.userId, nom: payload.email, role: u.role, page: '/' });
    return u;
  }, []);

  const login = useCallback(async (email, motDePasse) => {
    const tokens = await api.login({ email, motDePasse });
    return applyAuth(tokens);
  }, [applyAuth]);

  const register = useCallback(async (data) => {
    const tokens = await api.register(data);
    return applyAuth(tokens);
  }, [applyAuth]);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch { /* on nettoie côté client de toute façon */ }
    clearTokens();
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
