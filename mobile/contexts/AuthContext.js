import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, signup as apiSignup } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
<<<<<<< HEAD
  const [user, setUser] = useState(null); // {role: 'admin'|'employee', employeeKind?: 'sales'|'employee', username, id?}
=======
  const [user, setUser] = useState(null); // {role: 'admin'|'employee', username, id?}
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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
<<<<<<< HEAD
      employeeKind: role === 'employee' ? (u.employeeKind === 'sales' ? 'sales' : 'employee') : null,
      allowedCards: u.allowedCards || (role === 'employee' ? (u.employeeKind === 'sales' ? ['attendance'] : ['repair-service', 'repair-list', 'attendance']) : null),
      canRemoveRepairs: role === 'admin' ? true : (u.employeeKind === 'sales' ? false : (u.canRemoveRepairs || false))
=======
      allowedCards: u.allowedCards || (role === 'employee' ? ['repair-service', 'repair-list', 'attendance'] : null),
      canRemoveRepairs: role === 'admin' ? true : (u.canRemoveRepairs || false) // Admins always have this permission
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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

<<<<<<< HEAD
  const signUp = async (username, password, employeeKind) => {
    return await apiSignup(username, password, employeeKind);
=======
  const signUp = async (username, password) => {
    return await apiSignup(username, password);
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem('session');
  };

  const value = useMemo(() => ({ user, loading, signIn, signUp, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



