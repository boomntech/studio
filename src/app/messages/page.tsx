import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const conversations = [
  { id: 1, name: 'Jane Doe', lastMessage: 'See you then!', time: '2m', avatar: 'https://placehold.co/40x40.png' },
  { id: 2, name: 'John Smith', lastMessage: 'Thanks for the update.', time: '1h', avatar: 'https://placehold.co/40x40.png' },
  { id: 3, name: 'Alice Johnson', lastMessage: 'Sounds good!', time: '3h', avatar: 'https://placehold.co/40x40.png' },
];

const messages = [
    { sender: 'Jane Doe', text: 'Hey, how are you?', time: '10:00 AM' },
    { sender: 'You', text: 'I\'m good, thanks! How about you?', time: '10:01 AM' },
    { sender: 'Jane Doe', text: 'Doing great! Are we still on for the event tomorrow?', time: '10:01 AM' },
    { sender: 'You', text: 'Absolutely! Looking forward to it.', time: '10:02 AM' },
    { sender: 'Jane Doe', text: 'Perfect! See you then!', time: '10:03 AM' },
];

export default function MessagesPage() {
  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex border bg-card rounded-lg overflow-hidden">
      <div className="w-full md:w-1/3 lg:w-1/4 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages" className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((convo) => (
            <div key={convo.id} className="flex items-center gap-3 p-4 hover:bg-secondary cursor-pointer">
              <Avatar>
                <AvatarImage src={convo.avatar} />
                <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{convo.name}</p>
                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
              </div>
              <p className="text-xs text-muted-foreground">{convo.time}</p>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="hidden md:flex flex-1 flex-col">
         <div className="p-4 border-b flex items-center gap-3">
            <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" />
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">Jane Doe</p>
                <p className="text-sm text-muted-foreground">Online</p>
            </div>
        </div>
        <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender === 'You' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="relative">
            <Input placeholder="Type a message..." className="pr-12" />
            <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
