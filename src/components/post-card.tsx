'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Flame, ShoppingBag, Link as LinkIcon, CalendarPlus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { type RecommendedPost } from '@/ai/flows/get-recommended-posts'; // This type includes all fields we need
import { toggleLikePost } from '@/services/postService';
import { toggleSavePost, getUserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


type PostCardProps = {
  post: RecommendedPost;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user && post.likedBy) {
      setIsLiked(post.likedBy.includes(user.uid));
    }
  }, [user, post.likedBy]);

  useEffect(() => {
    const checkIfSaved = async () => {
        if (!user) return;
        const userProfile = await getUserProfile(user.uid);
        if (userProfile?.savedPosts?.includes(post.id)) {
            setIsSaved(true);
        }
    };
    checkIfSaved();
  }, [user, post.id]);

  const handleLike = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to like a post.' });
        return;
    }
    try {
        const currentlyLiked = isLiked;
        // Optimistic update
        setIsLiked(!currentlyLiked);
        setLikeCount(currentlyLiked ? likeCount - 1 : likeCount + 1);
        await toggleLikePost(post.id, user.uid);
    } catch (error) {
        // Revert on error
        setIsLiked(isLiked);
        setLikeCount(likeCount);
        toast({ variant: 'destructive', title: 'Failed to update like.' });
    }
  };
  
  const handleSave = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to save a post.' });
        return;
    }
    try {
        const currentlySaved = isSaved;
        setIsSaved(!currentlySaved); // Optimistic update
        await toggleSavePost(user.uid, post.id);
        toast({
            title: currentlySaved ? 'Post unsaved' : 'Post saved!',
        });
    } catch (error) {
        setIsSaved(isSaved); // Revert
        toast({ variant: 'destructive', title: 'Failed to save post.' });
    }
  };
  
  const formattedTimestamp = post.timestamp instanceof Timestamp 
    ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) 
    : post.timestamp;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold">{post.author.name}</p>
            {post.trending && <Flame className="h-4 w-4 text-orange-500" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {post.author.handle} · {formattedTimestamp}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        {post.recommendationReason && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary p-2 rounded-md mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{post.recommendationReason}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-4 rounded-lg overflow-hidden border">
            <Image
              src={post.imageUrl}
              alt="Post image"
              width={600}
              height={400}
              className="object-cover w-full"
              data-ai-hint={post.dataAiHint}
            />
          </div>
        )}
      </CardContent>
      
      {post.type === 'business' && (post.websiteUrl || post.appointmentUrl || post.productUrl) && (
        <div className="px-4">
          <Separator className="my-2" />
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {post.productUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={post.productUrl} target="_blank" rel="noopener noreferrer">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Product
                </a>
              </Button>
            )}
            {post.websiteUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={post.websiteUrl} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Visit Website
                </a>
              </Button>
            )}
            {post.appointmentUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={post.appointmentUrl} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Book Now
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      <CardFooter className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={handleLike} className="flex items-center gap-2">
            <Heart className={cn('h-5 w-5', isLiked ? 'text-red-500 fill-current' : '')} />
            <span className="text-sm text-muted-foreground">{likeCount}</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">{post.comments}</span>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">{post.shares}</span>
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSave}>
          <Bookmark className={cn('h-5 w-5', isSaved && 'text-primary fill-current')} />
        </Button>
      </CardFooter>
    </Card>
  );
}
