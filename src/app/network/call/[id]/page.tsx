
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAgora } from '@/hooks/use-agora';
import type { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';


const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
const token = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN || null;

const VideoPlayer = ({
  videoTrack,
  style,
}: {
  videoTrack: ICameraVideoTrack | IMicrophoneAudioTrack;
  style?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    videoTrack.play(ref.current);
    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  return <div ref={ref} style={{ width: '100%', height: '100%', ...style }}></div>;
};


export default function VideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const channelName = params.id;

  const {
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isJoined,
    isLoading,
    isAudioMuted,
    isVideoMuted,
    leave,
    toggleAudio,
    toggleVideo,
  } = useAgora({ appId, channelName, token, role: 'host' }); // Role is always host for all users in a group call

  useEffect(() => {
    if (!appId || !token) {
        toast({
            variant: 'destructive',
            title: 'Agora Not Configured',
            description: 'Please add your Agora App ID and a temporary token to the .env file.',
        });
        router.push('/network');
    }
  }, [router, toast]);

  const handleEndCall = async () => {
    await leave();
    router.push('/messages');
  };

  const totalParticipants = 1 + remoteUsers.length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-background">
       {isLoading && (
         <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">Connecting to video service...</p>
            </div>
         </div>
      )}

      {!isLoading && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
            {/* Local Video */}
            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground shadow-md">
                {localVideoTrack ? (
                    <VideoPlayer videoTrack={localVideoTrack} />
                ) : (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <VideoOff className="h-4 w-4" />
                            <AlertTitle>Camera/Mic Issue</AlertTitle>
                            <AlertDescription>
                            Could not access your camera or microphone. Please check browser permissions.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                 <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">You ({authUser?.displayName})</div>
            </div>
             {/* Remote Videos */}
            {remoteUsers.map((user) => (
                <div key={user.uid} className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground shadow-md">
                    {user.hasVideo ? (
                        <VideoPlayer videoTrack={user.videoTrack!} />
                    ) : (
                        <div className="text-center">
                            <User className="h-12 w-12 mx-auto mb-2" />
                            <p className="font-semibold">Video Off</p>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">User {user.uid.toString().substring(0,6)}</div>
                </div>
            ))}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-auto p-4 bg-card rounded-t-lg shadow-inner">
        <Button variant={isAudioMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleAudio} disabled={!isJoined}>
          {isAudioMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Button variant={isVideoMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleVideo} disabled={!isJoined}>
          {isVideoMuted ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
        </Button>
        <Button variant="destructive" size="icon" className="w-16 h-16 rounded-full" onClick={handleEndCall} disabled={!isJoined}>
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
