
'use client';

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  limit,
  getDocs,
} from 'firebase/firestore';
import { getMultipleUserProfiles, type UserProfile } from './userService';

// --- INTERFACES ---
export interface ConversationParticipant {
  name: string;
  username: string;
  avatarUrl: string;
}

export interface Conversation {
  id: string;
  name?: string; // For group chats
  type: 'direct' | 'group';
  participants: string[];
  participantInfo: {
    [key: string]: ConversationParticipant;
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  updatedAt: any;
  createdBy?: string; // UID of the group creator
  admins?: string[]; // UIDs of group admins
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

// --- CONSTANTS ---
const MONTANA_BOT_UID = 'montana_bot';
const MONTANA_BOT_PROFILE = {
  uid: MONTANA_BOT_UID,
  name: 'Montana',
  username: 'montana',
  avatarUrl: 'https://placehold.co/128x128.png', 
};

const WELCOME_MESSAGE = `Hey, I'm Montana, your guide to getting started on Boomn! Welcome! 🎉

I'm here to help you get the most out of the platform. Feel free to explore the feed, connect with others, and don't hesitate to reach out if you have any questions. Happy boomn'ing!`;


// --- FUNCTIONS ---

/**
 * Sends an initial welcome message to a new user from Montana.
 * This creates a new conversation and the first message.
 * @param newUserId The UID of the new user.
 * @param newUserProfile The profile of the new user.
 */
export const sendInitialWelcomeMessage = async (newUserId: string, newUserProfile: Pick<UserProfile, 'name' | 'username' | 'avatarUrl'>) => {
  if (!firestore) {
    console.error("Firestore not initialized, skipping welcome message.");
    return;
  }

  const participantIds = [MONTANA_BOT_UID, newUserId].sort();
  const conversationId = participantIds.join('_');
  const conversationRef = doc(firestore, 'conversations', conversationId);

  const now = serverTimestamp();
  
  const welcomeMessageData = {
      senderId: MONTANA_BOT_UID,
      text: WELCOME_MESSAGE,
      timestamp: now,
  };

  const batch = writeBatch(firestore);

  batch.set(conversationRef, {
    type: 'direct',
    participants: participantIds,
    participantInfo: {
      [MONTANA_BOT_UID]: {
        name: MONTANA_BOT_PROFILE.name,
        avatarUrl: MONTANA_BOT_PROFILE.avatarUrl,
        username: MONTANA_BOT_PROFILE.username,
      },
      [newUserId]: {
        name: newUserProfile.name,
        avatarUrl: newUserProfile.avatarUrl || 'https://placehold.co/40x40.png',
        username: newUserProfile.username,
      },
    },
    lastMessage: {
        text: WELCOME_MESSAGE,
        senderId: MONTANA_BOT_UID,
        timestamp: now,
    },
    updatedAt: now,
  });

  const messageRef = doc(collection(conversationRef, 'messages'));
  batch.set(messageRef, welcomeMessageData);

  try {
    await batch.commit();
  } catch (error) {
    console.error("Failed to send welcome message:", error);
  }
};


/**
 * Sets up a real-time listener for a user's conversations.
 * @param userId The ID of the current user.
 * @param onUpdate A callback function that receives the updated list of conversations.
 * @returns An unsubscribe function to detach the listener.
 */
export const getConversations = (userId: string, onUpdate: (conversations: Conversation[]) => void) => {
  if (!firestore) throw new Error("Firestore not initialized");

  const q = query(
    collection(firestore, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const conversations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Conversation;
    });
    onUpdate(conversations);
  }, (error) => {
    console.error("Error fetching conversations: ", error);
    onUpdate([]);
  });

  return unsubscribe;
};

/**
 * Sets up a real-time listener for messages within a specific conversation.
 * @param conversationId The ID of the conversation.
 * @param onUpdate A callback function that receives the updated list of messages.
 * @returns An unsubscribe function to detach the listener.
 */
export const getMessages = (conversationId: string, onUpdate: (messages: Message[]) => void) => {
  if (!firestore) throw new Error("Firestore not initialized");

  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    onUpdate(messages);
  }, (error) => {
    console.error("Error fetching messages: ", error);
    onUpdate([]);
  });

  return unsubscribe;
};

/**
 * Sends a new message to a conversation.
 * @param conversationId The ID of the conversation.
 * @param senderId The ID of the user sending the message.
 * @param text The content of the message.
 */
export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  if (!firestore) throw new Error("Firestore not initialized");

  const conversationRef = doc(firestore, 'conversations', conversationId);
  const messageRef = collection(conversationRef, 'messages');

  const now = serverTimestamp();
  
  const batch = writeBatch(firestore);

  // Add the new message
  const newMessageRef = doc(messageRef);
  batch.set(newMessageRef, {
    senderId,
    text,
    timestamp: now,
  });

  // Update the conversation's lastMessage and updatedAt fields
  batch.update(conversationRef, {
    lastMessage: {
      senderId,
      text,
      timestamp: now,
    },
    updatedAt: now,
  });

  await batch.commit();
};


/**
 * Creates a new group conversation.
 * @param creatorId The user ID of the person creating the group.
 * @param participantIds An array of user IDs to include in the group.
 * @param groupName The name of the new group.
 * @returns The ID of the newly created conversation.
 */
export const createGroupConversation = async (creatorId: string, participantIds: string[], groupName: string) => {
    if (!firestore) throw new Error("Firestore not initialized");
    if (participantIds.length === 0) throw new Error("A group must have at least one other participant.");
    if (!groupName.trim()) throw new Error("Group must have a name.");

    const allParticipantIds = Array.from(new Set([creatorId, ...participantIds]));
    if (allParticipantIds.length < 2) throw new Error("A group chat needs at least two people.");

    const profiles = await getMultipleUserProfiles(allParticipantIds);

    const participantInfo: Record<string, ConversationParticipant> = {};
    allParticipantIds.forEach(id => {
        const profile = profiles[id];
        if (profile) {
            participantInfo[id] = {
                name: profile.name,
                username: profile.username,
                avatarUrl: profile.avatarUrl || 'https://placehold.co/40x40.png',
            };
        }
    });

    const conversationsRef = collection(firestore, 'conversations');
    const newConversationRef = doc(conversationsRef); // Firestore generates a unique ID

    const now = serverTimestamp();
    const creatorName = profiles[creatorId]?.name || 'a user';

    await setDoc(newConversationRef, {
        name: groupName,
        type: 'group',
        participants: allParticipantIds,
        participantInfo,
        lastMessage: {
            text: `Group created by ${creatorName}.`,
            senderId: MONTANA_BOT_UID, // System message
            timestamp: now,
        },
        updatedAt: now,
        createdBy: creatorId,
        admins: [creatorId], // Creator is the first admin
    });

    return newConversationRef.id;
};
