
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import * as fbAuth from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
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
import { Loader2, Mail, Phone, Check, X, CalendarIcon } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { LocationAutocomplete } from '@/components/location-autocomplete';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/avatar-upload';
import { MontanaTip } from '@/components/montana-tip';


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
  
  // Step 2
  dob: z.date({ required_error: "A date of birth is required." }),
  gender: z.string({ required_error: "Please select a gender." }),
  race: z.string().optional(),
  sexualOrientation: z.string().optional(),

  // Step 3
  country: z.string().min(1, { message: "Country is required." }),
  city: z.string().min(1, { message: 'City is required.' }),
  state: z.string().min(1, { message: 'State is required.' }),

  // Step 4
  occupations: z.array(z.string()).max(5, { message: "You can select up to 5 occupations." }).optional(),
  industry: z.string().optional(),
  isRunningBusiness: z.boolean().default(false).optional(),
  businessName: z.string().optional(),
  businessWebsite: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),

  // Step 5
  interests: z.array(z.string()).min(1, { message: "Please select at least one interest." }).max(5, { message: "You can select up to 5 interests." }),
  goals: z.array(z.string()).min(1, {message: 'Please select at least one goal.'}).max(3, { message: "You can select up to 3 goals." }).optional(),
  contentPreferences: z.array(z.string()).min(1, {message: 'Please select at least one content type.'}).optional(),

  // Step 6
  bio: z.string().max(160, { message: "Bio cannot exceed 160 characters." }).optional(),

}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
}).refine(data => {
    if (data.isRunningBusiness && (!data.businessName || data.businessName.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Business name is required if you are running a business.",
    path: ["businessName"],
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

const stepTitles = ["Create your account", "Tell us about yourself", "Where are you from?", "Customize your profile", "Interests & Goals", "Set up your profile"];
const stepDescriptions = [
    "Get started with the basics.", 
    "This helps us personalize your experience.", 
    "This helps connect you with people and events nearby.",
    "Tell us about your professional background.",
    "Fuel algorithmic discovery and networking.",
    "This is optional. You can always do this later."
];
const goals = [
  { id: 'grow_audience', label: 'Grow my audience' },
  { id: 'find_clients', label: 'Find new clients' },
  { id: 'learn_skills', label: 'Learn new skills' },
  { id: 'network_peers', label: 'Network with peers' },
  { id: 'hire_talent', label: 'Hire talent' },
  { id: 'discover_content', label: 'Discover content' },
] as const;

const contentPreferences = [
    { id: 'tips_tutorials', label: 'Tips & Tutorials' },
    { id: 'success_stories', label: 'Success Stories' },
    { id: 'templates_tools', label: 'Templates & Tools' },
    { id: 'news_updates', label: 'News & Updates' },
    { id: 'case_studies', label: 'Case Studies' },
    { id: 'live_discussions', label: 'Live Discussions' },
] as const;


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [emailForLink, setEmailForLink] = useState('');
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'enterPhone' | 'enterCode'>('enterPhone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<fbAuth.ConfirmationResult | null>(null);

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
      country: '',
      city: '',
      state: '',
      occupations: [],
      interests: [],
      goals: [],
      contentPreferences: [],
      enableTwoFactor: false,
      industry: '',
      isRunningBusiness: false,
      businessName: '',
      businessWebsite: '',
      bio: '',
      dob: undefined,
    },
  });
  
  const isRunningBusiness = form.watch('isRunningBusiness');

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
      (window as any).recaptchaVerifier = new fbAuth.RecaptchaVerifier(auth, 'recaptcha-container', {
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
      fieldsToValidate = ['dob', 'gender'];
    }
    if (step === 3) {
      fieldsToValidate = ['country', 'city', 'state'];
    }
    if (step === 4) {
      fieldsToValidate = ['occupations', 'industry', 'isRunningBusiness', 'businessName', 'businessWebsite'];
    }
    if (step === 5) {
      fieldsToValidate = ['interests', 'goals', 'contentPreferences'];
    }
     if (step === 6) {
      fieldsToValidate = ['bio'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (step < 6) {
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

    let userCredential: fbAuth.UserCredential | null = null;
    try {
      // Step 1: Create user in Firebase Auth.
      userCredential = await fbAuth.createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
    } catch (authError: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: authError.message,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Step 2-5: Set up user profile, avatar, etc.
      const user = userCredential.user;
      let finalAvatarUrl = '';
      if (avatarFile && storage) {
        const avatarStorageRef = storageRef(storage, `avatars/${user.uid}`);
        await uploadBytes(avatarStorageRef, avatarFile);
        finalAvatarUrl = await getDownloadURL(avatarStorageRef);
      }
      
      await fbAuth.updateProfile(user, { displayName: values.name, photoURL: finalAvatarUrl });
      
      const { password, confirmPassword, enableTwoFactor, ...profileData } = values;
      const userProfileToSave = {
        ...profileData,
        email: user.email!,
        avatarUrl: finalAvatarUrl || undefined,
      };

      await saveUserProfile(user.uid, userProfileToSave);

      await sendInitialWelcomeMessage(user.uid, {
        name: userProfileToSave.name,
        username: userProfileToSave.username,
        avatarUrl: userProfileToSave.avatarUrl,
      });

      router.push('/');
    } catch (profileError: any) {
      // This is the cleanup step. If profile setup fails, delete the auth user.
      try {
        await fbAuth.deleteUser(userCredential.user);
      } catch (deleteError: any) {
        console.error("Critical: Failed to clean up user after profile creation error.", deleteError);
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
            <Progress value={(step / 6) * 100} className="w-full" />
            <p className="text-sm font-medium text-muted-foreground">Step {step} of 6</p>
            <CardTitle>{stepTitles[step - 1]}</CardTitle>
            <CardDescription>{stepDescriptions[step - 1]}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {step === 1 && (
              <>
                <MontanaTip tip="Let's get the basics down first. Choose a unique username that represents you!" />
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
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <MontanaTip tip="Tell me a bit about you. This info helps me personalize your experience on Boomn." />
                <div className="space-y-4">
                  <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Date of birth</FormLabel> <Popover> <PopoverTrigger asChild> <FormControl> <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>} <CalendarIcon className="ml-auto h-4 w-4 opacity-50" /> </Button> </FormControl> </PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="gender" render={({ field }) => ( <FormItem> <FormLabel>Gender</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your gender" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="male">Male</SelectItem> <SelectItem value="female">Female</SelectItem> <SelectItem value="non-binary">Non-binary</SelectItem> <SelectItem value="other">Other</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="race" render={({ field }) => ( <FormItem> <FormLabel>Race (Optional)</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your race" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="american-indian">American Indian or Alaska Native</SelectItem> <SelectItem value="asian">Asian</SelectItem> <SelectItem value="black">Black or African American</SelectItem> <SelectItem value="hispanic">Hispanic or Latino</SelectItem> <SelectItem value="pacific-islander">Native Hawaiian or Other Pacific Islander</SelectItem> <SelectItem value="white">White</SelectItem> <SelectItem value="two-or-more">Two or More Races</SelectItem> <SelectItem value="other">Other</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent> </Select> <FormDescription>This helps us recommend diverse communities and content.</FormDescription><FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="sexualOrientation" render={({ field }) => ( <FormItem> <FormLabel>Sexual Orientation (Optional)</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your sexual orientation" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="straight">Straight</SelectItem> <SelectItem value="lgbtq">LGBTQ+</SelectItem> <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                </div>
              </>
            )}

            {step === 3 && (
                <>
                  <MontanaTip tip="Where in the world are you? This helps connect you with people and events in your area." />
                  <div className="space-y-4">
                      <FormItem>
                          <FormLabel>Search for your Location</FormLabel>
                          <FormControl>
                              <LocationAutocomplete />
                          </FormControl>
                          <FormDescription>
                              Select your city from the list to autofill the fields below.
                          </FormDescription>
                      </FormItem>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g. United States" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                </>
            )}

            {step === 4 && (
              <>
                <MontanaTip tip="What do you do? Adding your professional details helps you network with the right people." />
                <div className="space-y-4">
                  <FormField control={form.control} name="occupations" render={({ field }) => ( <FormItem> <FormLabel>Occupations</FormLabel> <FormControl> <OccupationInput value={field.value ?? []} onChange={field.onChange} /> </FormControl> <FormDescription> Select up to 5 occupations. Start typing to get AI-powered suggestions. </FormDescription> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="industry" render={({ field }) => ( <FormItem> <FormLabel>Industry</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select your industry" /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="technology">Technology</SelectItem> <SelectItem value="marketing">Marketing</SelectItem> <SelectItem value="design">Design</SelectItem> <SelectItem value="e-commerce">E-commerce</SelectItem> <SelectItem value="content-creation">Content Creation</SelectItem> <SelectItem value="other">Other</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                  <FormField control={form.control} name="isRunningBusiness" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"> <div className="space-y-0.5"> <FormLabel>Are you currently running a business?</FormLabel> </div> <FormControl> <Switch checked={field.value} onCheckedChange={field.onChange} /> </FormControl> </FormItem> )} />
                  {isRunningBusiness && (
                    <div className="space-y-4">
                       <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem> <FormLabel>Business Name</FormLabel> <FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                       <FormField control={form.control} name="businessWebsite" render={({ field }) => ( <FormItem> <FormLabel>Business Website (Optional)</FormLabel> <FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <MontanaTip tip="What are you into? Your interests and goals fuel the 'For You' feed and help you find your community." />
                <div className="space-y-4">
                  <FormField control={form.control} name="interests" render={({ field }) => ( <FormItem> <FormLabel>Interests</FormLabel> <FormControl> <InterestInput value={field.value ?? []} onChange={field.onChange} /> </FormControl> <FormDescription> Select up to 5 interests. This will help us recommend relevant content. </FormDescription> <FormMessage /> </FormItem> )} />
                    <FormField
                      control={form.control}
                      name="goals"
                      render={() => (
                          <FormItem>
                          <FormLabel>What are your goals?</FormLabel>
                          <FormDescription>Select up to 3 that are most important to you.</FormDescription>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              {goals.map((item) => (
                              <FormField
                                  key={item.id}
                                  control={form.control}
                                  name="goals"
                                  render={({ field }) => {
                                  return (
                                      <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                          <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                              const currentValue = field.value ?? [];
                                              if (checked) {
                                                  if (currentValue.length < 3) {
                                                      field.onChange([...currentValue, item.id]);
                                                  } else {
                                                      toast({ variant: 'destructive', title: 'You can only select up to 3 goals.'});
                                                  }
                                              } else {
                                                  field.onChange(currentValue.filter((value) => value !== item.id));
                                              }
                                          }}
                                          />
                                      </FormControl>
                                      <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                      </FormItem>
                                  );
                                  }}
                              />
                              ))}
                          </div>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="contentPreferences"
                      render={() => (
                          <FormItem>
                          <FormLabel>What kind of content are you interested in?</FormLabel>
                          <FormDescription>This helps us tailor your feed.</FormDescription>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              {contentPreferences.map((item) => (
                              <FormField
                                  key={item.id}
                                  control={form.control}
                                  name="contentPreferences"
                                  render={({ field }) => {
                                  return (
                                      <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                          <Checkbox
                                          checked={field.value?.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                              const currentValue = field.value ?? [];
                                              return checked
                                              ? field.onChange([...currentValue, item.id])
                                              : field.onChange(
                                                  currentValue.filter(
                                                      (value) => value !== item.id
                                                  )
                                                  );
                                          }}
                                          />
                                      </FormControl>
                                      <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
                                      </FormItem>
                                  );
                                  }}
                              />
                              ))}
                          </div>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                </div>
              </>
            )}

            {step === 6 && (
                <>
                  <MontanaTip tip="Almost there! A great profile picture and bio make the best first impression." />
                  <div className="space-y-6">
                      <AvatarUpload onFileChange={setAvatarFile} fallbackText={form.getValues('name')?.charAt(0) || 'U'} />
                      <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Your Bio</FormLabel>
                              <FormControl>
                                  <Textarea
                                  placeholder="Tell us a little about yourself..."
                                  className="resize-none"
                                  {...field}
                                  />
                              </FormControl>
                               <FormDescription>
                                  A brief description of who you are. This will appear on your profile.
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
                </>
            )}


            <div className="flex gap-2 pt-4">
              {step > 1 && <Button variant="outline" type="button" className="w-full" onClick={() => setStep(s => s - 1)}>Back</Button>}
              
              {step === 6 ? (
                <Button 
                    type="button" 
                    className="w-full"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isLoading || usernameStatus === 'checking'}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish Profile
                </Button>
              ) : (
                <Button 
                    type="button" 
                    className="w-full"
                    onClick={handleNextStep}
                    disabled={isLoading || usernameStatus === 'checking'}
                >
                    Continue
                </Button>
              )}
            </div>
             {step === 6 && (
                <Button 
                    variant="link" 
                    type="button" 
                    className="w-full"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isLoading || usernameStatus === 'checking'}
                >
                    Skip for now
                </Button>
            )}
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
            >
              <Phone className="mr-2 h-4 w-4" />
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
