import client from './client';
import { Child } from '../types';

export const getChildren = () =>
  client.get<Child[]>('/children');

export const addChild = (name: string, dateOfBirth: string) =>
  client.post<Child>('/children', { name, dateOfBirth });

export const deleteChild = (id: string) =>
  client.delete(`/children/${id}`);
