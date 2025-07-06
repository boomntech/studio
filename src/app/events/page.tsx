import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const events = [
  {
    id: '1',
    title: 'Summer Music Fest',
    date: 'August 15, 2024',
    location: 'Central Park, NYC',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'music festival',
    description: 'Join us for a full day of live music from top artists across all genres.',
  },
  {
    id: '2',
    title: 'Tech Innovators Conference',
    date: 'September 5-7, 2024',
    location: 'Moscone Center, SF',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'tech conference',
    description: 'The premier event for tech leaders, developers, and entrepreneurs.',
  },
  {
    id: '3',
    title: 'Art & Design Expo',
    date: 'October 10, 2024',
    location: 'The Art Gallery, London',
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'art exhibition',
    description: 'Explore stunning works from emerging and established artists.',
  },
];

export default function EventsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="flex flex-col">
          <CardHeader className="p-0">
            <div className="aspect-video relative">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={event.dataAiHint}
              />
            </div>
            <div className="p-6">
              <CardTitle>{event.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground text-sm mb-2">{event.date}</p>
            <p className="text-muted-foreground text-sm font-semibold mb-4">{event.location}</p>
            <p>{event.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/events/${event.id}`}>
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
