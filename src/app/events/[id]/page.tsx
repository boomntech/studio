import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket } from 'lucide-react';

const eventDetails = {
  id: '1',
  title: 'Summer Music Fest',
  date: 'August 15, 2024',
  time: '12:00 PM - 10:00 PM',
  location: 'Central Park, NYC',
  image: 'https://placehold.co/1200x400.png',
  dataAiHint: 'music festival crowd',
  description: 'Join us for an unforgettable day of live music at the heart of New York City. Summer Music Fest brings together a diverse lineup of top artists from rock, pop, hip-hop, and electronic music. Enjoy delicious food from local vendors, interactive art installations, and a vibrant atmosphere. This is the ultimate summer celebration you won\'t want to miss!',
  ticketLink: '#',
};

export default function EventDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch event details based on params.id
  const event = eventDetails;

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
                {event.date} at {event.time}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end">
             <Button size="lg">
                <Ticket className="mr-2 h-5 w-5" />
                Buy Tickets
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
