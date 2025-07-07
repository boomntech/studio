
'use client';

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  Timestamp,
  addDoc,
  query,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';
import { findUserByUsername, type UserProfile } from './userService';

export interface Wallet {
  id: string; // same as userId
  balance: number;
  currency: 'USD';
  updatedAt: Timestamp;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: Timestamp;
  counterparty?: {
      uid: string;
      name: string;
      username: string;
  }
}

/**
 * Gets a user's wallet, creating one if it doesn't exist.
 * @param userId The user's ID.
 * @returns The user's wallet data.
 */
export const getWallet = async (userId: string): Promise<Wallet> => {
  if (!firestore) throw new Error("Firestore not initialized");
  const walletRef = doc(firestore, 'wallets', userId);
  const docSnap = await getDoc(walletRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Wallet;
  } else {
    // Create a new wallet with a starting balance of $100 for demo purposes
    const newWallet: Omit<Wallet, 'id'> = {
      balance: 100.00,
      currency: 'USD',
      updatedAt: Timestamp.now(),
    };
    await setDoc(walletRef, newWallet);
    return { id: userId, ...newWallet };
  }
};

/**
 * Retrieves the most recent transactions for a user.
 * @param userId The user's ID.
 * @returns A promise that resolves to an array of transactions.
 */
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const transactionsRef = collection(firestore, 'wallets', userId, 'transactions');
    const q = query(transactionsRef, orderBy('timestamp', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Transaction));
};


/**
 * Sends money from one user to another.
 * This function is transactional, ensuring that both balances are updated correctly.
 * @param fromUserId The ID of the user sending money.
 * @param toUsername The username of the user receiving money.
 * @param amount The amount to send.
 * @returns A promise that resolves when the transaction is complete.
 */
export const sendMoney = async (fromUserId: string, toUsername: string, amount: number) => {
    if (!firestore) throw new Error("Firestore not initialized");
    if (amount <= 0) throw new Error("Amount must be positive.");

    const fromUserDoc = await getDoc(doc(firestore, 'users', fromUserId));
    if (!fromUserDoc.exists()) throw new Error("Sender profile not found.");
    const fromUserProfile = fromUserDoc.data() as UserProfile;

    const toUser = await findUserByUsername(toUsername);
    if (!toUser) throw new Error(`User with username "${toUsername}" not found.`);
    if (toUser.uid === fromUserId) throw new Error("You cannot send money to yourself.");

    const fromWalletRef = doc(firestore, 'wallets', fromUserId);
    const toWalletRef = doc(firestore, 'wallets', toUser.uid);

    await runTransaction(firestore, async (transaction) => {
        const fromWalletDoc = await transaction.get(fromWalletRef);
        
        let fromBalance = 0;
        if (fromWalletDoc.exists()) {
            fromBalance = fromWalletDoc.data().balance;
        }

        if (fromBalance < amount) {
            throw new Error("Insufficient funds.");
        }

        // Ensure the recipient's wallet exists before proceeding
        const toWalletDoc = await transaction.get(toWalletRef);
        if (!toWalletDoc.exists()) {
           // Create a new wallet for the recipient if it doesn't exist
            transaction.set(toWalletRef, {
                balance: 0,
                currency: 'USD',
                updatedAt: Timestamp.now(),
            });
        }
        
        // Update balances
        transaction.set(fromWalletRef, { balance: fromBalance - amount, updatedAt: Timestamp.now() }, { merge: true });
        transaction.set(toWalletRef, { balance: (toWalletDoc.data()?.balance || 0) + amount, updatedAt: Timestamp.now() }, { merge: true });

        // Create transaction records
        const fromTransactionRef = doc(collection(firestore, 'wallets', fromUserId, 'transactions'));
        transaction.set(fromTransactionRef, {
            type: 'debit',
            amount,
            description: `Sent to @${toUser.username}`,
            timestamp: Timestamp.now(),
            counterparty: {
                uid: toUser.uid,
                name: toUser.name,
                username: toUser.username
            }
        });

        const toTransactionRef = doc(collection(firestore, 'wallets', toUser.uid, 'transactions'));
        transaction.set(toTransactionRef, {
            type: 'credit',
            amount,
            description: `Received from @${fromUserProfile.username}`,
            timestamp: Timestamp.now(),
            counterparty: {
                uid: fromUserProfile.uid,
                name: fromUserProfile.name,
                username: fromUserProfile.username
            }
        });
    });
};

/**
 * (Simulated) Adds money to a user's wallet.
 * In a real application, this function would be triggered after a successful
 * payment intent from a payment provider like Stripe.
 * @param userId The user's ID.
 * @param amount The amount to add.
 */
export const addMoney = async (userId: string, amount: number) => {
    if (!firestore) throw new Error("Firestore not initialized");
    if (amount <= 0) throw new Error("Amount must be positive.");

    // TODO: In a real application, you would not call this directly from the client.
    // 1. Create a payment intent on your backend with Stripe's API.
    // 2. Use Stripe Elements on the frontend to confirm the payment.
    // 3. On successful payment, Stripe sends a webhook to your backend.
    // 4. Your backend webhook handler verifies the event and then calls this function to update the balance.

    const walletRef = doc(firestore, 'wallets', userId);

    await runTransaction(firestore, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        
        let currentBalance = 0;
        if (walletDoc.exists()) {
            currentBalance = walletDoc.data().balance;
        } else {
            // This case should ideally not be hit if getWallet is called first,
            // but it's good practice to handle it.
            transaction.set(walletRef, {
                balance: 0,
                currency: 'USD',
                updatedAt: Timestamp.now(),
            });
        }

        // Update balance
        transaction.update(walletRef, {
            balance: currentBalance + amount,
            updatedAt: Timestamp.now(),
        });

        // Create transaction record
        const transactionRef = doc(collection(firestore, 'wallets', userId, 'transactions'));
        transaction.set(transactionRef, {
            type: 'credit',
            amount,
            description: 'Deposit from payment provider',
            timestamp: Timestamp.now(),
        });
    });
};
