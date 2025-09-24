// FIX: Import Dispatch and SetStateAction to resolve type error.
import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from 'react';
import { GenAILiveClient } from '../services/genai-live-client';
import { LiveConnectConfig } from '@google/genai';
import { AudioStreamer } from '../services/audio-streamer';
import { audioContext } from '../services/utils';
import VolMeterWorket from '../services/worklets/vol-meter';
import { DEFAULT_LIVE_API_MODEL } from '../constants';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  paused: boolean;
  pause: () => Promise<void>;
  resume: () => Promise<void>;

  volume: number;
  speakerVolume: number;
  // FIX: Use imported Dispatch and SetStateAction types.
  setSpeakerVolume: Dispatch<SetStateAction<number>>;
  aiAudioStream: MediaStream | null;
};

// Dummy context value for when API key is not provided.
// This allows the app to run in offline/UI development mode without crashing.
const DUMMY_LIVE_API_CONTEXT_VALUE: UseLiveApiResults = {
  client: {
    on: () => {},
    off: () => {},
    send: () => console.warn("Live API client not initialized. API key missing."),
    sendRealtimeInput: () => console.warn("Live API client not initialized. API key missing."),
    sendToolResponse: () => console.warn("Live API client not initialized. API key missing."),
    disconnect: () => {},
  } as any,
  config: {},
  setConfig: () => {},
  connect: async () => {
    console.warn('API key missing, cannot connect.');
    return Promise.resolve();
  },
  disconnect: () => {},
  connected: false,
  volume: 0,
  paused: false,
  pause: async () => {},
  resume: async () => {},
  speakerVolume: 1,
  setSpeakerVolume: () => {},
  aiAudioStream: null,
};


export function useLiveApi({
  apiKey,
  model = DEFAULT_LIVE_API_MODEL,
}: {
  apiKey?: string;
  model?: string;
}): UseLiveApiResults {
  // ALL hooks must be called unconditionally at the top.
  const client = useMemo(() => {
    if (!apiKey) {
      return DUMMY_LIVE_API_CONTEXT_VALUE.client;
    }
    return new GenAILiveClient(apiKey, model);
  }, [apiKey, model]);

  const configRef = useRef<LiveConnectConfig>({});
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speakerVolume, setSpeakerVolume] = useState(1);
  const [aiAudioStream, setAiAudioStream] = useState<MediaStream | null>(null);

  const setConfig = useCallback((config: LiveConnectConfig) => {
    configRef.current = config;
  }, []);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        
        // Disconnect from the default output (speakers) to prevent double audio.
        // Playback will now be handled by an <audio> element via the aiAudioStream.
        audioStreamerRef.current.gainNode.disconnect();

        // Create a destination node for capturing the stream for recording
        const destination = audioCtx.createMediaStreamDestination();
        audioStreamerRef.current.gainNode.connect(destination);
        setAiAudioStream(destination.stream);

        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    if (!apiKey) return;

    const onOpen = () => {
      setConnected(true);
      setPaused(false);
    };

    const onClose = () => {
      setConnected(false);
      setPaused(false);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
    };
  }, [client, apiKey]);

  const connect = useCallback(async () => {
    if (!apiKey) {
      console.warn('API key missing, cannot connect.');
      return;
    }
    if (!configRef.current) {
      throw new Error('config has not been set');
    }
    client.disconnect();
    await client.connect(configRef.current);
  }, [client, apiKey]);

  const disconnect = useCallback(() => {
    if (!apiKey) return;
    client.disconnect();
    setConnected(false);
    setPaused(false);
  }, [client, apiKey]);

  const pause = useCallback(async () => {
    if (!apiKey || !connected || paused || !audioStreamerRef.current) return;
    await audioStreamerRef.current.context.suspend();
    setPaused(true);
  }, [apiKey, connected, paused]);

  const resume = useCallback(async () => {
    if (!apiKey || !connected || !paused || !audioStreamerRef.current) return;
    await audioStreamerRef.current.context.resume();
    setPaused(false);
  }, [apiKey, connected, paused]);

  // After all hooks are called, we can decide what to return.
  if (!apiKey) {
    return DUMMY_LIVE_API_CONTEXT_VALUE;
  }
  
  return {
    client,
    config: configRef.current,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
    paused,
    pause,
    resume,
    speakerVolume,
    setSpeakerVolume,
    aiAudioStream,
  };
}
