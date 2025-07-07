
'use client';

import { useState } from 'react';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { StoriesBar } from '@/components/stories-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRecommendedPosts, type RecommendedPost } from '@/ai/flows/get-recommended-posts';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const posts = [
  {
    id: '1',
    author: {
      name: 'Jane Doe',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@janedoe',
    },
    content: 'Just had the most amazing coffee! ☕️ #coffeelover #cafe',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coffee lifestyle',
    likes: 120,
    comments: 12,
    shares: 5,
    timestamp: '2h ago',
    type: 'personal',
    tags: ['coffee', 'food', 'lifestyle'],
  },
  {
    id: '2',
    author: {
      name: 'John Smith',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@johnsmith',
    },
    content: 'Exploring the city vibes today! What are your favorite spots?',
    likes: 350,
    comments: 45,
    shares: 20,
    timestamp: '5h ago',
    type: 'personal',
    trending: true,
    tags: ['travel', 'city', 'photography'],
  },
  {
    id: '3',
    author: {
      name: 'Boomn Corp',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@boomncorp',
    },
    content: 'Loving the new Boomn features! The event listings are a game-changer.',
    likes: 88,
    comments: 8,
    shares: 2,
    timestamp: '1d ago',
    type: 'business',
    websiteUrl: '#',
    appointmentUrl: '#',
    productUrl: '#',
    tags: ['tech', 'social media', 'apps'],
  },
];

// In a real app, this would be fetched for the logged-in user.
const mockUserProfile = {
    interests: ['tech', 'coffee', 'design'],
    occupation: ['Software Engineer'],
    location: 'San Francisco, CA',
    age: 30,
    race: 'Asian',
    sexualOrientation: 'lgbtq'
};


export default function Home() {
  const { toast } = useToast();
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedGenerated, setFeedGenerated] = useState(false);

  const personalPosts = posts.filter((post) => post.type === 'personal');
  const businessPosts = posts.filter((post) => post.type === 'business');

  const handleGenerateFeed = async () => {
    setIsLoading(true);
    setFeedGenerated(true);
    try {
      const result = await getRecommendedPosts({ userProfile: mockUserProfile, posts: posts });
      setRecommendedPosts(result.recommendedPosts);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Feed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StoriesBar />
      <CreatePost />
      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Businesses</TabsTrigger>
        </TabsList>
        <TabsContent value="for-you" className="mt-6">
          <div className="space-y-4">
             {!feedGenerated && (
              <div className="text-center py-12 px-4 rounded-lg border border-dashed">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your Personalized Feed</h3>
                <p className="text-muted-foreground mb-6">
                  Click the button to use AI to generate a 'For You' feed based on your profile and interests.
                </p>
                <Button onClick={handleGenerateFeed} disabled={isLoading}>
                   {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate My Feed
                </Button>
              </div>
            )}

            {isLoading && (
                 <div className="text-center py-16 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4">Building your personalized feed...</p>
                </div>
            )}
            
            {!isLoading && feedGenerated && recommendedPosts.length === 0 && (
               <div className="text-center py-16 text-muted-foreground">
                <p>Couldn't generate recommendations at this time.</p>
              </div>
            )}

            {!isLoading && recommendedPosts.length > 0 && (
              recommendedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="personal" className="mt-6">
          <div className="space-y-4">
            {personalPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="business" className="mt-6">
          <div className="space-y-4">
            {businessPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
