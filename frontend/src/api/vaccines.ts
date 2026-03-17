import client from './client';
import { Vaccine, PagedResult } from '../types';

export const getVaccines = (page = 1, pageSize = 20) =>
  client.get<PagedResult<Vaccine>>('/vaccines', { params: { page, pageSize } });

export const createVaccine = (data: { name: string; date: string; notes?: string }) =>
  client.post<Vaccine>('/vaccines', data);

export const deleteVaccine = (id: string) => client.delete(`/vaccines/${id}`);
