
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Users, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useVideoCall } from '@/context/VideoCallContext';

const liveStreams = [
  {
    id: 'stream-1',
    title: 'Live Coding Session: Building with Next.js',
    host: { name: 'Tech Innovators', handle: '@techinnovators' },
    viewerCount: 1250,
    thumbnailUrl: 'https://placehold.co/600x400.png',
    thumbnailHint: 'code screen laptop',
    tags: ['Coding', 'Tech', 'Next.js'],
  },
  {
    id: 'stream-2',
    title: 'Morning Yoga Flow',
    host: { name: 'Maria Garcia', handle: '@mariag' },
    viewerCount: 890,
    thumbnailUrl: 'https://placehold.co/600x400.png',
    thumbnailHint: 'yoga fitness',
    tags: ['Fitness', 'Wellness', 'Yoga'],
  },
  {
    id: 'stream-3',
    title: 'Gaming Night: New Indie Release!',
    host: { name: 'Sam Chen', handle: '@samchen' },
    viewerCount: 2300,
    thumbnailUrl: 'https://placehold.co/600x400.png',
    thumbnailHint: 'video game controller',
    tags: ['Gaming', 'IndieDev'],
  },
];

export default function LivestreamPage() {
  const { startCall } = useVideoCall();

  const handleGoLive = () => {
    // Generate a unique channel ID for the new stream
    const channelId = `live_${Math.random().toString(36).substring(2, 9)}`;
    startCall(channelId, 'host', `/livestream/${channelId}?role=host`);
  };

  const handleJoinStream = (streamId: string) => {
    startCall(streamId, 'audience', `/livestream/${streamId}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live Streams</h1>
          <p className="text-muted-foreground">Watch live streams from creators around the world.</p>
        </div>
        <Button size="lg" onClick={handleGoLive}>
          <Radio className="mr-2 h-5 w-5" />
          Go Live
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveStreams.map((stream) => (
          <Card key={stream.id} className="flex flex-col group">
            <CardHeader className="p-0 relative">
              <div onClick={() => handleJoinStream(stream.id)} className="block aspect-video relative cursor-pointer">
                <Image
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  fill
                  className="object-cover rounded-t-lg"
                  data-ai-hint={stream.thumbnailHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-2 left-2 bg-red-600 text-white">LIVE</Badge>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white text-sm font-bold">
                  <Eye className="h-4 w-4" />
                  <span>{stream.viewerCount.toLocaleString()}</span>
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Radio className="h-12 w-12 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <div className="flex gap-2 flex-wrap mb-2">
                {stream.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
              <h3 className="font-semibold text-lg line-clamp-2">{stream.title}</h3>
              <p className="text-sm text-muted-foreground">{stream.host.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
