'use client';

import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

export interface Event {
  id: string;
  title: string;
  date: any; // Firestore Timestamp
  time?: string;
  location: string;
  image: string;
  dataAiHint: string;
  description: string;
  ticketLink?: string;
}

export const getEvents = async (): Promise<Event[]> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const eventsCollection = collection(firestore, 'events');
    const q = query(eventsCollection, orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
        return {
            id: doc.id,
            ...data,
            date,
        } as Event;
    });
};

export const getEventById = async (id: string): Promise<Event | null> => {
    if (!firestore) throw new Error("Firestore not initialized");
    const eventRef = doc(firestore, 'events', id);
    const docSnap = await getDoc(eventRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
        return {
            id: docSnap.id,
            ...data,
            date,
        } as Event;
    }
    return null;
}


/**
 * Saves a batch of events to the 'events' collection in Firestore.
 * @param events An array of event objects to save.
 */
export const saveEventsBatch = async (events: Omit<Event, 'id'>[]): Promise<void> => {
  if (!firestore) throw new Error("Firestore not initialized");

  const batch = writeBatch(firestore);
  const eventsCollection = collection(firestore, 'events');

  events.forEach(eventData => {
    const newEventRef = doc(eventsCollection); // Create a new document with a unique ID
    batch.set(newEventRef, eventData);
  });

  await batch.commit();
};
