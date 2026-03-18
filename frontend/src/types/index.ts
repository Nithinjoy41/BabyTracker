export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  familyId: string | null;
  children: Child[];
}

export interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
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
  children: Child[];
}

export interface BirthdayGuest {
  id: string;
  name: string;
  isConfirmed: boolean;
}

export interface BirthdayPlan {
  id: string;
  childId: string;
  theme: string;
  location: string;
  notes: string;
  date: string | null;
  guests: BirthdayGuest[];
}
