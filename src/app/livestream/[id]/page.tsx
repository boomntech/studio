
'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2, Radio, Minus } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useVideoCall } from '@/context/VideoCallContext';
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
  
  const channelName = params.id;
  const role: ClientRole = searchParams.get('role') === 'host' ? 'host' : 'audience';

  const { callState, startCall, endCall, minimizeCall, toggleAudio, toggleVideo } = useVideoCall();
  const { localAudioTrack, localVideoTrack, remoteUsers, isLoading, isAudioMuted, isVideoMuted, isCallActive } = callState;

  useEffect(() => {
    if (!appId || !token) {
        router.push('/livestream');
        return;
    }
    // If we land on this page and the call isn't active, start it.
    if (!isCallActive || callState.channelName !== channelName) {
      startCall(channelName, role);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, isCallActive, role, startCall]);

  const handleEndCall = async () => {
    await endCall();
    router.push('/livestream');
  };

  const hostUser = role === 'host' ? null : remoteUsers.find(user => callState.role === 'audience');

  if (isLoading || !isCallActive) {
     return (
       <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
         <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg">{role === 'host' ? 'Starting your stream...' : 'Joining stream...'}</p>
            </div>
         </div>
       </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
       <div className="relative flex-1">
            <Card className="w-full h-full flex items-center justify-center bg-muted overflow-hidden">
                {role === 'host' && localVideoTrack && !isVideoMuted && (
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
                 {(role === 'host' && (!localVideoTrack || isVideoMuted)) && (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <VideoOff className="h-4 w-4" />
                            <AlertTitle>{!localVideoTrack ? 'Camera/Mic Issue' : 'Video is Off'}</AlertTitle>
                            <AlertDescription>
                            {!localVideoTrack ? 'Could not access camera/mic. Check permissions.' : 'Your video is currently turned off.'}
                            </AlertDescription>
                        </Alert>
                    </div>
                 )}
            </Card>
        </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-4 p-4 bg-card rounded-lg shadow-sm">
        {role === 'host' && (
          <>
            <Button variant={isAudioMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleAudio}>
              {isAudioMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            <Button variant={isVideoMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleVideo}>
              {isVideoMuted ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
            </Button>
          </>
        )}
        <Button variant="secondary" size="icon" className="w-16 h-16 rounded-full" onClick={minimizeCall}>
          <Minus className="h-8 w-8" />
        </Button>
        <Button variant="destructive" size="icon" className="w-16 h-16 rounded-full" onClick={handleEndCall}>
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
