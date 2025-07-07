'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { StoriesBar } from '@/components/stories-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRecommendedPosts, type RecommendedPost } from '@/ai/flows/get-recommended-posts';
import { getPosts, type Post } from '@/services/postService';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile } from '@/services/userService';

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [feedGenerated, setFeedGenerated] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoadingFeed(true);
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Posts',
        description: 'Could not load the feed. Please try again later.',
      });
    } finally {
      setIsLoadingFeed(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const personalPosts = posts.filter((post) => post.type === 'personal');
  const businessPosts = posts.filter((post) => post.type === 'business');

  const handleGenerateFeed = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in', description: 'You must be logged in to generate a personalized feed.' });
        return;
    }
    setIsLoadingRecommendations(true);
    setFeedGenerated(true);
    try {
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        toast({ variant: 'destructive', title: 'Profile not found' });
        return;
      }

      const { email, uid, createdAt, updatedAt, dob, ...profileForAI } = userProfile;
      const result = await getRecommendedPosts({ userProfile: profileForAI, posts: posts });
      setRecommendedPosts(result.recommendedPosts);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Feed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoadingRecommendations(false);
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
             {!feedGenerated && !isLoadingRecommendations && (
              <div className="text-center py-12 px-4 rounded-lg border border-dashed">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your Personalized Feed</h3>
                <p className="text-muted-foreground mb-6">
                  Click the button to use AI to generate a 'For You' feed based on your profile and interests.
                </p>
                <Button onClick={handleGenerateFeed} disabled={isLoadingRecommendations}>
                   {isLoadingRecommendations ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate My Feed
                </Button>
              </div>
            )}

            {isLoadingRecommendations && (
                 <div className="text-center py-16 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4">Building your personalized feed...</p>
                </div>
            )}
            
            {!isLoadingRecommendations && feedGenerated && recommendedPosts.length === 0 && (
               <div className="text-center py-16 text-muted-foreground">
                <p>Couldn't generate recommendations at this time.</p>
              </div>
            )}

            {!isLoadingRecommendations && recommendedPosts.length > 0 && (
              recommendedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="all" className="mt-6">
            {isLoadingFeed ? (
                 <div className="text-center py-16 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4">Loading posts...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="personal" className="mt-6">
            {isLoadingFeed ? (
                 <div className="text-center py-16 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-4">
                    {personalPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="business" className="mt-6">
           {isLoadingFeed ? (
                 <div className="text-center py-16 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-4">
                    {businessPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
