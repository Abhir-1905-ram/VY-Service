import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, signup as apiSignup } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {role: 'admin'|'employee', employeeKind?: 'sales'|'employee', username, id?}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('session');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (username, password, remember) => {
    const res = await apiLogin(username, password);
    if (!res.success) return res;
    const { role, user: u } = res.data;
    const session = { 
      role, 
      username: u.username, 
      id: u.id || null,
      employeeKind: role === 'employee' ? (u.employeeKind === 'sales' ? 'sales' : 'employee') : null,
      allowedCards: u.allowedCards || (role === 'employee' ? (u.employeeKind === 'sales' ? ['attendance'] : ['repair-service', 'repair-list', 'attendance']) : null),
      canRemoveRepairs: role === 'admin' ? true : (u.employeeKind === 'sales' ? false : (u.canRemoveRepairs || false))
    };
    setUser(session);
    try {
      if (remember) {
        await AsyncStorage.setItem('session', JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem('session');
      }
    } catch (_e) {
      // proceed even if storage fails
    }
    return { success: true };
  };

  const signUp = async (username, password, employeeKind) => {
    return await apiSignup(username, password, employeeKind);
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem('session');
  };

  const value = useMemo(() => ({ user, loading, signIn, signUp, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



