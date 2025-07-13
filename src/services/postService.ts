
'use client';

import { firestore, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import type { UserProfile } from './userService';

export interface PostAuthor {
  uid: string;
  name: string;
  avatarUrl: string;
  handle: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  imageUrl?: string;
  dataAiHint?: string;
  likes: number;
  likedBy: string[]; // array of user uids
  comments: number;
  shares: number;
  timestamp: any; // serverTimestamp
  type: 'personal' | 'business';
  trending?: boolean;
  websiteUrl?: string;
  appointmentUrl?: string;
  productUrl?: string;
  tags?: string[];
}

export const createPost = async (postData: { content: string; imageUrl?: string; dataAiHint?: string; }) => {
  if (!firestore || !auth.currentUser) throw new Error("Firestore or user not initialized");
  
  const userProfileDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
  if (!userProfileDoc.exists()) throw new Error("User profile not found.");
  const userProfile = userProfileDoc.data() as UserProfile;

  const post: Omit<Post, 'id' | 'timestamp'> = {
    author: {
        uid: auth.currentUser.uid,
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl || 'https://placehold.co/40x40.png',
        handle: userProfile.username,
    },
    content: postData.content,
    imageUrl: postData.imageUrl,
    dataAiHint: postData.dataAiHint,
    likes: 0,
    likedBy: [],
    comments: 0,
    shares: 0,
    type: userProfile.occupations && userProfile.occupations.length > 0 ? 'business' : 'personal', // Example logic
    tags: postData.content.match(/#\w+/g) || [], // simple tag extraction
  };

  const postsCollection = collection(firestore, 'posts');
  await addDoc(postsCollection, {
      ...post,
      timestamp: serverTimestamp()
  });
};

export const getPosts = async (): Promise<Post[]> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const postsCollection = collection(firestore, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
        } as Post;
    });
};

export const toggleLikePost = async (postId: string, userId: string) => {
    if (!firestore) throw new Error("Firestore not initialized");
    const postRef = doc(firestore, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
        const postData = postSnap.data();
        const likedBy = postData.likedBy || [];
        
        if (likedBy.includes(userId)) {
            // Unlike
            await updateDoc(postRef, {
                likes: postData.likes - 1,
                likedBy: arrayRemove(userId)
            });
        } else {
            // Like
            await updateDoc(postRef, {
                likes: postData.likes + 1,
                likedBy: arrayUnion(userId)
            });
        }
    }
};
