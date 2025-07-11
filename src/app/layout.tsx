import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { BoomnLogo } from '@/components/boomn-logo';
import { Toaster } from '@/components/ui/toaster';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/hooks/use-auth';
import { GoogleAnalytics } from '@/components/google-analytics';
import { VideoCallProvider } from '@/context/VideoCallContext';
import { MinimizedVideoCall } from '@/components/minimized-video-call';
import { OnboardingProvider } from '@/context/OnboardingContext';

export const metadata: Metadata = {
  title: 'Boomn',
  description: 'The future of social media.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const faviconSvg = `<svg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'><g fill='#FFFF00' stroke='#FFFF00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M37,25 l11,-6 v12 l-11,6 Z' /><path d='M27,25 l-11,-6 v12 l11,6 Z' /><path d='M38,27 l8,-4' fill='none' stroke='#FFFFFF' /><circle cx='47' cy='22.5' r='1.5' stroke='none' fill='#FFFFFF' /><circle cx='47' cy='22.5' r='0.75' stroke='none' fill='#FFFF00' /><path d='M26,27 l-8,-4' fill='none' stroke='#FFFFFF' /><circle cx='17' cy='22.5' r='1.5' stroke='none' fill='#FFFFFF' /><circle cx='17' cy='22.5' r='0.75' stroke='none' fill='#FFFF00' /><path stroke='none' d='M32,24 l-6,3 v10 l6,3 l6,-3 V27 l-6,-3 Z' /><path stroke='none' d='M32,40 l-5,2 v6 l5,2 l5,-2 v-6 l-5,-2 Z' /><path stroke='none' d='M32,50 l-4,1.5 v3 l4,2 l4,-2 v-3 l-4,-1.5 Z' /><path d='M27,45 h10' fill='none' stroke='#FFFFFF' stroke-width='2.5' /><path stroke='none' d='M32,14.5 l-4.5,3.5 v5 l4.5,3.5 l4.5,-3.5 v-5 l-4.5,-3.5 Z' /><path d='M27.5,18 l-4,-4' fill='none' /><circle cx='22.5' cy='13' r='2.5' stroke='none' /><path d='M36.5,18 l4,-4' fill='none' /><circle cx='41.5' cy='13' r='2.5' stroke='none' /></g></svg>`;
  const faviconDataUri = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={faviconDataUri} />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Suspense fallback={null}>
            <GoogleAnalytics />
        </Suspense>
        <AuthProvider>
          <OnboardingProvider>
            <VideoCallProvider>
              <SidebarProvider>
                <Sidebar>
                  <SidebarHeader>
                    <div className="flex w-full items-center justify-center gap-2">
                      <BoomnLogo className="w-8 h-8 text-sidebar-primary" />
                      <h1 className="text-xl font-bold text-sidebar-foreground">Boomn</h1>
                    </div>
                  </SidebarHeader>
                  <SidebarContent>
                    <MainNav />
                  </SidebarContent>
                  <SidebarFooter>
                    <UserNav />
                  </SidebarFooter>
                </Sidebar>
                <SidebarInset>
                  <SiteHeader />
                  <main className="p-4 sm:p-6 lg:p-8">{children}</main>
                </SidebarInset>
              </SidebarProvider>
              <Toaster />
              <MinimizedVideoCall />
            </VideoCallProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
