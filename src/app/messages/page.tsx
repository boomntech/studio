
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Loader2, MessageSquareText, Video, Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getConversations,
  getMessages,
  sendMessage,
  createGroupConversation,
  type Conversation,
  type Message,
} from '@/services/messageService';
import { getUsers, type UserProfile } from '@/services/userService';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const createGroupSchema = z.object({
  groupName: z.string().min(3, 'Group name must be at least 3 characters.'),
  participantIds: z.array(z.string()).min(1, 'You must select at least one other member.'),
});

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
  const isGroup = conversation.type === 'group';
  const otherParticipantId = !isGroup ? conversation.participants.find(p => p !== currentUserId) : null;
  const participant = otherParticipantId ? conversation.participantInfo[otherParticipantId] : null;

  const displayName = isGroup ? conversation.name : participant?.name;
  const avatarUrl = isGroup ? undefined : participant?.avatarUrl;
  const fallback = isGroup ? <Users className="h-6 w-6" /> : displayName?.charAt(0);
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
        <AvatarImage src={avatarUrl} />
        <AvatarFallback className={cn(isGroup && 'bg-muted')}>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="font-semibold truncate">{displayName}</p>
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


// Dialog for creating a new group
function CreateGroupDialog({ open, onOpenChange, currentUserId }: { open: boolean, onOpenChange: (open: boolean) => void, currentUserId: string }) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [potentialMembers, setPotentialMembers] = useState<UserProfile[]>([]);
  const { handleSubmit, control, reset } = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { groupName: '', participantIds: [] },
  });

  useEffect(() => {
    async function fetchUsers() {
      const users = await getUsers(20);
      setPotentialMembers(users.filter(u => u.uid !== currentUserId));
    }
    fetchUsers();
  }, [currentUserId]);

  const onSubmit = async (data: z.infer<typeof createGroupSchema>) => {
    setIsCreating(true);
    try {
      await createGroupConversation(currentUserId, data.participantIds, data.groupName);
      toast({ title: "Group Created!", description: `The group "${data.groupName}" has been successfully created.` });
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create group', description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group Chat</DialogTitle>
          <DialogDescription>Name your group and select members to start a conversation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="groupName"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input id="groupName" {...field} />
                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <div className="space-y-2">
            <Label>Select Members</Label>
            <Controller
              name="participantIds"
              control={control}
              render={({ field, fieldState }) => (
                <>
                <ScrollArea className="h-48 rounded-md border p-2">
                  <div className="space-y-2">
                    {potentialMembers.map(member => (
                      <div key={member.uid} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary">
                         <Checkbox
                          id={member.uid}
                          onCheckedChange={(checked) => {
                            const currentVal = field.value || [];
                            if (checked) {
                              field.onChange([...currentVal, member.uid]);
                            } else {
                              field.onChange(currentVal.filter(id => id !== member.uid));
                            }
                          }}
                          checked={field.value?.includes(member.uid)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <label htmlFor={member.uid} className="flex-1 cursor-pointer">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">@{member.username}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


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
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsubscribe = getConversations(user.uid, (fetchedConversations) => {
      setConversations(fetchedConversations);
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
  const isGroupChat = activeConversation?.type === 'group';
  const otherParticipant = !isGroupChat && activeConversation && user
    ? activeConversation.participantInfo[activeConversation.participants.find(p => p !== user.uid)!]
    : null;

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex border bg-card rounded-lg overflow-hidden">
      {user && <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen} currentUserId={user.uid} />}
      {/* Sidebar with conversations */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Chats</h2>
          <Button variant="ghost" size="icon" onClick={() => setCreateGroupOpen(true)}>
            <Plus className="h-5 w-5" />
            <span className="sr-only">New Group</span>
          </Button>
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
              <Button variant="link" onClick={() => setCreateGroupOpen(true)}>Start a new group chat</Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main chat window */}
      <div className="hidden md:flex flex-1 flex-col">
        {activeConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
               <Avatar>
                <AvatarImage src={!isGroupChat ? otherParticipant?.avatarUrl : undefined} />
                <AvatarFallback className={cn(isGroupChat && 'bg-muted')}>
                    {isGroupChat ? <Users className="h-6 w-6"/> : otherParticipant?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{isGroupChat ? activeConversation.name : otherParticipant?.name}</p>
                 { !isGroupChat && otherParticipant && <p className="text-sm text-muted-foreground">@{otherParticipant.username}</p>}
                 { isGroupChat && <p className="text-sm text-muted-foreground">{activeConversation.participants.length} members</p>}
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
