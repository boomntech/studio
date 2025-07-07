'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Home,
  Compass,
  Calendar,
  MessageSquare,
  Sparkles,
  Wallet,
  User,
  Shuffle,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Discover', icon: Compass },
  { href: '/network', label: 'Network', icon: Shuffle },
  { href: '/livestream', label: 'Live', icon: Radio },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/assistant', label: 'Assistant', icon: Sparkles },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href) && (link.href !== '/' || pathname === '/');
        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={link.label}
              className={cn(
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
              )}
            >
              <Link href={link.href}>
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
