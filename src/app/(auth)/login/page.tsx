
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as fbAuth from 'firebase/auth';
import { auth, isFirebaseInitialized } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { BoomnLogo } from '@/components/boomn-logo';
import GoogleIcon from '@/assets/google.svg';


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const getLoginErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
    default:
      return 'An unexpected error occurred during login. Please try again.';
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<fbAuth.ConfirmationResult | null>(null);

  const anyLoading = isLoading || isGoogleLoading || isPhoneLoading;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isFirebaseInitialized) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Please add your Firebase keys to the .env file in the root of the project.',
            duration: 10000,
        });
        return;
    }

    if (auth && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new fbAuth.RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => { /* reCAPTCHA solved */ }
      });
      (window as any).recaptchaVerifier.render().catch((err: any) => {
        console.error("reCAPTCHA render error", err);
      });
    }
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isFirebaseInitialized || !auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication is currently disabled.',
        });
        return;
    }
    setIsLoading(true);

    try {
      await fbAuth.signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: getLoginErrorMessage(error.code),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseInitialized || !auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication is currently disabled.',
        });
        return;
    }
    setIsGoogleLoading(true);
    const provider = new fbAuth.GoogleAuthProvider();
    try {
      await fbAuth.signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/account-exists-with-different-credential') {
        description = 'An account with this email already exists. Please sign in with your original method (e.g., password) to use your account.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        description = 'The sign-in window was closed before completing. Please try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendVerificationSms = async () => {
    if (!isFirebaseInitialized || !auth) {
        toast({ variant: 'destructive', title: 'Firebase not configured.'});
        return;
    }
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
        toast({ variant: 'destructive', title: 'Invalid Phone Number', description: 'Please use E.164 format (e.g., +14155552671).' });
        return;
    }
    setIsPhoneLoading(true);
    try {
        const appVerifier = (window as any).recaptchaVerifier;
        const result = await fbAuth.signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(result);
        setPhoneStep('enterCode');
        toast({ title: 'Verification Code Sent', description: `A code has been sent to ${phoneNumber}.` });
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/invalid-phone-number') {
            description = 'The phone number you entered is not valid.';
        } else if (error.code === 'auth/too-many-requests') {
            description = 'You have tried to send too many codes. Please try again later.';
        }
        toast({ variant: 'destructive', title: 'Failed to Send Code', description });
    } finally {
        setIsPhoneLoading(false);
    }
  };

  const handleVerifyCode = async () => {
      if (!confirmationResult) return;
      setIsPhoneLoading(true);
      try {
          await confirmationResult.confirm(verificationCode);
          router.push('/');
      } catch (error: any) {
          let description = 'An unexpected error occurred. Please try again.';
          if (error.code === 'auth/invalid-verification-code') {
              description = 'The code you entered is incorrect. Please try again.';
          } else if (error.code === 'auth/code-expired') {
              description = 'The verification code has expired. Please request a new one.';
          }
          toast({ variant: 'destructive', title: 'Verification Failed', description });
      } finally {
          setIsPhoneLoading(false);
      }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <BoomnLogo className="w-16 h-16 mx-auto text-primary" />
        <CardTitle className="mt-4">Welcome Back!</CardTitle>
        <CardDescription>Sign in to continue to Boomn</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} disabled={!isFirebaseInitialized} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={!isFirebaseInitialized}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={anyLoading || !isFirebaseInitialized}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
           <Button
            variant="outline"
            type="button"
            disabled={anyLoading || !isFirebaseInitialized}
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
        </div>
         <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign in with phone
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {phoneStep === 'enterPhone' ? (
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+14155552671"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={anyLoading || !isFirebaseInitialized}
                />
                <Button
                  variant="outline"
                  type="button"
                  disabled={anyLoading || !phoneNumber || !isFirebaseInitialized}
                  onClick={handleSendVerificationSms}
                  className="w-auto"
                >
                  {isPhoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {phoneNumber}.</p>
               <div className="flex gap-2">
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isPhoneLoading}
                />
                 <Button
                  type="button"
                  disabled={isPhoneLoading || !verificationCode}
                  onClick={handleVerifyCode}
                  className="w-auto"
                >
                  {isPhoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
        <div id="recaptcha-container" className="my-4"></div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
