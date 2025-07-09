'use client';

import { useEffect, useRef } from 'react';
import { useVideoCall } from '@/context/VideoCallContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { ICameraVideoTrack } from 'agora-rtc-sdk-ng';

const VideoPlayer = ({ videoTrack }: { videoTrack: ICameraVideoTrack }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    videoTrack.play(ref.current, { fit: 'cover' });
    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  return <div ref={ref} className="absolute inset-0 w-full h-full"></div>;
};

export function MinimizedVideoCall() {
  const { callState, maximizeCall, endCall, toggleAudio, toggleVideo } = useVideoCall();

  if (!callState.isCallActive || !callState.isMinimized) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-72 h-48 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 relative bg-muted flex items-center justify-center">
                {callState.localVideoTrack && !callState.isVideoMuted ? (
                    <VideoPlayer videoTrack={callState.localVideoTrack} />
                ) : (
                    <VideoOff className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/50 to-transparent">
                    <p className="text-white text-sm font-semibold truncate">Ongoing Call</p>
                </div>
            </div>
            <div className="p-2 bg-background/80 backdrop-blur-sm flex justify-around items-center">
                <Button variant="ghost" size="icon" onClick={toggleAudio}>
                    {callState.isAudioMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleVideo}>
                    {callState.isVideoMuted ? <VideoOff className="h-5 w-5 text-destructive" /> : <Video className="h-5 w-5" />}
                </Button>
                 <Button variant="ghost" size="icon" onClick={maximizeCall}>
                    <Maximize className="h-5 w-5" />
                </Button>
                <Button variant="destructive" size="icon" onClick={async () => await endCall()}>
                    <PhoneOff className="h-5 w-5" />
                </Button>
            </div>
        </Card>
    </div>
  )
}
