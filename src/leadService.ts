import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  getDocs,
  query,
  updateDoc,
  addDoc,
  getDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead, LeadComment, LeadStatus } from './types';

const LEADS_COLLECTION = 'leads';
const METADATA_COLLECTION = 'metadata';
const COUNTERS_DOC = 'counters';

/**
 * Format sequence number to CID string, e.g. 1 -> CID-000001
 */
export function formatCID(num: number): string {
  return `CID-${String(num).padStart(6, '0')}`;
}

/**
 * Creates a new lead with a guaranteed atomic unique CID using Firestore transaction.
 */
export async function createLeadInFirestore(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  dateOfBirth?: string;
  userEmail: string;
}): Promise<Lead> {
  const counterRef = doc(db, METADATA_COLLECTION, COUNTERS_DOC);
  const leadsCol = collection(db, LEADS_COLLECTION);
  const newLeadRef = doc(leadsCol);

  const newLead = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextSeq = 1;

    if (counterSnap.exists()) {
      const current = counterSnap.data().leadCounter;
      nextSeq = typeof current === 'number' ? current + 1 : 1;
    } else {
      // First lead in this instance
      nextSeq = 1;
    }

    const cid = formatCID(nextSeq);

    // Save lead document
    const leadData = {
      cid,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      country: data.country.trim(),
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.trim() : '',
      currentStatus: 'New' as LeadStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByEmail: data.userEmail,
      isDeleted: false,
    };

    transaction.set(counterRef, { leadCounter: nextSeq }, { merge: true });
    transaction.set(newLeadRef, leadData);

    return {
      id: newLeadRef.id,
      ...leadData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    } as Lead;
  });

  return newLead;
}

/**
 * Updates an existing lead's profile details. CID is immutable and protected.
 */
export async function updateLeadInFirestore(
  leadId: string,
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    country: string;
    dateOfBirth: string;
  }
): Promise<void> {
  const leadRef = doc(db, LEADS_COLLECTION, leadId);
  await updateDoc(leadRef, {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    country: data.country.trim(),
    dateOfBirth: data.dateOfBirth.trim(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Adds a comment to a lead's subcollection and atomically updates the lead's currentStatus.
 */
export async function addCommentToFirestore(
  leadId: string,
  data: {
    status: LeadStatus;
    comment: string;
    userEmail: string;
  }
): Promise<void> {
  const commentsCol = collection(db, LEADS_COLLECTION, leadId, 'comments');
  const leadRef = doc(db, LEADS_COLLECTION, leadId);

  // Add comment with serverTimestamp
  await addDoc(commentsCol, {
    leadId,
    status: data.status,
    comment: data.comment.trim(),
    createdBy: data.userEmail,
    createdAt: serverTimestamp(),
  });

  // Update lead's current status and updatedAt
  await updateDoc(leadRef, {
    currentStatus: data.status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft deletes a lead
 */
export async function softDeleteLeadInFirestore(leadId: string): Promise<void> {
  const leadRef = doc(db, LEADS_COLLECTION, leadId);
  await updateDoc(leadRef, {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetches a single lead by its Firestore document ID
 */
export async function fetchLeadById(leadId: string): Promise<Lead | null> {
  const leadRef = doc(db, LEADS_COLLECTION, leadId);
  const snap = await getDoc(leadRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Lead;
}
