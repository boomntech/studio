'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { connectWithUser } from '@/services/userService';

const networkUsers = [
  {
    id: '1',
    name: 'Tech Innovators',
    handle: '@techinnovators',
    avatarUrl: 'https://placehold.co/128x128.png',
    avatarHint: 'logo tech',
    bannerUrl: 'https://placehold.co/600x200.png',
    bannerHint: 'abstract technology',
    bio: 'Your daily dose of the latest in technology and innovation. We cover everything from AI to space exploration.',
    type: 'business',
    tags: ['Tech', 'AI', 'Innovation'],
  },
  {
    id: '2',
    name: 'Alex Johnson',
    handle: '@alexj',
    avatarUrl: 'https://placehold.co/128x128.png',
    avatarHint: 'portrait photographer',
    bannerUrl: 'https://placehold.co/600x200.png',
    bannerHint: 'camera lens',
    bio: 'Photographer & Digital Nomad. Capturing the world one photo at a time. 📸✈️',
    type: 'personal',
    tags: ['Photography', 'Travel', 'Art'],
  },
  {
    id: '3',
    name: 'Gourmet Guides',
    handle: '@gourmetguides',
    avatarUrl: 'https://placehold.co/128x128.png',
    avatarHint: 'logo food',
    bannerUrl: 'https://placehold.co/600x200.png',
    bannerHint: 'gourmet dish',
    bio: 'Discover the best food spots in your city. Reviews, recipes, and more for all the foodies out there!',
    type: 'business',
    tags: ['Foodie', 'Restaurant', 'Recipes'],
  },
  {
    id: '4',
    name: 'Maria Garcia',
    handle: '@mariag',
    avatarUrl: 'https://placehold.co/128x128.png',
    avatarHint: 'portrait fitness',
    bannerUrl: 'https://placehold.co/600x200.png',
    bannerHint: 'gym workout',
    bio: 'Fitness enthusiast and personal trainer. Helping you achieve your health goals. #fitness #health',
    type: 'personal',
    tags: ['Fitness', 'Health', 'Workout'],
  },
  {
    id: '5',
    name: 'Creative Coders',
    handle: '@creativecoders',
    avatarUrl: 'https://placehold.co/128x128.png',
    avatarHint: 'logo code',
    bannerUrl: 'https://placehold.co/600x200.png',
    bannerHint: 'code screen',
    bio: 'A community for developers who love to build beautiful and creative things with code. Join us!',
    type: 'business',
    tags: ['Coding', 'Development', 'Community'],
  },
  {
    id: '6',
    name: 'Sam Chen',
    handle: '@samchen',
    avatarUrl: 'https://placehold.co/128x128.png',
    avatarHint: 'portrait gamer',
    bannerUrl: 'https://placehold.co/600x200.png',
    bannerHint: 'video game',
    bio: 'Indie game developer working on my next big project. I talk about game design and development.',
    type: 'personal',
    tags: ['Gaming', 'IndieDev', 'Design'],
  },
];

const getRandomUser = (currentId?: string) => {
  let availableUsers = networkUsers;
  if (currentId) {
    availableUsers = networkUsers.filter(user => user.id !== currentId);
  }
  if (availableUsers.length === 0) {
      // This can happen if there's only one user. Fallback to the full list.
      availableUsers = networkUsers;
  }
  const randomIndex = Math.floor(Math.random() * availableUsers.length);
  return availableUsers[randomIndex];
};

export default function NetworkPage() {
  const [currentUser, setCurrentUser] = useState<(typeof networkUsers)[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Start with an initial user
    setCurrentUser(getRandomUser());
    setIsLoading(false);
  }, []);

  const showNextUser = (currentId?: string) => {
    setIsLoading(true);
    // Add a small delay for a smoother transition effect
    setTimeout(() => {
        setCurrentUser(getRandomUser(currentId));
        setIsLoading(false);
    }, 300);
  };
  
  const handleSkip = () => {
    if (!currentUser) return;
    showNextUser(currentUser.id);
  };
  
  const handleConnect = async () => {
    if (!currentUser || !user) {
        toast({
            variant: 'destructive',
            title: 'Unable to connect',
            description: 'You must be logged in to connect with other users.'
        });
        return;
    }
    
    if (currentUser.id === user.uid) {
        toast({
            variant: 'destructive',
            title: 'Oops!',
            description: 'You cannot connect with yourself.'
        });
        showNextUser(currentUser.id);
        return;
    }

    try {
        await connectWithUser(user.uid, currentUser.id);
        toast({
            title: 'Connected!',
            description: `You are now connected with ${currentUser.name}.`
        });
        showNextUser(currentUser.id);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: error.message
        });
    }
  };

  if (!currentUser) {
     return (
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
     );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className={`transition-opacity duration-300 w-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Card>
            <CardHeader className="p-0 relative h-32">
            <Image
                src={currentUser.bannerUrl}
                alt={`${currentUser.name} banner`}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={currentUser.bannerHint}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[-50%]">
                <Avatar className="h-28 w-28 border-4 border-card">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint={currentUser.avatarHint} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            </CardHeader>
            <CardContent className="text-center pt-20 pb-6 px-6">
                <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                <p className="text-muted-foreground">{currentUser.handle}</p>
                <p className="mt-4 text-sm">{currentUser.bio}</p>
                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                    {currentUser.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
      <div className="flex gap-4 mt-6">
          <Button variant="outline" size="icon" className="w-24 h-24 rounded-full" onClick={handleSkip} disabled={isLoading}>
            <X className="h-10 w-10" />
            <span className="sr-only">Skip</span>
          </Button>
          <Button size="icon" className="w-24 h-24 rounded-full bg-green-500 hover:bg-green-600 text-white" onClick={handleConnect} disabled={isLoading}>
            <Check className="h-10 w-10" />
            <span className="sr-only">Connect</span>
          </Button>
        </div>
    </div>
  );
}
