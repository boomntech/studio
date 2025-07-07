'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

const titles: { [key: string]: string } = {
  '/': 'Home',
  '/explore': 'Discover',
  '/network': 'Network',
  '/livestream': 'Live',
  '/events': 'Events',
  '/messages': 'Messages',
  '/assistant': 'AI Assistant',
  '/wallet': 'Wallet',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

function getTitle(pathname: string) {
  if (pathname.startsWith('/events/')) return 'Event Details';
  if (pathname.startsWith('/livestream/')) return 'Live Stream';
  if (pathname.startsWith('/network/call')) return 'Video Call';
  return titles[pathname] || 'Boomn';
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm border-b">
      <div className="container flex items-center h-14 px-4 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold ml-2 md:ml-0">{getTitle(pathname)}</h1>
        </div>
      </div>
    </header>
  );
}
