import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface SystemUser {
  id: string;
  email: string;
  password: string;
  name: string;
  isDefault?: boolean;
  createdAt?: any;
}

// Initial predefined users requested by the client
export const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'default_james',
    email: 'james@gmail.com',
    password: 'smc123',
    name: 'James',
    isDefault: true,
  },
  {
    id: 'default_adan',
    email: 'adan@gmail.com',
    password: '123',
    name: 'Adan',
    isDefault: true,
  },
  {
    id: 'default_azeem',
    email: 'azeem@gmail.com',
    password: '124',
    name: 'Azeem',
    isDefault: true,
  },
  {
    id: 'default_thomes',
    email: 'thomes@gmail.com',
    password: '123',
    name: 'Thomes',
    isDefault: true,
  },
];

export function extractDisplayName(email: string): string {
  if (!email) return 'User';
  const localPart = email.split('@')[0];
  if (!localPart) return 'User';
  // Capitalize properly, e.g. "adan" -> "Adan", "thomes" -> "Thomes", "azeem" -> "Azeem"
  return localPart
    .split(/[\._\- ]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Fetch all system users (combining default users and Firestore system_users)
export async function getAllSystemUsers(): Promise<SystemUser[]> {
  const usersMap = new Map<string, SystemUser>();

  // 1. Add default base users
  for (const def of DEFAULT_USERS) {
    usersMap.set(def.email.toLowerCase(), { ...def });
  }

  // 2. Fetch any added or deleted users from Firestore
  try {
    const colRef = collection(db, 'system_users');
    const snap = await getDocs(colRef);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const email = (data.email || '').trim().toLowerCase();
      if (email) {
        if (data.isDeleted) {
          usersMap.delete(email);
        } else {
          usersMap.set(email, {
            id: docSnap.id,
            email: data.email,
            password: data.password,
            name: data.name || extractDisplayName(data.email),
            isDefault: Boolean(data.isDefault),
            createdAt: data.createdAt,
          });
        }
      }
    });
  } catch (err) {
    console.error('Error fetching system users from Firestore:', err);
  }

  return Array.from(usersMap.values());
}

// Add a new user to Firestore
export async function addSystemUser(email: string, password: string): Promise<SystemUser> {
  const cleanEmail = email.trim();
  const lowerEmail = cleanEmail.toLowerCase();
  const cleanPassword = password.trim();
  const name = extractDisplayName(cleanEmail);

  const docId = `usr_${lowerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const docRef = doc(db, 'system_users', docId);

  const newUserData = {
    email: cleanEmail,
    password: cleanPassword,
    name,
    isDefault: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newUserData, { merge: true });

  return {
    id: docId,
    ...newUserData,
  };
}

// Remove/delete a user
export async function removeSystemUser(user: SystemUser): Promise<void> {
  const lowerEmail = user.email.toLowerCase();
  const docId = user.id.startsWith('usr_')
    ? user.id
    : `usr_${lowerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const docRef = doc(db, 'system_users', docId);

  if (user.isDefault) {
    // For default users, write a deletion tombstone so they remain removed
    await setDoc(
      docRef,
      {
        email: user.email,
        isDeleted: true,
        deletedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    // For custom users, delete doc or set isDeleted
    try {
      await deleteDoc(docRef);
    } catch {
      await setDoc(docRef, { isDeleted: true }, { merge: true });
    }
  }
}

// Verify credentials during login
export async function verifyCredentials(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  const allUsers = await getAllSystemUsers();
  const matchedUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    return {
      success: false,
      error: 'Access denied: Email is not authorized for immediatecrm.com',
    };
  }

  if (matchedUser.password !== cleanPass) {
    return {
      success: false,
      error: 'Invalid password. Please verify your credentials.',
    };
  }

  return {
    success: true,
    user: matchedUser,
  };
}
