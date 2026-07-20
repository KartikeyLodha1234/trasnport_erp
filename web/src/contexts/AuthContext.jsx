import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ id: '1', name: 'Admin', role: 'admin' });

  const login = (userData) => {
    setUser(userData);
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem('user'); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
