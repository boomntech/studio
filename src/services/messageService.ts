
'use client';

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import type { UserProfile } from './userService';

const BOOMN_BOT_UID = 'boomn_bot';
const BOOMN_BOT_PROFILE = {
  uid: BOOMN_BOT_UID,
  name: 'Boomn Bot',
  username: 'boomnbot',
  avatarUrl: 'https://placehold.co/40x40.png', 
};

const WELCOME_MESSAGE = `Welcome to Boomn! 🎉 We're so excited to have you here.

Explore the feed, connect with others, and don't hesitate to reach out if you have any questions. Happy boomn'ing!`;


/**
 * Sends an initial welcome message to a new user from the Boomn Bot.
 * This creates a new conversation and the first message.
 * @param newUserId The UID of the new user.
 * @param newUserProfile The profile of the new user.
 */
export const sendInitialWelcomeMessage = async (newUserId: string, newUserProfile: Pick<UserProfile, 'name' | 'username' | 'avatarUrl'>) => {
  if (!firestore) {
    console.error("Firestore not initialized, skipping welcome message.");
    return;
  }

  // Create a deterministic conversation ID
  const participantIds = [BOOMN_BOT_UID, newUserId].sort();
  const conversationId = participantIds.join('_');
  const conversationRef = doc(firestore, 'conversations', conversationId);

  const now = serverTimestamp();
  
  const welcomeMessageData = {
      senderId: BOOMN_BOT_UID,
      text: WELCOME_MESSAGE,
      timestamp: now,
  };

  const batch = writeBatch(firestore);

  // 1. Create the conversation document
  batch.set(conversationRef, {
    participants: participantIds,
    participantInfo: {
      [BOOMN_BOT_UID]: {
        name: BOOMN_BOT_PROFILE.name,
        avatarUrl: BOOMN_BOT_PROFILE.avatarUrl,
        username: BOOMN_BOT_PROFILE.username,
      },
      [newUserId]: {
        name: newUserProfile.name,
        avatarUrl: newUserProfile.avatarUrl || 'https://placehold.co/40x40.png',
        username: newUserProfile.username,
      },
    },
    lastMessage: {
        text: WELCOME_MESSAGE,
        senderId: BOOMN_BOT_UID,
        timestamp: now,
    },
    updatedAt: now,
  });

  // 2. Add the welcome message to the subcollection
  const messageRef = doc(collection(conversationRef, 'messages'));
  batch.set(messageRef, welcomeMessageData);

  try {
    await batch.commit();
  } catch (error) {
    console.error("Failed to send welcome message:", error);
    // We don't want this to block the user's signup flow, so we just log the error.
  }
};
