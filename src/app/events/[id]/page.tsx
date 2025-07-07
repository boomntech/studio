'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket, Loader2 } from 'lucide-react';
import { getEventById, type Event } from '@/services/eventService';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!params.id) return;

    const fetchEvent = async () => {
        try {
            const fetchedEvent = await getEventById(params.id);
            if (fetchedEvent) {
                setEvent(fetchedEvent);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Event Not Found',
                });
            }
        } catch (error) {
            console.error(error);
             toast({
                variant: 'destructive',
                title: 'Error Fetching Event',
                description: 'Could not load event details.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchEvent();
  }, [params.id, toast]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!event) {
    return (
         <div className="text-center py-16 text-muted-foreground">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p>The event you are looking for does not exist or may have been removed.</p>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover"
          data-ai-hint={event.dataAiHint}
        />
      </div>
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>
                {format(event.date, 'PPP')} {event.time && `at ${event.time}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end">
             <Button size="lg" asChild disabled={!event.ticketLink}>
                <a href={event.ticketLink || '#'} target="_blank" rel="noopener noreferrer">
                    <Ticket className="mr-2 h-5 w-5" />
                    Buy Tickets
                </a>
              </Button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">About this event</h2>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </div>
      </div>
    </div>
  );
}
