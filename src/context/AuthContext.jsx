/* eslint-disable react/only-export-components */
import React, { createContext, useState, useContext } from 'react';
import { ROLES } from '../utils/permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('voting_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (role, studentId = '') => {
    let userData = null;
    if (role === ROLES.STUDENT) {
      userData = {
        role: ROLES.STUDENT,
        studentId: studentId.trim() || 'STU_DEFAULT',
        name: `Student (${studentId.trim() || 'STU_DEFAULT'})`,
      };
    } else if (role === ROLES.MANAGER) {
      userData = {
        role: ROLES.MANAGER,
        name: 'Election Manager',
      };
    }
    
    if (userData) {
      setUser(userData);
      localStorage.setItem('voting_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('voting_user');
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
