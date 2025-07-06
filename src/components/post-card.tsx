'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

type PostAuthor = {
  name: string;
  avatarUrl: string;
  handle: string;
};

type Post = {
  id: string;
  author: PostAuthor;
  content: string;
  imageUrl?: string;
  dataAiHint?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  type: 'personal' | 'business';
  trending?: boolean;
};

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };
  
  const handleSave = () => {
    setIsSaved(!isSaved);
  };

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
            {post.author.handle} · {post.timestamp}
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-2">
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
