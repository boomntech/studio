
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
import { saveUserProfile, isUsernameTaken } from '@/services/userService';
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
import { Progress } from '@/components/ui/progress';

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
  // Step 1
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters."})
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores."}),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  enableTwoFactor: z.boolean().default(false).optional(),
  enableBiometrics: z.boolean().default(false).optional(),
  
  // Step 2
  dob: z.date({ required_error: "A date of birth is required." }),
  gender: z.string({ required_error: "Please select a gender." }),
  race: z.string().optional(),
  sexualOrientation: z.string().optional(),
  city: z.string().min(1, { message: 'City is required.' }),
  state: z.string().min(1, { message: 'State is required.' }),

  // Step 3
  occupations: z.array(z.string()).max(5, { message: "You can select up to 5 occupations." }).optional(),
  interests: z.array(z.string()).max(5, { message: "You can select up to 5 interests." }).optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// Real function to check username availability against Firestore
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

const stepTitles = ["Create your account", "Tell us about yourself", "Customize your profile"];
const stepDescriptions = [
    "Get started with the basics.", 
    "This helps us personalize your experience.", 
    "What are your professional and personal interests?"
];

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

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
      confirmPassword: '',
      gender: '',
      race: '',
      sexualOrientation: '',
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

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof z.infer<typeof formSchema>)[] = [];
    if (step === 1) {
      fieldsToValidate = ['name', 'username', 'email', 'password', 'confirmPassword'];
      if (usernameStatus !== 'available' && usernameStatus !== 'idle') {
        form.setError('username', { type: 'manual', message: 'Please choose an available username.' });
        return;
      }
    }
    if (step === 2) {
      fieldsToValidate = ['dob', 'gender', 'city', 'state'];
    }
    if (step === 3) {
      fieldsToValidate = ['occupations', 'interests'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (step < 3) {
      setStep(s => s + 1);
    } else {
      await form.handleSubmit(onSubmit)();
    }
  };

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await updateProfile(userCredential.user, { displayName: values.name });
      
      const { password, confirmPassword, enableTwoFactor, enableBiometrics, ...profileData } = values;
      await saveUserProfile(userCredential.user.uid, {
        ...profileData,
        email: userCredential.user.email!,
      });
      
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
    // ... (existing implementation)
  };

  const handleSendSignInLink = async () => {
    // ... (existing implementation)
  };

  const handleSendVerificationSms = async () => {
    // ... (existing implementation)
  };

  const handleVerifyCode = async () => {
      // ... (existing implementation)
  };

  return (
    <Card className="w-full max-w-md my-8">
      <CardHeader>
        <div className="flex flex-col items-center text-center space-y-4">
          <BoomnLogo className="w-16 h-16 mx-auto text-primary" />
          <div className="w-full space-y-2">
            <Progress value={(step / 3) * 100} className="w-full" />
            <CardTitle>{stepTitles[step - 1]}</CardTitle>
            <CardDescription>{stepDescriptions[step - 1]}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="enableTwoFactor"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Two-Factor Authentication</FormLabel>
                        <FormDescription>Secure your account with an extra layer of protection.</FormDescription>
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
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2"><Fingerprint className="h-4 w-4" />Enable Passkey</FormLabel>
                        <FormDescription>Sign in faster using your fingerprint or face recognition.</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Date of birth</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem> <FormLabel>Gender</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your gender" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="male">Male</SelectItem> <SelectItem value="female">Female</SelectItem> <SelectItem value="non-binary">Non-binary</SelectItem> <SelectItem value="other">Other</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="race" render={({ field }) => ( <FormItem> <FormLabel>Race</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your race" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="american-indian">American Indian or Alaska Native</SelectItem> <SelectItem value="asian">Asian</SelectItem> <SelectItem value="black">Black or African American</SelectItem> <SelectItem value="hispanic">Hispanic or Latino</SelectItem> <SelectItem value="pacific-islander">Native Hawaiian or Other Pacific Islander</SelectItem> <SelectItem value="white">White</SelectItem> <SelectItem value="two-or-more">Two or More Races</SelectItem> <SelectItem value="other">Other</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="sexualOrientation" render={({ field }) => ( <FormItem> <FormLabel>Sexual Orientation</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your sexual orientation" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="straight">Straight</SelectItem> <SelectItem value="lgbtq">LGBTQ</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>City</FormLabel> <FormControl> <Input placeholder="e.g. San Francisco" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <FormField control={form.control} name="state" render={({ field }) => ( <FormItem> <FormLabel>State / Province</FormLabel> <FormControl> <Input placeholder="e.g. California" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FormField control={form.control} name="occupations" render={({ field }) => ( <FormItem> <FormLabel>Occupations</FormLabel> <FormControl> <OccupationInput value={field.value ?? []} onChange={field.onChange} /> </FormControl> <FormDescription> Select up to 5 occupations. Start typing to get AI-powered suggestions. </FormDescription> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="interests" render={({ field }) => ( <FormItem> <FormLabel>Interests</FormLabel> <FormControl> <InterestInput value={field.value ?? []} onChange={field.onChange} /> </FormControl> <FormDescription> Select up to 5 interests. This will help us recommend relevant content. </FormDescription> <FormMessage /> </FormItem> )} />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              {step > 1 && <Button variant="outline" type="button" className="w-full" onClick={() => setStep(s => s - 1)}>Back</Button>}
              <Button 
                type="button" 
                className="w-full"
                onClick={handleNextStep}
                disabled={isLoading || usernameStatus === 'checking'}
              >
                {isLoading && step === 3 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {step === 3 ? 'Sign Up' : 'Continue'}
              </Button>
            </div>
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
        <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading}
              onClick={handleGoogleSignUp}
            >
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || isGoogleLoading || isLinkLoading || isPhoneLoading}
              onClick={handleSendVerificationSms}
            >
              {isPhoneLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
              Phone
            </Button>
        </div>
        <div id="recaptcha-container"></div>
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
