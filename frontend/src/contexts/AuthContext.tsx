import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { Child, AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  email: string | null;
  fullName: string | null;
  familyId: string | null;
  children: Child[];
  selectedChildId: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  selectChild: (childId: string) => Promise<void>;
  setChildren: (children: Child[]) => void;
  joinFamilySuccess: (data: AuthResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children: childrenProp }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    token: null, email: null, fullName: null, familyId: null,
    children: [], selectedChildId: null, isLoading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const email = await AsyncStorage.getItem('email');
        const fullName = await AsyncStorage.getItem('fullName');
        const familyId = await AsyncStorage.getItem('familyId');
        const selectedChildId = await AsyncStorage.getItem('selectedChildId');
        const childrenJson = await AsyncStorage.getItem('children');
        const kids: Child[] = childrenJson ? JSON.parse(childrenJson) : [];
        setState({ token, email, fullName, familyId, children: kids, selectedChildId, isLoading: false });
      } catch (e) {
        setState({ token: null, email: null, fullName: null, familyId: null, children: [], selectedChildId: null, isLoading: false });
      }
    })();
  }, []);

  const saveAuth = async (data: { token: string; email: string; fullName: string; familyId: string | null; children: Child[] }) => {
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('email', data.email);
    await AsyncStorage.setItem('fullName', data.fullName);
    if (data.familyId) await AsyncStorage.setItem('familyId', data.familyId);
    await AsyncStorage.setItem('children', JSON.stringify(data.children));
    // Auto-select if only one child
    let selectedChildId: string | null = null;
    if (data.children.length === 1) {
      selectedChildId = data.children[0].id;
      await AsyncStorage.setItem('selectedChildId', selectedChildId);
    }
    setState({ ...data, selectedChildId, isLoading: false });
  };

  const signIn = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await saveAuth({ ...data, children: data.children || [] });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data } = await authApi.register(email, password, fullName);
    await saveAuth({ ...data, children: data.children || [] });
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(['token', 'email', 'fullName', 'familyId', 'selectedChildId', 'children']);
    setState({ token: null, email: null, fullName: null, familyId: null, children: [], selectedChildId: null, isLoading: false });
  };

  const selectChild = async (childId: string) => {
    await AsyncStorage.setItem('selectedChildId', childId);
    setState(prev => ({ ...prev, selectedChildId: childId }));
  };

  const setChildrenState = (kids: Child[]) => {
    AsyncStorage.setItem('children', JSON.stringify(kids));
    setState(prev => ({ ...prev, children: kids }));
  };

  const joinFamilySuccess = (data: AuthResponse) => {
    saveAuth(data);
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, selectChild, setChildren: setChildrenState, joinFamilySuccess }}>
      {childrenProp}
    </AuthContext.Provider>
  );
};
