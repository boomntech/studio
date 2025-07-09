'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCRemoteUser,
  type ClientRole,
} from 'agora-rtc-sdk-ng';
import { useToast } from '@/hooks/use-toast';

AgoraRTC.setLogLevel(3);

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
const token = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN || null;

interface CallState {
  isCallActive: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  channelName: string | null;
  role: ClientRole | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
}

interface VideoCallContextType {
  callState: CallState;
  startCall: (channel: string, role?: ClientRole, redirectUrl?: string) => void;
  endCall: () => Promise<void>;
  minimizeCall: () => void;
  maximizeCall: () => void;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{
    audioTrack: IMicrophoneAudioTrack | null;
    videoTrack: ICameraVideoTrack | null;
  }>({ audioTrack: null, videoTrack: null });

  const [callState, setCallState] = useState<CallState>({
    isCallActive: false,
    isMinimized: false,
    isLoading: false,
    isAudioMuted: false,
    isVideoMuted: false,
    channelName: null,
    role: null,
    localAudioTrack: null,
    localVideoTrack: null,
    remoteUsers: [],
  });

  const resetState = useCallback(() => {
      setCallState({
        isCallActive: false,
        isMinimized: false,
        isLoading: false,
        isAudioMuted: false,
        isVideoMuted: false,
        channelName: null,
        role: null,
        localAudioTrack: null,
        localVideoTrack: null,
        remoteUsers: [],
      });
      localTracksRef.current = { audioTrack: null, videoTrack: null };
  }, []);

  const endCall = useCallback(async () => {
    if (clientRef.current && callState.isCallActive) {
      localTracksRef.current.audioTrack?.close();
      localTracksRef.current.videoTrack?.close();
      await clientRef.current.leave();
      const prevChannelType = callState.channelName?.startsWith('live_') ? 'livestream' : 'messages';
      resetState();
      router.push(prevChannelType === 'livestream' ? '/livestream' : '/messages');
    }
  }, [callState.isCallActive, callState.channelName, router, resetState]);
  
  const setupAgoraClient = useCallback(() => {
    if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

        const client = clientRef.current;

        const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
            await client.subscribe(user, mediaType);
            setCallState(prev => ({...prev, remoteUsers: Array.from(client.remoteUsers)}));
        };
        const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => setCallState(prev => ({...prev, remoteUsers: Array.from(client.remoteUsers)}));
        const handleUserJoined = (user: IAgoraRTCRemoteUser) => setCallState(prev => ({...prev, remoteUsers: Array.from(client.remoteUsers)}));
        const handleUserLeft = (user: IAgoraRTCRemoteUser) => setCallState(prev => ({...prev, remoteUsers: Array.from(client.remoteUsers)}));

        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-joined', handleUserJoined);
        client.on('user-left', handleUserLeft);
    }
    return clientRef.current;
  }, []);

  const startCall = useCallback(async (channel: string, role: ClientRole = 'host', redirectUrl?: string) => {
    if (!appId || !token) {
        toast({
            variant: 'destructive',
            title: 'Agora Not Configured',
            description: 'Please add your Agora App ID and a temporary token to the .env file.',
        });
        return;
    }

    if (callState.isCallActive) {
        if (callState.channelName === channel) {
            maximizeCall();
            return;
        } else {
            await endCall();
        }
    }
    
    setCallState(prev => ({ ...prev, isLoading: true, channelName: channel, role: role }));

    try {
        const client = setupAgoraClient();
        client.setClientRole(role);
        
        await client.join(appId, channel, token, null);
        
        let audioTrack: IMicrophoneAudioTrack | null = null;
        let videoTrack: ICameraVideoTrack | null = null;

        if (role === 'host') {
          [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localTracksRef.current = { audioTrack, videoTrack };
          await client.publish([audioTrack, videoTrack]);
        }
        
        setCallState(prev => ({
            ...prev,
            isCallActive: true,
            isLoading: false,
            isMinimized: false,
            localAudioTrack: audioTrack,
            localVideoTrack: videoTrack,
        }));

        router.push(redirectUrl || `/network/call/${channel}`);

    } catch (error: any) {
        console.error('Failed to start call', error);
        toast({
            variant: 'destructive',
            title: 'Call Failed',
            description: error.message || 'Could not connect to the video service.',
        });
        resetState();
    }
  }, [callState.isCallActive, callState.channelName, toast, setupAgoraClient, router, endCall]);

  const minimizeCall = () => {
    if (callState.isCallActive) {
        setCallState(prev => ({ ...prev, isMinimized: true }));
        const prevChannelType = callState.channelName?.startsWith('live_') ? 'livestream' : 'messages';
        router.push(prevChannelType === 'livestream' ? '/livestream' : '/messages');
    }
  };

  const maximizeCall = () => {
    if (callState.isCallActive && callState.channelName) {
        setCallState(prev => ({...prev, isMinimized: false}));
        const redirectUrl = callState.role === 'host'
            ? callState.channelName.startsWith('live_') ? `/livestream/${callState.channelName}?role=host` : `/network/call/${callState.channelName}`
            : `/livestream/${callState.channelName}`;
        router.push(redirectUrl);
    }
  };

  const toggleAudio = async () => {
    if (localTracksRef.current.audioTrack) {
        const newMutedState = !callState.isAudioMuted;
        await localTracksRef.current.audioTrack.setMuted(newMutedState);
        setCallState(prev => ({ ...prev, isAudioMuted: newMutedState }));
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current.videoTrack) {
        const newMutedState = !callState.isVideoMuted;
        await localTracksRef.current.videoTrack.setMuted(newMutedState);
        setCallState(prev => ({ ...prev, isVideoMuted: newMutedState }));
    }
  };
  
  const value = { callState, startCall, endCall, minimizeCall, maximizeCall, toggleAudio, toggleVideo };

  return (
    <VideoCallContext.Provider value={value}>
        {children}
    </VideoCallContext.Provider>
  );
}
