import client from './client';
import { BirthdayPlan, BirthdayGuest } from '../types';

export const getBirthdayPlan = (childId: string) => 
  client.get<BirthdayPlan>(`/Birthday/${childId}`);

export const updateBirthdayPlan = (childId: string, data: Partial<BirthdayPlan>) => 
  client.put<BirthdayPlan>(`/Birthday/${childId}`, data);

export const addBirthdayGuest = (childId: string, name: string) => 
  client.post<BirthdayGuest>(`/Birthday/${childId}/guests`, { name });

export const toggleGuest = (guestId: string) => 
  client.patch(`/Birthday/guests/${guestId}/toggle`);

export const deleteGuest = (guestId: string) => 
  client.delete(`/Birthday/guests/${guestId}`);
