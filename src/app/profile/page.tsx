import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera } from 'lucide-react';

const user = {
  name: 'Boomn User',
  handle: '@boomnuser',
  bio: 'Exploring the future of social media, one post at a time. #tech #social #boomn',
  avatarUrl: 'https://placehold.co/128x128.png',
  bannerUrl: 'https://placehold.co/1200x300.png',
  stats: {
    posts: 124,
    followers: '1.2k',
    following: 345,
  },
};

const posts = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  imageUrl: 'https://placehold.co/400x400.png',
  hint: 'travel landscape',
}));

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <Card className="overflow-hidden">
        <div className="relative group cursor-pointer h-40 md:h-48 bg-muted">
          <Image
            src={user.bannerUrl}
            alt="Banner"
            fill
            className="object-cover"
            data-ai-hint="abstract background"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-20">
            <div className="relative group cursor-pointer">
              <Avatar className="w-32 h-32 border-4 border-card">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">{user.handle}</p>
                </div>
                <Button>Follow</Button>
              </div>
            </div>
          </div>
          <p className="mt-4">{user.bio}</p>
          <div className="flex gap-6 mt-4 text-sm">
            <p>
              <span className="font-bold">{user.stats.posts}</span> Posts
            </p>
            <p>
              <span className="font-bold">{user.stats.followers}</span> Followers
            </p>
            <p>
              <span className="font-bold">{user.stats.following}</span> Following
            </p>
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
