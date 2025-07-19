
'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as fbAuth from 'firebase/auth';
import { auth, isFirebaseInitialized } from '@/lib/firebase';
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
import { Loader2, Check, X } from 'lucide-react';
import { BoomnLogo } from '@/components/boomn-logo';
import { GoogleIcon } from '@/components/google-icon';


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

  useEffect(() => {
    if (!isFirebaseInitialized) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Please add your Firebase keys to the .env file in the root of the project.',
            duration: 10000,
        });
    }
  }, [toast]);


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
    if (!isFirebaseInitialized || !auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Configured',
            description: 'Authentication is currently disabled.',
        });
        return;
    }
    setIsLoading(true);

    if (usernameStatus !== 'available') {
      form.setError('username', { type: 'manual', message: 'Please choose an available username.' });
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
    if (!isFirebaseInitialized || !auth) {
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
                  <FormControl><Input placeholder="Your full name" {...field} disabled={!isFirebaseInitialized} /></FormControl>
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
                        disabled={!isFirebaseInitialized}
                        className="pr-10"
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
                  <FormControl><Input placeholder="you@example.com" {...field} disabled={!isFirebaseInitialized} /></FormControl>
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
                  <FormControl><Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseInitialized} /></FormControl>
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
                  <FormControl><Input type="password" placeholder="••••••••" {...field} disabled={!isFirebaseInitialized} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading || usernameStatus !== 'available' || !isFirebaseInitialized}
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
              disabled={isLoading || isGoogleLoading || !isFirebaseInitialized}
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
