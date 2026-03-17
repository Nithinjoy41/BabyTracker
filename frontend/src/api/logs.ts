import client from './client';
import { LogEntry, PagedResult } from '../types';

export const getLogs = (page = 1, pageSize = 20) =>
  client.get<PagedResult<LogEntry>>('/logs', { params: { page, pageSize } });

export const createLog = (data: {
  type: string;
  timestamp: string;
  durationMinutes?: number;
  notes?: string;
}) => client.post<LogEntry>('/logs', data);

export const deleteLog = (id: string) => client.delete(`/logs/${id}`);
