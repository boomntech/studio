import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Initialize Firebase Admin SDK
try {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY!
  );
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
} catch (e) {
    console.error('Firebase Admin SDK initialization error', e);
}

const db = getFirestore();

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
        console.log('Webhook secret or signature not found.');
        return new NextResponse('Webhook secret or signature not found.', { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { userId } = paymentIntent.metadata;
    const amountInCents = paymentIntent.amount;
    const amountInDollars = amountInCents / 100;

    if (!userId) {
        console.error('Webhook received without userId in metadata');
        return new NextResponse('User ID missing from webhook metadata', { status: 400 });
    }
    
    // Use a transaction to update the wallet and create a transaction record
    const walletRef = db.collection('wallets').doc(userId);
    const transactionRef = walletRef.collection('transactions').doc(); // New doc in subcollection

    try {
        await db.runTransaction(async (t) => {
            const walletDoc = await t.get(walletRef);
            
            let newBalance = amountInDollars;
            if (walletDoc.exists) {
                newBalance += walletDoc.data()!.balance;
            }

            // Set/update wallet
            t.set(walletRef, { 
                balance: newBalance,
                currency: 'USD',
                updatedAt: new Date(),
            }, { merge: true });

            // Create transaction record
            t.set(transactionRef, {
                type: 'credit',
                amount: amountInDollars,
                description: 'Deposit via Stripe',
                timestamp: new Date(),
            });
        });

        console.log(`Successfully updated wallet for user ${userId}.`);

    } catch (error) {
        console.error('Transaction failed: ', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
