
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { getWallet, getTransactions, sendMoney, type Wallet, type Transaction } from '@/services/walletService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowUpRight, Plus, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/checkout-form';


// Form schema for sending money
const sendMoneyFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }).min(0.01, { message: 'Amount must be at least $0.01.' }),
});

const addMoneyFormSchema = z.object({
    amount: z.coerce.number().min(1, { message: 'Amount must be at least $1.00.'}),
});

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
    : Promise.resolve(null);

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const sendMoneyForm = useForm<z.infer<typeof sendMoneyFormSchema>>({
    resolver: zodResolver(sendMoneyFormSchema),
    defaultValues: {
      username: '',
      amount: 0,
    },
  });

  const addMoneyForm = useForm<z.infer<typeof addMoneyFormSchema>>({
    resolver: zodResolver(addMoneyFormSchema),
    defaultValues: {
        amount: 10,
    }
  });

  const fetchWalletData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [walletData, transactionsData] = await Promise.all([
        getWallet(user.uid),
        getTransactions(user.uid),
      ]);
      setWallet(walletData);
      setTransactions(transactionsData);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error fetching wallet data', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.warn("Stripe publishable key is not set. Payment functionality will be disabled.");
    }
    if (user) {
        fetchWalletData();
    }
  }, [user, fetchWalletData]);

  const onSendMoneySubmit = async (values: z.infer<typeof sendMoneyFormSchema>) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await sendMoney(user.uid, values.username, values.amount);
      toast({ title: 'Success!', description: `You sent $${values.amount.toFixed(2)} to @${values.username}.` });
      sendMoneyForm.reset();
      setIsSendDialogOpen(false);
      fetchWalletData();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Transaction Failed', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePaymentIntent = async (values: z.infer<typeof addMoneyFormSchema>) => {
    if (!user) return;
    setIsProcessing(true);
    try {
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: values.amount * 100, // Convert to cents
                userId: user.uid,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent.');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsProcessing(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), 'PP');
    }
    // Handle the case where timestamp might be a JS Date from a fresh webhook update
    if (timestamp instanceof Date) {
        return format(timestamp, 'PP');
    }
    // Fallback for serialized data or other formats
    if (typeof timestamp === 'object' && timestamp.seconds) {
        return format(new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate(), 'PP');
    }
    return 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available funds</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
                setClientSecret(null); // Reset on close
                addMoneyForm.reset();
                fetchWalletData(); // Refetch data in case a payment was made
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2" disabled={!stripePromise}>
                    <Plus className="w-6 h-6" />
                    <span>Add Money</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Money to Wallet</DialogTitle>
                    <DialogDescription>
                        {clientSecret ? 'Complete your payment below.' : 'Enter the amount you wish to add.'}
                    </DialogDescription>
                </DialogHeader>
                 {clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm />
                    </Elements>
                 ) : (
                    <Form {...addMoneyForm}>
                        <form onSubmit={addMoneyForm.handleSubmit(handleCreatePaymentIntent)} className="space-y-4">
                            <FormField
                                control={addMoneyForm.control}
                                name="amount"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (USD)</FormLabel>
                                    <FormControl>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-muted-foreground sm:text-sm">$</span>
                                        </div>
                                        <Input type="number" placeholder="10.00" className="pl-7" {...field} />
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isProcessing} className="w-full">
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue
                            </Button>
                        </form>
                    </Form>
                 )}
            </DialogContent>
        </Dialog>
        
        <Button variant="outline" className="h-20 flex-col gap-2" disabled>
          <ArrowUpRight className="w-6 h-6" />
          <span>Withdraw</span>
        </Button>
        
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2">
                    <Send className="w-6 h-6" />
                    <span>Send</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Money</DialogTitle>
                    <DialogDescription>Enter the username and amount you want to send.</DialogDescription>
                </DialogHeader>
                <Form {...sendMoneyForm}>
                    <form onSubmit={sendMoneyForm.handleSubmit(onSendMoneySubmit)} className="space-y-4">
                        <FormField
                            control={sendMoneyForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recipient's Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="@username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={sendMoneyForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (USD)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-muted-foreground sm:text-sm">$</span>
                                            </div>
                                            <Input type="number" placeholder="0.00" className="pl-7" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        
        <Button variant="outline" className="h-20 flex-col gap-2" disabled>
          <ArrowDownLeft className="w-6 h-6" />
          <span>Receive</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(tx.timestamp)}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        tx.type === 'credit' ? 'text-green-500' : 'text-foreground'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No transactions yet.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
