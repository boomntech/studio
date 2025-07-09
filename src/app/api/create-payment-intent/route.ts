
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Initialize Firebase Admin SDK
if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
    } else {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({ credential: cert(serviceAccount) });
        } catch (e) {
            console.error('Firebase Admin SDK initialization error in create-payment-intent: Failed to parse service account key.', e);
        }
    }
}


export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || !userId) {
      return NextResponse.json({ error: 'Missing amount or userId' }, { status: 400 });
    }

    if (amount < 100) { // Enforce a minimum of $1.00 (Stripe amount is in cents)
        return NextResponse.json({ error: 'Amount must be at least $1.00' }, { status: 400 });
    }

    // In a production app, you should verify the userId against an authenticated session.
    // For example, by verifying a Firebase Auth ID token sent from the client.

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { userId },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
