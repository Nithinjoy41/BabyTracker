export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  familyId: string | null;
}

export interface LogEntry {
  id: string;
  type: 'Food' | 'Nappy' | 'Sleep';
  timestamp: string;
  durationMinutes: number | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface Vaccine {
  id: string;
  name: string;
  date: string;
  notes: string | null;
  createdBy: string;
}

export interface Photo {
  id: string;
  url: string;
  notes: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FamilyInfo {
  id: string;
  name: string;
  inviteCode: string;
  members: { fullName: string; role: string; joinedAt: string }[];
}
