'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Video, CalendarClock, Loader2 } from 'lucide-react';
import { createPost } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';

export function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsLoading(true);
    try {
      await createPost({ content });
      setContent('');
      toast({
        title: "Post Created!",
        description: "Your post is now live. It will appear on the feed shortly.",
      });
      // In a production app, you might trigger a feed refetch here.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Failed to create post",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} />
            <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="w-full space-y-2">
            <Textarea
              placeholder="What's happening?"
              className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base resize-none bg-transparent"
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Add image" disabled>
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Add video" disabled>
                  <Video className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Schedule post" disabled>
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              <Button onClick={handlePost} disabled={isLoading || !content.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
