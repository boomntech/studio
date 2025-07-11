'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/context/OnboardingContext';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft } from 'lucide-react';
import { BoomnLogo } from './boomn-logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AvatarUpload } from '@/components/avatar-upload';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { InterestInput } from '@/components/interest-input';
import { OccupationInput } from '@/components/occupation-input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MontanaTip } from '@/components/montana-tip';

const MAX_STEPS = 5;

const onboardingSchema = z.object({
  bio: z.string().max(160, "Bio cannot exceed 160 characters.").optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  avatarFile: z.any().optional(),
  interests: z.array(z.string()).max(5, "You can select up to 5 interests.").optional(),
  occupations: z.array(z.string()).max(5, "You can select up to 5 occupations.").optional(),
  isRunningBusiness: z.boolean().default(false),
  businessName: z.string().optional(),
  businessWebsite: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  goals: z.array(z.string()).max(3, "You can select up to 3 goals.").optional(),
  contentPreferences: z.array(z.string()).optional(),
}).refine(data => {
    if (data.isRunningBusiness && (!data.businessName || data.businessName.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Business name is required if you are running a business.",
    path: ["businessName"],
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

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


export function OnboardingDialog() {
  const { user } = useAuth();
  const { isOpen, close } = useOnboarding();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<Partial<OnboardingFormValues>>({});

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initialData,
  });
  
  const isRunningBusiness = form.watch('isRunningBusiness');

  useEffect(() => {
    if (user && isOpen) {
        const fetchProfile = async () => {
            const profile = await getUserProfile(user.uid);
            const defaultVals = {
                bio: profile?.bio || '',
                city: profile?.city || '',
                state: profile?.state || '',
                interests: profile?.interests || [],
                occupations: profile?.occupations || [],
                isRunningBusiness: profile?.isRunningBusiness || false,
                businessName: profile?.businessName || '',
                businessWebsite: profile?.businessWebsite || '',
                goals: profile?.goals || [],
                contentPreferences: profile?.contentPreferences || [],
            };
            setInitialData(defaultVals);
            form.reset(defaultVals);
        };
        fetchProfile();
    }
  }, [user, isOpen, form]);
  
  const handleNext = async () => {
      // No validation needed for most steps, but you could add it here if needed
      if (currentStep < MAX_STEPS) {
          setCurrentStep(currentStep + 1);
      }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const onSubmit = async (data: OnboardingFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
        let avatarUrl: string | undefined;
        if (data.avatarFile && storage) {
            const file = data.avatarFile as File;
            const avatarStorageRef = storageRef(storage, `avatars/${user.uid}`);
            await uploadBytes(avatarStorageRef, file);
            avatarUrl = await getDownloadURL(avatarStorageRef);
        }

        const { avatarFile, ...profileData } = data;
        
        await updateUserProfile(user.uid, {
            ...profileData,
            avatarUrl: avatarUrl, // only updates if a new avatar was uploaded
            profileCompleted: true, // Mark as completed!
        });

        toast({ title: 'Profile Setup Complete!', description: "Welcome to Boomn! Let's explore." });
        close();
    } catch (error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: "Something went wrong", description: "Could not save your profile. Please try again."})
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
                {currentStep === 0 && <BoomnLogo className="w-16 h-16 mx-auto text-primary" />}
                <DialogTitle className="text-center text-2xl">
                    {
                        [
                            "Let's get you set up!",
                            "About You",
                            "Your Profile Picture",
                            "Your Interests",
                            "Your Work",
                            "Your Goals"
                        ][currentStep]
                    }
                </DialogTitle>
                <DialogDescription className="text-center">
                    {
                         [
                            "Complete your profile to get the most out of Boomn. This will only take a minute!",
                            "Tell us a little about yourself. This helps us connect you with the right people.",
                            "A great profile picture helps people recognize you.",
                            "What are you passionate about? Select up to 5.",
                            "Let others know what you do. This helps with networking.",
                            "What do you want to achieve on Boomn?"
                        ][currentStep]
                    }
                </DialogDescription>
            </DialogHeader>
            
            <Progress value={(currentStep / MAX_STEPS) * 100} className="my-4" />

            <div className="py-4 space-y-4">
                {currentStep === 1 && (
                    <>
                    <MontanaTip tip="Your bio and location are key to making connections. Keep it short, sweet, and to the point!" />
                    <FormField name="bio" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Bio</FormLabel> <FormControl> <Textarea placeholder="e.g., Serial entrepreneur, coffee enthusiast, and dog lover." {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="city" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>City</FormLabel> <FormControl> <Input placeholder="e.g. San Francisco" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                        <FormField name="state" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>State / Province</FormLabel> <FormControl> <Input placeholder="e.g. California" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    </>
                )}
                 {currentStep === 2 && (
                    <>
                    <MontanaTip tip="Use a clear, professional photo where your face is visible. No avatars from the metaverse, please! 😉" />
                    <FormField name="avatarFile" control={form.control} render={({ field }) => (
                         <FormItem>
                             <FormControl>
                                <AvatarUpload onFileChange={file => field.onChange(file)} initialImageUrl={user?.photoURL || undefined} fallbackText={user?.displayName?.charAt(0) || 'U'} />
                             </FormControl>
                             <FormMessage className="text-center" />
                         </FormItem>
                     )} />
                    </>
                )}
                 {currentStep === 3 && (
                     <>
                        <MontanaTip tip="Your interests help me recommend content and people you'll actually like. The more specific, the better!" />
                        <FormField name="interests" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Interests</FormLabel> <FormControl> <InterestInput value={field.value ?? []} onChange={field.onChange} /> </FormControl> <FormMessage /> </FormItem> )} />
                     </>
                )}
                {currentStep === 4 && (
                    <>
                     <MontanaTip tip="Whether you're a CEO or a freelance artist, your professional info helps build your network." />
                     <FormField name="occupations" control={form.control} render={({ field }) => ( <FormItem> <FormLabel>Occupation(s)</FormLabel> <FormControl> <OccupationInput value={field.value ?? []} onChange={field.onChange} /> </FormControl> <FormMessage /> </FormItem> )} />
                     <FormField control={form.control} name="isRunningBusiness" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"> <div className="space-y-0.5"> <FormLabel>Are you currently running a business?</FormLabel> </div> <FormControl> <Switch checked={field.value} onCheckedChange={field.onChange} /> </FormControl> </FormItem> )} />
                     {isRunningBusiness && (
                        <div className="space-y-4">
                            <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem> <FormLabel>Business Name</FormLabel> <FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                            <FormField control={form.control} name="businessWebsite" render={({ field }) => ( <FormItem> <FormLabel>Business Website</FormLabel> <FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                        </div>
                     )}
                    </>
                )}
                 {currentStep === 5 && (
                    <div className="space-y-6">
                        <MontanaTip tip="Knowing your goals helps me tailor your entire experience, from the content you see to the connections you make." />
                        <FormField
                            control={form.control}
                            name="goals"
                            render={({ field }) => (
                                <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">What are your goals on Boomn?</FormLabel>
                                    <FormDescription>Select up to 3.</FormDescription>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                    {goals.map((item) => (
                                        <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-secondary">
                                            <Checkbox
                                                id={`goal_${item.id}`}
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
                                            <Label htmlFor={`goal_${item.id}`} className="font-normal text-sm cursor-pointer">{item.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contentPreferences"
                            render={({ field }) => (
                                <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">What kind of content interests you?</FormLabel>
                                    <FormDescription>This helps us build your 'For You' feed.</FormDescription>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                    {contentPreferences.map((item) => (
                                        <div key={item.id} className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-secondary">
                                            <Checkbox
                                                id={`content_${item.id}`}
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
                                            <Label htmlFor={`content_${item.id}`} className="font-normal text-sm cursor-pointer">{item.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                 )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between sm:flex-row-reverse mt-4">
                 {currentStep < MAX_STEPS ? (
                    <Button type="button" onClick={handleNext}>
                        Next
                    </Button>
                ) : (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finish Setup
                    </Button>
                )}

                {currentStep === 0 && (
                     <Button type="button" variant="secondary" onClick={close}>
                        Skip for Now
                    </Button>
                )}
                 {currentStep > 0 && (
                    <Button type="button" variant="outline" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
