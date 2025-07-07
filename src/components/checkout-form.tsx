
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
    onSuccess: () => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();

    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        // In a real application, the return_url would be a dedicated page
        // to show the status of the payment.
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/wallet`,
            },
            // By redirecting, we rely on webhooks for fulfillment.
            // When the payment succeeds, Stripe will send a webhook to your backend,
            // which will then update the user's wallet balance.
            redirect: 'if_required',
        });


        if (error) {
            setMessage(error.message || "An unexpected error occurred.");
        } else {
            // This 'else' block will only be reached if `redirect: 'if_required'`
            // does not redirect. This happens for instant payment methods.
            // For card payments, the page typically redirects.
            // The secure way to fulfill the order is by listening for webhooks.
            onSuccess();
        }

        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <Button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full mt-4">
                <span id="button-text">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay now"}
                </span>
            </Button>
            {/* Show any error or success messages */}
            {message && <div id="payment-message" className="text-sm text-destructive mt-2">{message}</div>}
        </form>
    );
}
