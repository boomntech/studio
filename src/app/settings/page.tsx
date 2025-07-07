
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Moon, Sun, Languages, Database, ShieldCheck, Loader2, User as UserIcon, Check, X, CalendarIcon, Fingerprint, UploadCloud } from 'lucide-react';
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { OccupationInput } from '@/components/occupation-input';
import { InterestInput } from '@/components/interest-input';
import { getUserProfile, saveUserProfile, isUsernameTaken } from '@/services/userService';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters."})
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores."}),
  dob: z.date().optional(),
  gender: z.string().optional(),
  race: z.string().optional(),
  sexualOrientation: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  occupations: z.array(z.string()).max(5, { message: "You can select up to 5 occupations." }).optional(),
  interests: z.array(z.string()).max(5, { message: "You can select up to 5 interests." }).optional(),
});

// Real function to check username availability against Firestore
const checkUsernameAvailability = async (username: string, currentUsername?: string): Promise<{ available: boolean; suggestions: string[] }> => {
    if (username.toLowerCase() === currentUsername?.toLowerCase()) {
      return { available: true, suggestions: [] };
    }
    const isTaken = await isUsernameTaken(username);
    if (isTaken) {
        return {
            available: false,
            suggestions: [`${username}${Math.floor(Math.random() * 100)}`, `${username}_pro`, `the_${username}`],
        };
    }
    return { available: true, suggestions: [] };
};

