
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as fbAuth from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
import { Loader2, Fingerprint } from 'lucide-react';
import { BoomnLogo } from '@/components/boomn-logo';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.98-4.66 1.98-3.55 0-6.42-2.93-6.42-6.55s2.87-6.55 6.42-6.55c2.03 0 3.36.83 4.13 1.55l2.44-2.32C17.46.62 15.25 0 12.48 0 5.88 0 .02 5.84.02 12.91s5.86 12.91 12.46 12.91c7.16 0 12.2-4.83 12.2-12.35 0-1.16-.1-1.84-.26-2.54z"
      fill="#4285F4"
    />
    <path
      d="M21.12 10.92H12.48v3.28h8.64c-.28 2.06-1.59 4.1-3.6 5.51l2.44 2.32c2.06-1.92 3.42-4.78 3.42-8.29 0-1.16-.1-1.84-.26-2.54z"
      fill="#34A853"
    />
     <path
      d="M3.76 14.93c-.4-1.2-.6-2.48-.6-3.82s.2-2.62.6-3.82L1.32 4.95C.52 6.8.22 8.9.22 11.11s.3 4.31 1.1 6.16z"
      fill="#FBBC05"
    />
    <path
      d="M12.48 25.82c2.97 0 5.46-1.02 7.28-2.76l-2.44-2.32c-.93.62-2.18 1-3.8 1-2.9 0-5.36-1.93-6.24-4.52l-2.44 2.32C4.18 22.99 8.02 25.82 12.48 25.82z"
      fill="#EA4335"
    />
  </svg>
);


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<fbAuth.ConfirmationResult | null>(null);

  const anyLoading = isLoading || isGoogleLoading || isPhoneLoading || isBiometricLoading;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new fbAuth.RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => { /* reCAPTCHA solved */ }
      });
      (window as any).recaptchaVerifier.render().catch((err: any) => {
        console.error("reCAPTCHA render error", err);
      });
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Configuration Not Found',
        description: 'Your Firebase API keys are missing. Please add them to the .env file in the root of your project and restart the server.',
      });
      setIsLoading(false);
      return;
    }

    try {
      await fbAuth.signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Configuration Not Found',
        description: 'Your Firebase API keys are missing. Please add them to the .env file in the root of your project and restart the server.',
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new fbAuth.GoogleAuthProvider();
    try {
      await fbAuth.signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/account-exists-with-different-credential') {
        description = 'An account with this email already exists. Please sign in with your original method (e.g., password) to use your account.';
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

  const handleBiometricSignIn = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Firebase not configured.' });
      return;
    }
    setIsBiometricLoading(true);
    try {
      const provider = new fbAuth.PasskeyAuthProvider();
      await fbAuth.signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Passkey Sign-In Failed',
        description: error.code === 'auth/cancelled-popup-request' ? 'Sign-in cancelled.' : error.message,
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSendVerificationSms = async () => {
    if (!auth) {
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
        toast({ variant: 'destructive', title: 'Failed to Send Code', description: error.message });
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
          toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
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
                    <Input placeholder="you@example.com" {...field} />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={anyLoading}
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
        <div className="grid grid-cols-2 gap-2">
           <Button
            variant="outline"
            type="button"
            disabled={anyLoading}
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
           <Button
            variant="outline"
            type="button"
            disabled={anyLoading}
            onClick={handleBiometricSignIn}
            className="w-full"
          >
            {isBiometricLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="mr-2 h-4 w-4" />
            )}
            Passkey
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
                  disabled={anyLoading}
                />
                <Button
                  variant="outline"
                  type="button"
                  disabled={anyLoading || !phoneNumber}
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
