
'use client'; 

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  updateDoc,
  arrayUnion,
  arrayRemove,
  limit,
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  role?: 'user' | 'moderator';
  avatarUrl?: string;
  bio?: string;
  dob?: Date;
  gender?: string;
  race?: string;
  sexualOrientation?: string;
  country?: string;
  city?: string;
  state?: string;
  occupations?: string[];
  interests?: string[];
  industry?: string;
  isRunningBusiness?: boolean;
  businessName?: string;
  businessWebsite?: string;
  goals?: string[];
  contentPreferences?: string[];
  savedPosts?: string[]; // Array of post IDs
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Saves or updates a user's profile in Firestore.
 * The UID from the user object is used as the document ID.
 * @param uid The user's unique ID from Firebase Auth.
 * @param profileData The user profile data to save.
 */
export const saveUserProfile = async (uid: string, profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt' | 'savedPosts' | 'role'>) => {
  if (!firestore) throw new Error("Firestore not initialized");
  const userDocRef = doc(firestore, 'users', uid);
  const docSnap = await getDoc(userDocRef);

  const dataToSave = {
    ...profileData,
    uid,
    username: profileData.username.toLowerCase(), // Store username in lowercase for case-insensitive queries
    updatedAt: serverTimestamp(),
  };

  if (docSnap.exists()) {
    await setDoc(userDocRef, dataToSave, { merge: true });
  } else {
    await setDoc(userDocRef, {
      ...dataToSave,
      role: 'user',
      createdAt: serverTimestamp(),
      savedPosts: [],
    });
  }
};


/**
 * Retrieves a user's profile from Firestore.
 * @param uid The user's unique ID.
 * @returns The user profile data, or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const userDocRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Firestore Timestamp to JS Date for `dob` field
        if (data.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate();
        }
        return data as UserProfile;
    } else {
        return null;
    }
}

/**
 * Checks if a username is already taken.
 * @param username The username to check.
 * @returns True if the username is taken, false otherwise.
 */
export const isUsernameTaken = async (username: string): Promise<boolean> => {
    if (!firestore) throw new Error("Firestore not initialized");
    // Query against the lowercase username
    const q = query(collection(firestore, 'users'), where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

/**
 * Finds a user by their username (case-insensitive).
 * @param username The username to search for.
 * @returns The user profile data, or null if not found.
 */
export const findUserByUsername = async (username: string): Promise<UserProfile | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const q = query(collection(firestore, 'users'), where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    if (data.dob && data.dob instanceof Timestamp) {
        data.dob = data.dob.toDate();
    }
    return data as UserProfile;
}

/**
 * Creates a connection between two users in Firestore.
 * This function creates a document in a 'connections' subcollection for both users.
 * @param currentUserId The ID of the user initiating the connection.
 * @param targetUserId The ID of the user to connect with.
 */
export const connectWithUser = async (currentUserId: string, targetUserId: string) => {
  if (!firestore) throw new Error("Firestore not initialized");

  const currentUserConnectionDoc = doc(firestore, 'users', currentUserId, 'connections', targetUserId);
  const targetUserConnectionDoc = doc(firestore, 'users', targetUserId, 'connections', currentUserId);

  const connectionData = {
    status: 'connected',
    connectedAt: serverTimestamp(),
  };

  // Use a batch write to ensure both documents are created atomically.
  const batch = writeBatch(firestore);
  batch.set(currentUserConnectionDoc, connectionData);
  batch.set(targetUserConnectionDoc, connectionData);

  await batch.commit();
};


/**
 * Toggles a saved post for a user.
 * Adds or removes a post ID from the user's `savedPosts` array.
 * @param userId The user's unique ID.
 * @param postId The ID of the post to save or unsave.
 */
export const toggleSavePost = async (userId: string, postId: string) => {
    if (!firestore) throw new Error("Firestore not initialized");
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();
        const savedPosts = userData.savedPosts || [];

        if (savedPosts.includes(postId)) {
            // Unsave
            await updateDoc(userRef, {
                savedPosts: arrayRemove(postId)
            });
        } else {
            // Save
            await updateDoc(userRef, {
                savedPosts: arrayUnion(postId)
            });
        }
    }
};

/**
 * Retrieves a list of users, useful for populating suggestion lists.
 * @param count The maximum number of users to retrieve.
 * @returns A promise that resolves to an array of user profiles.
 */
export const getUsers = async (count: number = 20): Promise<UserProfile[]> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const usersCollection = collection(firestore, 'users');
    const q = query(usersCollection, limit(count));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (data.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate();
        }
        return data as UserProfile;
    });
}

/**
 * Retrieves multiple user profiles from a list of UIDs.
 * @param uids An array of user IDs.
 * @returns A promise that resolves to a map of UID to UserProfile.
 */
export const getMultipleUserProfiles = async (uids: string[]): Promise<Record<string, UserProfile>> => {
    if (!firestore) throw new Error("Firestore not initialized");
    if (uids.length === 0) return {};
  
    // Firestore 'in' query is limited to 30 elements. Chunk if necessary.
    const chunks: string[][] = [];
    for (let i = 0; i < uids.length; i += 30) {
        chunks.push(uids.slice(i, i + 30));
    }

    const profileMap: Record<string, UserProfile> = {};
    
    for (const chunk of chunks) {
        const q = query(collection(firestore, 'users'), where('uid', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            if (data.dob && data.dob instanceof Timestamp) {
                data.dob = data.dob.toDate();
            }
            profileMap[doc.id] = data;
        });
    }

    return profileMap;
}
