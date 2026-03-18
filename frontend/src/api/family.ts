import client from './client';
import { Family } from '../types';

export interface InviteResponse {
  code: string;
  expiresAt: string;
}

export const generateInvite = (email?: string) =>
  client.post<InviteResponse>('/family/invite', { email });

export const getFamily = () =>
  client.get<Family>('/family');

export const removeMember = (userId: string) =>
  client.delete(`/family/members/${userId}`);
