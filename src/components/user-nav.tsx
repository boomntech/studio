'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, ChevronsUpDown, Settings, LogIn } from 'lucide-react';
import { SidebarSeparator } from '@/components/ui/sidebar';

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentProfileId, setCurrentProfileId] = useState('personal');

  const handleLogout = async () => {
    if (!auth) {
      router.push('/login');
      return;
    }
    await signOut(auth);
    router.push('/login');
  };

  if (!user) {
    return (
      <>
        <SidebarSeparator />
        <div className="p-2">
          <div className="space-y-2 group-data-[collapsible=icon]:hidden">
            <Button asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="secondary" asChild className="w-full">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          <div className="hidden group-data-[collapsible=icon]:block text-center">
            <Button asChild size="icon" aria-label="Login">
              <Link href="/login">
                <LogIn />
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const profiles = [
    {
      id: 'personal',
      name: user.displayName || 'Boomn User',
      handle: user.email || '@boomnuser',
      avatarUrl: user.photoURL || 'https://placehold.co/40x40.png',
    },
    {
      id: 'business',
      name: 'Boomn Corp',
      handle: '@boomncorp',
      avatarUrl: 'https://placehold.co/40x40.png',
    },
  ];

  const activeProfile = profiles.find((p) => p.id === currentProfileId)!;

  return (
    <>
      <SidebarSeparator />
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-auto p-2">
              <div className="flex items-center gap-3 w-full">
                <Avatar>
                  <AvatarImage
                    src={activeProfile.avatarUrl}
                    alt={activeProfile.name}
                  />
                  <AvatarFallback>
                    {activeProfile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
                  <p className="font-semibold text-sm text-sidebar-foreground truncate">
                    {activeProfile.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {activeProfile.handle}
                  </p>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 mb-2" side="top" align="start">
            <DropdownMenuLabel>
              <p className="font-semibold">{activeProfile.name}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {activeProfile.handle}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={currentProfileId}
              onValueChange={setCurrentProfileId}
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                Switch profile
              </DropdownMenuLabel>
              {profiles.map((profile) => (
                <DropdownMenuRadioItem
                  key={profile.id}
                  value={profile.id}
                  className="cursor-pointer"
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage
                      src={profile.avatarUrl}
                      alt={profile.name}
                    />
                    <AvatarFallback>
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col">
                    <span>{profile.name}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" className="w-full flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings" className="w-full flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
