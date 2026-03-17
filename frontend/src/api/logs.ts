import client from './client';
import { LogEntry, PagedResult } from '../types';

export const getLogs = (childId: string, page = 1, pageSize = 20) =>
  client.get<PagedResult<LogEntry>>('/logs', { params: { childId, page, pageSize } });

export const createLog = (childId: string, data: {
  type: string;
  timestamp: string;
  durationMinutes?: number;
  notes?: string;
}) => client.post<LogEntry>('/logs', data, { params: { childId } });

export const deleteLog = (id: string) => client.delete(`/logs/${id}`);
