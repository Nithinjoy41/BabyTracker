import client from './client';

export interface InviteResponse {
  code: string;
  expiresAt: string;
}

export const generateInvite = (email?: string) =>
  client.post<InviteResponse>('/family/invite', { email });

export const getFamily = () =>
  client.get('/family');
