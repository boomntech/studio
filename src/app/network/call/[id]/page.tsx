'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function VideoCallPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // In a real app, 'params.id' would be used to establish a connection
  // with the specific user via a signaling server.

  useEffect(() => {
    const getMediaPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasPermissions(true);
        // Simulate connection time
        setTimeout(() => setIsConnecting(false), 2000);
      } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasPermissions(false);
        toast({
          variant: 'destructive',
          title: 'Permissions Denied',
          description: 'Camera and microphone access are required for video calls.',
        });
      }
    };

    getMediaPermissions();

    // Clean up the stream when the component unmounts
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleVideo = () => {
     if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      });
    }
  };

  const endCall = () => {
    // In a real app, this would also signal the end of the call to the other peer.
    router.push('/network');
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Remote Video */}
        <Card className="flex items-center justify-center bg-muted overflow-hidden">
          {isConnecting ? (
             <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Connecting to user...</p>
             </div>
          ) : (
            <div className="w-full h-full relative">
                 <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline data-ai-hint="person video call" />
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                        <p className="font-semibold">Waiting for user...</p>
                        <p className="text-sm">This is a placeholder for the remote video stream.</p>
                    </div>
                 </div>
            </div>
          )}
        </Card>

        {/* Local Video */}
        <Card className="overflow-hidden">
             {!hasPermissions ? (
                 <div className="h-full flex flex-col items-center justify-center p-4">
                    <Alert variant="destructive">
                      <VideoOff className="h-4 w-4" />
                      <AlertTitle>Permissions Required</AlertTitle>
                      <AlertDescription>
                        You need to allow camera and microphone access in your browser to start a video call.
                      </AlertDescription>
                    </Alert>
                 </div>
             ) : (
                 <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
             )}
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-4 p-4 bg-card rounded-lg shadow-sm">
        <Button variant={isMuted ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleAudio} disabled={!hasPermissions}>
          {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </Button>
        <Button variant={isVideoOff ? 'destructive' : 'secondary'} size="icon" className="w-16 h-16 rounded-full" onClick={toggleVideo} disabled={!hasPermissions}>
          {isVideoOff ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
        </Button>
        <Button variant="destructive" size="icon" className="w-16 h-16 rounded-full" onClick={endCall}>
          <PhoneOff className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
