'use client';

import { useState, useEffect } from 'react';
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
import { ArrowRight, Loader2 } from 'lucide-react';
import { getEvents, type Event } from '@/services/eventService';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const fetchedEvents = await getEvents();
                setEvents(fetchedEvents);
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Error Fetching Events',
                    description: 'Could not load events. Please try again later.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isLoading && events.length === 0) {
        return (
             <div className="text-center py-16 text-muted-foreground">
                <p>No upcoming events found.</p>
                <p className="text-sm">Please check back later or add events to your Firestore 'events' collection.</p>
            </div>
        )
    }

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
            <p className="text-muted-foreground text-sm mb-2">{format(event.date, 'PPP')}</p>
            <p className="text-muted-foreground text-sm font-semibold mb-4">{event.location}</p>
            <p className="line-clamp-3">{event.description}</p>
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
