
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, Check, X, CalendarIcon, Fingerprint } from 'lucide-react';
import { BoomnLogo } from '@/components/boomn-logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OccupationInput } from '@/components/occupation-input';
import { InterestInput } from '@/components/interest-input';

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
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters."})
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores."}),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
  gender: z.string({
    required_error: "Please select a gender.",
  }),
  city: z.string().min(1, { message: 'City is required.' }),
  state: z.string().min(1, { message: 'State is required.' }),
  occupations: z.array(z.string()).max(5, { message: "You can select up to 5 occupations." }).optional(),
  interests: z.array(z.string()).max(5, { message: "You can select up to 5 interests." }).optional(),
  enableTwoFactor: z.boolean().default(false).optional(),
  enableBiometrics: z.boolean().default(false).optional(),
});

// Mock function to simulate checking username availability
const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; suggestions: string[] }> => {
    const takenUsernames = ['admin', 'root', 'test', 'user', 'boomn', 'boomnuser'];
    console.log(`Checking username: ${username}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    if (takenUsernames.includes(username.toLowerCase())) {
        return {
            available: false,
            suggestions: [`${username}${Math.floor(Math.random() * 100)}`, `${username}_pro`, `the_${username}`],
        };
    }
    return { available: true, suggestions: [] };
};

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [emailForLink, setEmailForLink] = useState('');
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      gender: '',
      city: '',
      state: '',
      occupations: [],
      interests: [],
      enableTwoFactor: false,
      enableBiometrics: false,
    },
  });

  const handleUsernameCheck = useCallback(
    async (username: string) => {
      if (username.length < 3 || form.getFieldState('username').invalid) {
        setUsernameStatus('idle');
        return;
      }
      
      setUsernameStatus('checking');
      const { available, suggestions } = await checkUsernameAvailability(username);

      if (available) {
        setUsernameStatus('available');
        form.clearErrors('username');
      } else {
        setUsernameStatus('taken');
        setUsernameSuggestions(suggestions);
        form.setError('username', { type: 'manual', message: 'This username is already taken.' });
      }
    },
    [form]
  );

  const debouncedUsernameCheck = useCallback(
    (f: (username: string) => void) => {
      let timer: NodeJS.Timeout;
      return (username: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          f(username);
        }, 500);
      };
    },
    []
  )(handleUsernameCheck);

  useEffect(() => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => { /* reCAPTCHA solved */ }
      });
      (window as any).recaptchaVerifier.render();
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (usernameStatus !== 'available') {
      form.setError('username', { type: 'manual', message: 'Please choose an available username.' });
      setIsLoading(false);
      return;
    }

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await updateProfile(userCredential.user, { displayName: values.name });
      // In a real app, you would save the username and other profile details 
      // to a Firestore database here
      console.log('User profile to save:', values);
      
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Configuration Not Found',
        description: 'Your Firebase API keys are missing. Please add them to the .env file in the root of your project and restart the server.',
      });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
        description: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendSignInLink = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Configuration Not Found',
        description: 'Your Firebase API keys are missing. Please add them to the .env file in the root of your project and restart the server.',
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForLink)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Email',
            description: 'Please enter a valid email address.',
        });
        return;
    }
    setIsLinkLoading(true);
    const actionCodeSettings = {
      url: `${window.location.origin}/login`, 
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, emailForLink, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', emailForLink);
      toast({
        title: 'Check your email',
        description: `A sign-in link has been sent to ${emailForLink}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Link',
        description: error.message,
      });
    } finally {
      setIsLinkLoading(false);
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
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
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
    <Card className="w-full max-w-md my-8">
      <CardHeader className="text-center">
        <BoomnLogo className="w-16 h-16 mx-auto text-primary" />
        <CardTitle className="mt-4">Create an Account</CardTitle>
        <CardDescription>Join Boomn today!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="your_username" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          debouncedUsernameCheck(e.target.value);
                        }}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
                        {usernameStatus === 'taken' && <X className="h-4 w-4 text-destructive" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {usernameStatus === 'available' && <span className="text-green-500">Username is available!</span>}
                    {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                      <div className="space-x-1">
                        <span>Suggestions:</span>
                        {usernameSuggestions.map((s, i) => (
                          <Button
                            key={s}
                            type="button"
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => {
                              form.setValue('username', s, { shouldValidate: true });
                              handleUsernameCheck(s);
                            }}
                          >
                            {s}{i < usernameSuggestions.length -1 && ','}
                          </Button>
                        ))}
                      </div>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. California" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormDescription>
                For a better experience, this could be integrated with a maps API.
            </FormDescription>

             <FormField
                control={form.control}
                name="occupations"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Occupations</FormLabel>
                    <FormControl>
                        <OccupationInput value={field.value ?? []} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>
                        Select up to 5 occupations. Start typing to get AI-powered suggestions.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Interests</FormLabel>
                    <FormControl>
                        <InterestInput value={field.value ?? []} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>
                        Select up to 5 interests. This will help us recommend relevant content.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />

             <FormField
              control={form.control}
              name="enableTwoFactor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Two-Factor Authentication</FormLabel>
                    <FormDescription>
                      Secure your account with an extra layer of protection using SMS.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableBiometrics"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Enable Passkey (Biometric) Sign-in
                    </FormLabel>
                    <FormDescription>
                      Sign in faster on this device using your fingerprint or face recognition.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading || usernameStatus === 'checking'}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
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
        <Button
          variant="outline"
          type="button"
          disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading}
          onClick={handleGoogleSignUp}
          className="w-full"
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or get a sign-in link
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-link">Email</Label>
            <Input
              id="email-link"
              type="email"
              placeholder="you@example.com"
              value={emailForLink}
              onChange={(e) => setEmailForLink(e.target.value)}
              disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading}
            />
          </div>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading}
            onClick={handleSendSignInLink}
            className="w-full"
          >
            {isLinkLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Email me a sign-in link
          </Button>
        </div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with phone
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
                  disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading}
                />
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading || !phoneNumber}
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
                  Verify & Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>
        <div id="recaptcha-container" className="my-4"></div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
