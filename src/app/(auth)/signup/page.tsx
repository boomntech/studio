
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import *d from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { saveUserProfile, isUsernameTaken, getUserProfile } from '@/services/userService';
import { sendInitialWelcomeMessage } from '@/services/messageService';
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
import { Loader2 } from 'lucide-react';
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
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters."})
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores."}),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


const checkUsernameAvailability = async (username: string): Promise<{ available: boolean; suggestions: string[] }> => {
    const isTaken = await isUsernameTaken(username);
    if (isTaken) {
        return {
            available: false,
            suggestions: [`${username}${Math.floor(Math.random() * 100)}`, `${username}_pro`, `the_${username}`],
        };
    }
    return { available: true, suggestions: [] };
};

const getSignupErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email address is already in use by another account.';
        case 'auth/invalid-email':
            return 'The email address is not valid.';
        case 'auth/weak-password':
            return 'The password is too weak. Please choose a stronger password.';
        default:
            return 'An unexpected error occurred during sign up. Please try again.';
    }
};

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
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
      confirmPassword: '',
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


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (usernameStatus === 'taken') {
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

    let userCredential: fbAuth.UserCredential | null = null;
    try {
      userCredential = await fbAuth.createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
    } catch (authError: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: getSignupErrorMessage(authError.code),
      });
      setIsLoading(false);
      return;
    }

    try {
      const user = userCredential.user;
      
      await fbAuth.updateProfile(user, { displayName: values.name, photoURL: undefined });
      
      const { password, confirmPassword, ...profileData } = values;
      const userProfileToSave = {
        ...profileData,
        email: user.email!,
        avatarUrl: undefined,
        interests: [],
        occupations: [],
        goals: [],
        contentPreferences: [],
      };

      await saveUserProfile(user.uid, userProfileToSave);

      await sendInitialWelcomeMessage(user.uid, {
        name: userProfileToSave.name,
        username: userProfileToSave.username,
        avatarUrl: userProfileToSave.avatarUrl,
      });

      router.push('/');
    } catch (profileError: any) {
      if (userCredential?.user) {
          try {
            await fbAuth.deleteUser(userCredential.user);
          } catch (deleteError: any)
          {
            console.error("Critical: Failed to clean up user after profile creation error.", deleteError);
          }
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: `An error occurred while setting up your profile. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Firebase not configured.' });
      return;
    }
    setIsGoogleLoading(true);
    const provider = new fbAuth.GoogleAuthProvider();

    try {
      const userCredential = await fbAuth.signInWithPopup(auth, provider);
      const user = userCredential.user;

      const existingProfile = await getUserProfile(user.uid);

      if (!existingProfile) {
        let username = user.email?.split('@')[0] || `user${Math.floor(Math.random() * 10000)}`;
        let usernameIsTaken = await isUsernameTaken(username);
        let attempts = 0;
        
        while (usernameIsTaken && attempts < 5) {
            const newUsername = `${username}${Math.floor(Math.random() * 100)}`;
            if (!(await isUsernameTaken(newUsername))) {
                username = newUsername;
                usernameIsTaken = false;
            }
            attempts++;
        }
        if(usernameIsTaken) {
            username = `user${user.uid.substring(0, 8)}`;
        }

        const profileToSave = {
            name: user.displayName || 'New User',
            username: username,
            email: user.email!,
            avatarUrl: user.photoURL || undefined,
            interests: [],
            occupations: [],
            goals: [],
            contentPreferences: [],
        };
        await saveUserProfile(user.uid, profileToSave);
        
        await sendInitialWelcomeMessage(user.uid, {
            name: profileToSave.name,
            username: profileToSave.username,
            avatarUrl: profileToSave.avatarUrl,
        });

        toast({
          title: 'Welcome to Boomn!',
          description: "We've created a profile for you. You can customize it in the settings.",
        });
      }

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
        title: 'Google Sign-Up Failed',
        description: description,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <BoomnLogo className="w-16 h-16 mx-auto text-primary" />
        <CardTitle className="mt-4">Create your account</CardTitle>
        <CardDescription>Get started on Boomn</CardDescription>
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
                  <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
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
                    <Input 
                      placeholder="your_username" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        debouncedUsernameCheck(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {usernameStatus === 'checking' && 'Checking availability...'}
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
                  <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
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
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading || usernameStatus === 'checking'}
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
              Or sign up with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleSignUp}
            >
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
              Google
            </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
