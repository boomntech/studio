'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const storiesData = [
  { id: 1, name: 'Jane Doe', avatar: 'https://placehold.co/64x64.png', hint: 'portrait woman' },
  { id: 2, name: 'John Smith', avatar: 'https://placehold.co/64x64.png', hint: 'portrait man' },
  { id: 3, name: 'Alice', avatar: 'https://placehold.co/64x64.png', hint: 'portrait smiling' },
  { id: 4, name: 'Bob', avatar: 'https://placehold.co/64x64.png', hint: 'portrait person' },
  { id: 5, name: 'Charlie', avatar: 'https://placehold.co/64x64.png', hint: 'portrait cool' },
  { id: 6, name: 'Diana', avatar: 'https://placehold.co/64x64.png', hint: 'portrait happy' },
  { id: 7, name: 'Ethan', avatar: 'https://placehold.co/64x64.png', hint: 'portrait serious' },
  { id: 8, name: 'Fiona', avatar: 'https://placehold.co/64x64.png', hint: 'portrait professional' },
];

export function StoriesBar() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 -mb-2">
          {/* Add Story */}
          <div className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group w-20">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground group-hover:border-primary transition-colors">
                <AvatarImage src="https://placehold.co/64x64.png" data-ai-hint="profile self" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center border-2 border-card">
                <Plus className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xs font-medium w-full truncate text-center text-muted-foreground group-hover:text-foreground">Your Story</p>
          </div>

          {/* Active Stories */}
          {storiesData.map((story) => (
            <div key={story.id} className="flex flex-col items-center space-y-1.5 flex-shrink-0 cursor-pointer group w-20">
              <div className="rounded-full p-0.5 border-2 border-primary group-hover:border-primary/80 transition-colors">
                <Avatar className="h-16 w-16 border-2 border-card">
                  <AvatarImage src={story.avatar} alt={story.name} data-ai-hint={story.hint} />
                  <AvatarFallback>{story.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-xs font-medium w-full truncate text-center">{story.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
