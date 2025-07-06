'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Languages, Database } from 'lucide-react';

export default function SettingsPage() {
    const [theme, setTheme] = useState('light');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedTheme = localStorage.getItem('theme');
        // Set initial theme based on localStorage or system preference
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);
    
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
    
    if (!isMounted) {
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
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