export default function SettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [theme, setTheme] = useState('light');
    const [isMounted, setIsMounted] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    // 2FA State
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: enter phone, 2: enter code
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // Passkey State
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isBiometricLoading, setIsBiometricLoading] = useState(false);

    // Username state
    const [initialUsername, setInitialUsername] = useState('');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            username: '',
            dob: undefined,
            gender: '',
            race: '',
            sexualOrientation: '',
            city: '',
            state: '',
            occupations: [],
            interests: [],
        },
    });

    const handleUsernameCheck = useCallback(
      async (username: string) => {
        if (username.toLowerCase() === initialUsername.toLowerCase()) {
          setUsernameStatus('idle');
          profileForm.clearErrors('username');
          return;
        }
        if (username.length < 3 || profileForm.getFieldState('username').invalid) {
          setUsernameStatus('idle');
          return;
        }
        
        setUsernameStatus('checking');
        const { available, suggestions } = await checkUsernameAvailability(username, initialUsername);

        if (available) {
          setUsernameStatus('available');
          profileForm.clearErrors('username');
        } else {
          setUsernameStatus('taken');
          setUsernameSuggestions(suggestions);
          profileForm.setError('username', { type: 'manual', message: 'This username is already taken.' });
        }
      },
      [profileForm, initialUsername]
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
        setIsMounted(true);
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }

        if (user) {
            const fetchProfile = async () => {
                if (!user) return;
                const profile = await getUserProfile(user.uid);
                
                // Set initial username for checking logic
                const currentUsername = profile?.username || user.email?.split('@')[0] || 'boomnuser';
                setInitialUsername(currentUsername);
    
                // Populate form with Firestore data, falling back to Auth data
                profileForm.reset({
                    name: profile?.name || user.displayName || '',
                    username: currentUsername,
                    dob: profile?.dob, // getUserProfile converts timestamp to Date
                    gender: profile?.gender || '',
                    race: profile?.race || '',
                    sexualOrientation: profile?.sexualOrientation || '',
                    city: profile?.city || '',
                    state: profile?.state || '',
                    occupations: profile?.occupations || [],
                    interests: profile?.interests || [],
                });
            };
    
            fetchProfile();
            setIsTwoFactorEnabled(user.multiFactor.enrolledFactors.length > 0);
             // In a real app, you'd check if a passkey is registered for the user
            setIsBiometricEnabled(false); 
        }
    }, [user, profileForm]);
    
    useEffect(() => {
        if (isMounted) {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [theme, isMounted]);

    const handleThemeChange = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };

    const handleProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
        if (!user) return;
        
        if (values.username.toLowerCase() !== initialUsername.toLowerCase() && usernameStatus !== 'available') {
            profileForm.setError('username', { type: 'manual', message: 'Please choose an available username or keep your current one.' });
            return;
        }

        setIsProfileLoading(true);
        try {
            // Update display name in Firebase Auth
            if (values.name !== user.displayName) {
                await updateProfile(user, { displayName: values.name });
            }
    
            // Save all profile data to Firestore
            await saveUserProfile(user.uid, {
                email: user.email!,
                ...values,
            });
            
            if (values.username && values.username.toLowerCase() !== initialUsername.toLowerCase()) {
              setInitialUsername(values.username); // Update the initial username to the new one
            }
            toast({ title: 'Profile Updated', description: 'Your information has been successfully updated.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleSendCode = async () => {
        // Full implementation requires Firebase logic with RecaptchaVerifier
        setIsLoading(true);
        console.log('Sending verification code to:', phoneNumber);
        setTimeout(() => {
            toast({ title: 'Verification Code Sent (Simulated)', description: 'Check your phone for the code.' });
            setStep(2);
            setIsLoading(false);
        }, 1000);
    };

    const handleVerifyCode = async () => {
        // Full implementation requires Firebase logic
        setIsLoading(true);
        console.log('Verifying code:', verificationCode);
        setTimeout(() => {
            toast({ title: 'Success! (Simulated)', description: 'Two-factor authentication has been enabled.' });
            setIsTwoFactorEnabled(true);
            setIsDialogOpen(false);
            setStep(1);
            setIsLoading(false);
        }, 1000);
    };

    const handleDisable2FA = async () => {
        // Full implementation requires Firebase logic
        setIsLoading(true);
        console.log('Disabling 2FA');
        setTimeout(() => {
            toast({ title: 'Success! (Simulated)', description: 'Two-factor authentication has been disabled.' });
            setIsTwoFactorEnabled(false);
            setIsLoading(false);
        }, 1000);
    };

    const handleToggleBiometrics = () => {
        setIsBiometricLoading(true);
        // This is where you would trigger the WebAuthn API flow for registering or removing a passkey.
        setTimeout(() => {
            const newState = !isBiometricEnabled;
            setIsBiometricEnabled(newState);
            toast({
                title: `Success! (Simulated)`,
                description: `Biometric sign-in (Passkey) has been ${newState ? 'enabled' : 'disabled'}.`
            });
            setIsBiometricLoading(false);
        }, 1000);
    };

    if (!isMounted) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><UserIcon className="h-6 w-6" /><span>Profile Information</span></CardTitle>
                    <CardDescription>Update your personal details. This information is private and will not be displayed publicly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                            <FormField
                                control={profileForm.control}
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
                              control={profileForm.control}
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
                                              profileForm.setValue('username', s, { shouldValidate: true });
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
                                control={profileForm.control}
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
                                control={profileForm.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Gender</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
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
                            <FormField
                                control={profileForm.control}
                                name="race"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Race</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your race" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="american-indian">American Indian or Alaska Native</SelectItem>
                                            <SelectItem value="asian">Asian</SelectItem>
                                            <SelectItem value="black">Black or African American</SelectItem>
                                            <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                                            <SelectItem value="pacific-islander">Native Hawaiian or Other Pacific Islander</SelectItem>
                                            <SelectItem value="white">White</SelectItem>
                                            <SelectItem value="two-or-more">Two or More Races</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="sexualOrientation"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Sexual Orientation</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your sexual orientation" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="straight">Straight</SelectItem>
                                            <SelectItem value="lgbtq">LGBTQ</SelectItem>
                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={profileForm.control}
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
                                    control={profileForm.control}
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
                                control={profileForm.control}
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
                                control={profileForm.control}
                                name="interests"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Interests</FormLabel>
                                    <FormControl>
                                        <InterestInput value={field.value ?? []} onChange={field.onChange} />
                                    </FormControl>
                                    <FormDescription>
                                        Select up to 5 interests to personalize your content feed.
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isProfileLoading || usernameStatus === 'checking'}>
                                {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><ShieldCheck className="h-6 w-6" /><span>Two-Factor Authentication</span></CardTitle>
                    <CardDescription>Add an extra layer of security to your account using SMS.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isTwoFactorEnabled ? (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="font-medium">Status: Enabled</Label>
                                <p className="text-xs text-muted-foreground">You are receiving security codes via SMS.</p>
                            </div>
                            <Button variant="destructive" onClick={handleDisable2FA} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Disable
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <Label className="font-medium">Status: Disabled</Label>
                                <p className="text-xs text-muted-foreground">Protect your account with 2FA.</p>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setStep(1)}>Enable</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                                        <DialogDescription>
                                            {step === 1 ? 'Enter your phone number to receive a verification code.' : 'Enter the 6-digit code sent to your phone.'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    {step === 1 ? (
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="phone" className="text-right">Phone</Label>
                                                <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+14155552671" className="col-span-3" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="code" className="text-right">Code</Label>
                                                <Input id="code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="123456" className="col-span-3" />
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button type="button" onClick={step === 1 ? handleSendCode : handleVerifyCode} disabled={isLoading}>
                                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                             {step === 1 ? 'Send Code' : 'Verify & Enable'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Fingerprint className="h-6 w-6" /><span>Biometric Sign-in (Passkey)</span></CardTitle>
                    <CardDescription>Sign in quickly and securely using your device's fingerprint or face recognition.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="biometric-switch" className="font-medium">
                                Enable Biometric Sign-in
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {isBiometricEnabled ? "You can sign in using this device's biometrics." : "Your account is not set up for biometric sign-in."}
                            </p>
                        </div>
                        <Switch
                            id="biometric-switch"
                            checked={isBiometricEnabled}
                            onCheckedChange={handleToggleBiometrics}
                            disabled={isBiometricLoading}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="relative h-6 w-6">
                            <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute top-0 left-0 h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </div>
                        <span>Appearance</span>
                    </CardTitle>
                    <CardDescription>
                        Customize the look and feel of the app to your preference.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                        <Switch
                            id="dark-mode"
                            checked={theme === 'dark'}
                            onCheckedChange={handleThemeChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <UploadCloud className="h-6 w-6" />
                        <span>Data Management</span>
                    </CardTitle>
                    <CardDescription>
                        Manage your application's data, like importing new events.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild>
                        <Link href="/settings/import">
                            Import Events
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Languages className="h-6 w-6" />
                        <span>Language</span>
                    </CardTitle>
                    <CardDescription>
                        Choose your preferred language for the app interface.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Select defaultValue="en">
                        <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español (Spanish)</SelectItem>
                            <SelectItem value="fr">Français (French)</SelectItem>
                            <SelectItem value="de">Deutsch (German)</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Database className="h-6 w-6" />
                        <span>Data Usage</span>
                    </CardTitle>
                    <CardDescription>
                        Manage how the app uses your data to optimize performance.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="data-saver" className="font-medium">Data Saver</Label>
                            <p className="text-xs text-muted-foreground">Reduces image quality and stops videos from autoplaying.</p>
                        </div>
                        <Switch id="data-saver" />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                         <div className="space-y-0.5">
                            <Label htmlFor="video-autoplay" className="font-medium">Video Autoplay</Label>
                             <p className="text-xs text-muted-foreground">Autoplay videos on Wi-Fi and mobile data.</p>
                        </div>
                        <Switch id="video-autoplay" defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
