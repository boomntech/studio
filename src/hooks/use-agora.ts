'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { useToast } from './use-toast';

AgoraRTC.setLogLevel(3); // Set to 3 for production to avoid verbose logs

interface UseAgoraConfig {
  appId: string;
  channelName: string;
  token: string | null;
}

export function useAgora({ appId, channelName, token }: UseAgoraConfig) {
  const { toast } = useToast();
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTracksRef = useRef<{
    audioTrack: IMicrophoneAudioTrack | null;
    videoTrack: ICameraVideoTrack | null;
  }>({ audioTrack: null, videoTrack: null });

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    if (!appId || !token) {
        if (isLoading) setIsLoading(false);
        return;
    }

    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    const client = clientRef.current;

    const handleUserPublished = async (
      user: IAgoraRTCRemoteUser,
      mediaType: 'audio' | 'video'
    ) => {
      await client.subscribe(user, mediaType);
      setRemoteUsers(Array.from(client.remoteUsers));
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
       setRemoteUsers(Array.from(client.remoteUsers));
    };

    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(Array.from(client.remoteUsers));
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(Array.from(client.remoteUsers));
    };

    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    const joinChannel = async () => {
      try {
        await client.join(appId, channelName, token, null);
        
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = { audioTrack, videoTrack };
        
        await client.publish([audioTrack, videoTrack]);
        setIsJoined(true);
      } catch (error: any) {
        console.error('Failed to join Agora channel', error);
        toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: error.message || 'Could not connect to the video call service.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    joinChannel();

    return () => {
      localTracksRef.current.audioTrack?.close();
      localTracksRef.current.videoTrack?.close();
      client.leave();
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, [appId, channelName, token, toast]);

  const leave = async () => {
    localTracksRef.current.audioTrack?.close();
    localTracksRef.current.videoTrack?.close();
    await clientRef.current?.leave();
    setIsJoined(false);
    setRemoteUsers([]);
  };

  const toggleAudio = async () => {
    if (localTracksRef.current.audioTrack) {
        const newMutedState = !isAudioMuted;
        await localTracksRef.current.audioTrack.setMuted(newMutedState);
        setIsAudioMuted(newMutedState);
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current.videoTrack) {
        const newMutedState = !isVideoMuted;
        await localTracksRef.current.videoTrack.setMuted(newMutedState);
        setIsVideoMuted(newMutedState);
    }
  };

  return {
    localAudioTrack: localTracksRef.current.audioTrack,
    localVideoTrack: localTracksRef.current.videoTrack,
    remoteUsers,
    isJoined,
    isLoading,
    isAudioMuted,
    isVideoMuted,
    leave,
    toggleAudio,
    toggleVideo,
  };
}
