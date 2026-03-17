import client from './client';
import { Vaccine, PagedResult } from '../types';

export const getVaccines = (childId: string, page = 1, pageSize = 20) =>
  client.get<PagedResult<Vaccine>>('/vaccines', { params: { childId, page, pageSize } });

export const createVaccine = (childId: string, data: { name: string; date: string; notes?: string }) =>
  client.post<Vaccine>('/vaccines', data, { params: { childId } });

export const deleteVaccine = (id: string) => client.delete(`/vaccines/${id}`);
