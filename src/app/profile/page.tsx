
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, type UserProfile } from '@/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Edit, Loader2 } from 'lucide-react';

const posts = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  imageUrl: 'https://placehold.co/400x400.png',
  hint: 'travel landscape',
}));

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p>Could not load user profile. Please try again later.</p>
      </div>
    );
  }

  const stats = {
    posts: 124, // These can be dynamic in the future
    followers: '1.2k',
    following: 345,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="overflow-hidden">
        <div className="relative group h-40 md:h-48 bg-muted">
          <Link href="/settings" className="cursor-pointer">
            <Image
              src={userProfile.avatarUrl || 'https://placehold.co/1200x300.png'}
              alt="Banner"
              fill
              className="object-cover"
              data-ai-hint="abstract background"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </Link>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-20">
            <Link href="/settings" className="relative group cursor-pointer">
              <Avatar className="w-32 h-32 border-4 border-card">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </Link>
            <div className="mt-4 sm:mt-0 sm:flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {userProfile.name}
                  </h1>
                  <p className="text-muted-foreground">@{userProfile.username}</p>
                </div>
                <Button asChild className="mt-2 sm:mt-0">
                  <Link href="/settings">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-4">{userProfile.bio || 'No bio yet. Add one in settings!'}</p>
          <div className="flex gap-6 mt-4 text-sm">
            <p><span className="font-bold">{stats.posts}</span> Posts</p>
            <p><span className="font-bold">{stats.followers}</span> Followers</p>
            <p><span className="font-bold">{stats.following}</span> Following</p>
          </div>
        </div>
      </Card>
      
      <Tabs defaultValue="posts" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mt-4">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square relative group">
                <Image
                  src={post.imageUrl}
                  alt={`Post ${post.id}`}
                  fill
                  className="object-cover rounded-lg"
                  data-ai-hint={post.hint}
                />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="likes">
            <div className="text-center py-16 text-muted-foreground">
                <p>Posts you&apos;ve liked will appear here.</p>
            </div>
        </TabsContent>
        <TabsContent value="media">
             <div className="text-center py-16 text-muted-foreground">
                <p>Your photos and videos will appear here.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
