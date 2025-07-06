
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Moon, Sun, Languages, Database, ShieldCheck, Loader2, User as UserIcon } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

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

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        setIsMounted(true);
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }

        if (user) {
            setIsTwoFactorEnabled(user.multiFactor.enrolledFactors.length > 0);
            profileForm.reset({ name: user.displayName || '' });
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

    const handleProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
        if (!user) return;
        setIsProfileLoading(true);
        try {
            await updateProfile(user, { displayName: values.name });
            toast({ title: 'Profile Updated', description: 'Your name has been successfully updated.' });
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

    if (!isMounted) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><UserIcon className="h-6 w-6" /><span>Profile Information</span></CardTitle>
                    <CardDescription>Update your personal details like your name.</CardDescription>
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
                            <Button type="submit" disabled={isProfileLoading}>
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
