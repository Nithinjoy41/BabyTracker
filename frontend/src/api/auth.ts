import client from './client';
import { AuthResponse } from '../types';

export const register = (email: string, password: string, fullName: string) =>
  client.post<AuthResponse>('/auth/register', { email, password, fullName });

export const login = (email: string, password: string) =>
  client.post<AuthResponse>('/auth/login', { email, password });

export const joinFamily = (inviteCode: string) =>
  client.post('/auth/join-family', { inviteCode });
