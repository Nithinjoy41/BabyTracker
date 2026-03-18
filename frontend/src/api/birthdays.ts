import client from './client';
import { BirthdayPlan, BirthdayGuest } from '../types';

export const getBirthdayPlan = (childId: string) => 
  client.get<BirthdayPlan>(`/Birthday/${childId}`);

export const updateBirthdayPlan = (childId: string, data: Partial<BirthdayPlan>) => 
  client.put<BirthdayPlan>(`/Birthday/${childId}`, data);

export const addBirthdayGuest = (childId: string, name: string) => 
  client.post<BirthdayGuest>(`/Birthday/${childId}/guests`, { name });

export const updateGuest = (guestId: string, status: string, additionalAdults: number, additionalChildren: number, subGuests?: string) => 
  client.patch(`/Birthday/guests/${guestId}`, { status, additionalAdults, additionalChildren, subGuests });

export const deleteGuest = (guestId: string) => 
  client.delete(`/Birthday/guests/${guestId}`);
