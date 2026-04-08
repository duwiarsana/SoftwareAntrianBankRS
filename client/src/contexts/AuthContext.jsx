import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('queuepro_token');
    if (token) {
      api.getMe()
        .then((data) => {
          setUser(data.user);
          setOrg(data.org);
        })
        .catch(() => {
          localStorage.removeItem('queuepro_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('queuepro_token', data.token);
    setUser(data.user);
    setOrg(data.org);
    return data;
  };

  const register = async (orgName, name, email, password) => {
    const data = await api.register(orgName, name, email, password);
    localStorage.setItem('queuepro_token', data.token);
    setUser(data.user);
    setOrg(data.org);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('queuepro_token');
    setUser(null);
    setOrg(null);
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, register, logout, setOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
