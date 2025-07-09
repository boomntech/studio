'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Loader2, MessageSquareText, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getConversations,
  getMessages,
  sendMessage,
  type Conversation,
  type Message,
} from '@/services/messageService';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Component to render a conversation in the list
const ConversationItem = ({
  conversation,
  currentUserId,
  onClick,
  isActive,
}: {
  conversation: Conversation;
  currentUserId: string;
  onClick: () => void;
  isActive: boolean;
}) => {
  const otherParticipantId = conversation.participants.find(p => p !== currentUserId);
  if (!otherParticipantId) return null;

  const otherParticipant = conversation.participantInfo[otherParticipantId];
  if (!otherParticipant) return null;

  const lastMessageTimestamp =
    conversation.lastMessage?.timestamp instanceof Timestamp
      ? formatDistanceToNow(conversation.lastMessage.timestamp.toDate(), { addSuffix: true })
      : '...';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer transition-colors',
        isActive && 'bg-secondary'
      )}
    >
      <Avatar>
        <AvatarImage src={otherParticipant.avatarUrl} />
        <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate">{otherParticipant.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
          {conversation.lastMessage.text}
        </p>
      </div>
      <p className="text-xs text-muted-foreground self-start pt-1">{lastMessageTimestamp}</p>
    </div>
  );
};

// Component to render a single message in the chat
const MessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
  const timestamp =
    message.timestamp instanceof Timestamp
      ? format(message.timestamp.toDate(), 'p')
      : '';

  return (
    <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-xs lg:max-w-md p-3 rounded-lg',
          isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <p
          className={cn(
            'text-xs mt-1 text-right',
            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
};

// The main page component
export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = getConversations(user.uid, (fetchedConversations) => {
      setConversations(fetchedConversations);
      // If there's no active conversation, select the first one
      if (!activeConversationId && fetchedConversations.length > 0) {
        setActiveConversationId(fetchedConversations[0].id);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeConversationId]);

  // Fetch messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const unsubscribe = getMessages(activeConversationId, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeConversationId) return;

    setIsSending(true);
    try {
      await sendMessage(activeConversationId, user.uid, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartVideoCall = () => {
    if (!activeConversationId) return;
    router.push(`/network/call/${activeConversationId}`);
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const otherParticipant = activeConversation && user
    ? activeConversation.participantInfo[activeConversation.participants.find(p => p !== user.uid)!]
    : null;

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex border bg-card rounded-lg overflow-hidden">
      {/* Sidebar with conversations */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages" className="pl-9" disabled />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((convo) => (
              <ConversationItem
                key={convo.id}
                conversation={convo}
                currentUserId={user!.uid}
                onClick={() => setActiveConversationId(convo.id)}
                isActive={activeConversationId === convo.id}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p>No conversations yet.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main chat window */}
      <div className="hidden md:flex flex-1 flex-col">
        {activeConversation && otherParticipant ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherParticipant.avatarUrl} />
                <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{otherParticipant.name}</p>
                <p className="text-sm text-muted-foreground">@{otherParticipant.username}</p>
              </div>
              <Button size="icon" variant="outline" onClick={handleStartVideoCall}>
                <Video className="h-5 w-5" />
                <span className="sr-only">Start video call</span>
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6" viewportRef={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.senderId === user?.uid}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="relative">
                <Input
                  placeholder="Type a message..."
                  className="pr-12"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                />
                <Button size="icon" type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isSending || !newMessage.trim()}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquareText className="h-16 w-16 mb-4" />
                <h2 className="text-xl font-semibold">Select a conversation</h2>
                <p>Choose one of your existing conversations to start chatting.</p>
            </div>
        )}
      </div>
    </div>
  );
}
