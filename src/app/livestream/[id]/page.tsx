
'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAgora } from '@/hooks/use-agora';
import type { ICameraVideoTrack, IMicrophoneAudioTrack, ClientRole } from 'agora-rtc-sdk-ng';

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

function LivestreamContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const channelName = params.id;
  const role: ClientRole = searchParams.get('role') === 'host' ? 'host' : 'audience';

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
  } = useAgora({ appId, channelName, token, role });

  useEffect(() => {
    if (!appId || !token) {
        toast({
            variant: 'destructive',
            title: 'Agora Not Configured',
            description: 'Please add your Agora App ID and a temporary token to the .env file.',
        });
        router.push('/livestream');
    }
  }, [router, toast]);

  const handleEndCall = async () => {
    await leave();
    router.push('/livestream');
  };

  const hostUser = role === 'host' ? null : remoteUsers.find(u => u.uid?.toString().startsWith('host'));

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       {isLoading && (
         <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">{role === 'host' ? 'Starting your stream...' : 'Joining stream...'}</p>
            </div>
         </div>
      )}

      {!isLoading && (
        <div className="relative flex-1">
            <Card className="w-full h-full flex items-center justify-center bg-muted overflow-hidden">
                {role === 'host' && localVideoTrack && (
                    <VideoPlayer videoTrack={localVideoTrack} />
                )}
                {role === 'audience' && hostUser && hostUser.hasVideo && (
                     <VideoPlayer videoTrack={hostUser.videoTrack!} />
                )}
                {role === 'audience' && (!hostUser || !hostUser.hasVideo) && (
                    <div className="text-center text-muted-foreground">
                       <Radio className="h-12 w-12 mx-auto mb-2" />
                       <p className="font-semibold">Waiting for the host to start the stream...</p>
                    </div>
                )}
                 {role === 'host' && !localVideoTrack && (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <VideoOff className="h-4 w-4" />
                            <AlertTitle>Camera/Mic Issue</AlertTitle>
                            <AlertDescription>
                            Could not access your camera or microphone. Please check your browser permissions.
                            </AlertDescription>
                        </Alert>
                    </div>
                 )}
            </Card>
        </div>
      )}
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-4 p-4 bg-card rounded-lg shadow-sm">
        {role === 'host' && (
          <>
            <Button variant={isAudioMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleAudio} disabled={!isJoined}>
              {isAudioMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            <Button variant={isVideoMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleVideo} disabled={!isJoined}>
              {isVideoMuted ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
            </Button>
          </>
        )}
        <Button variant="destructive" size="icon" className="w-16 h-16 rounded-full" onClick={handleEndCall} disabled={!isJoined}>
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}

export default function LivestreamPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LivestreamContent params={params} />
        </Suspense>
    )
}
