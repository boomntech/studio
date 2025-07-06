import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, TrendingUp } from 'lucide-react';

const trendingTopics = [
  {
    id: '1',
    category: 'Technology · Trending',
    topic: '#AIInnovation',
    postsCount: '42.1K posts',
  },
  {
    id: '2',
    category: 'Music · Trending',
    topic: 'Summer Fest Lineup',
    postsCount: '125K posts',
  },
  {
    id: '3',
    category: 'Gaming · Trending',
    topic: '#IndieGameDev',
    postsCount: '89.7K posts',
  },
    {
    id: '4',
    category: 'Travel · Trending',
    topic: 'Hidden Gems',
    postsCount: '23.4K posts',
  },
  {
    id: '5',
    category: 'Finance · Trending',
    topic: '$BOOMN',
    postsCount: '12.3K posts',
  },
];


export function TrendingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            What's boomn'
        </CardTitle>
        <CardDescription>Trending topics and hashtags on Boomn.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {trendingTopics.map((item) => (
          <div key={item.id} className="group -mx-2 -my-1">
            <Button variant="ghost" className="h-auto w-full justify-between items-start p-2">
                <div className="text-left">
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    <p className="font-semibold">{item.topic}</p>
                    <p className="text-xs text-muted-foreground">{item.postsCount}</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
