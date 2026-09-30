import { Timestamp } from 'firebase/firestore';

export type LeadStatus =
  | 'Potential'
  | 'No Potential'
  | 'No Interest'
  | 'No Answer'
  | 'Call Again'
  | 'FTD'
  | 'New';

export interface Lead {
  id: string; // Firestore document ID
  cid: string; // e.g. "CID-000001"
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  dateOfBirth: string; // YYYY-MM-DD
  currentStatus: LeadStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdByEmail?: string;
  isDeleted?: boolean;
}

export interface LeadComment {
  id: string;
  leadId: string;
  status: LeadStatus;
  comment: string;
  createdBy: string; // User email or displayName
  createdAt: Timestamp | null;
}
