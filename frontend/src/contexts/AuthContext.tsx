import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

interface AuthState {
  token: string | null;
  email: string | null;
  fullName: string | null;
  familyId: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    token: null, email: null, fullName: null, familyId: null, isLoading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const email = await AsyncStorage.getItem('email');
        const fullName = await AsyncStorage.getItem('fullName');
        const familyId = await AsyncStorage.getItem('familyId');
        setState({ token, email, fullName, familyId, isLoading: false });
      } catch (e) {
        setState({ token: null, email: null, fullName: null, familyId: null, isLoading: false });
      }
    })();
  }, []);

  const saveAuth = async (data: { token: string; email: string; fullName: string; familyId: string | null }) => {
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('email', data.email);
    await AsyncStorage.setItem('fullName', data.fullName);
    if (data.familyId) await AsyncStorage.setItem('familyId', data.familyId);
    setState({ ...data, isLoading: false });
  };

  const signIn = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await saveAuth(data);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data } = await authApi.register(email, password, fullName);
    await saveAuth(data);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('email');
    await AsyncStorage.removeItem('fullName');
    await AsyncStorage.removeItem('familyId');
    setState({ token: null, email: null, fullName: null, familyId: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
