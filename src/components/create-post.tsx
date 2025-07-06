'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Video, CalendarClock } from 'lucide-react';

export function CreatePost() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src="https://placehold.co/40x40.png" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="w-full space-y-2">
            <Textarea
              placeholder="What's happening?"
              className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base resize-none bg-transparent"
              rows={2}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Add image">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Add video">
                  <Video className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Schedule post">
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              <Button>Post</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
