import React, { useState, useMemo, useCallback, useEffect, useRef, useContext } from 'react';
import { AppState, CallState, Persona, SpeechAnalysisReport, VoiceSettings } from './types';
import { AppContext } from './context/AppContext';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import { PersonaProfileScreen } from './screens/PersonaDetailScreen';
import ActiveCallScreen from './screens/ActiveCallScreen';
import SettingsScreen from './screens/SettingsScreen';
import { LiveAPIProvider, useLiveAPIContext } from './context/LiveApiContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import DesktopLayout from './components/DesktopLayout';
import { useIsMobile } from './hooks/useIsMobile';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import { Modality } from '@google/genai';
import CallStatusBar from './components/CallStatusBar';
import WalletScreen from './screens/WalletScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import LearnScreen from './screens/LearnScreen';
import ToolsScreen from './screens/tools/ToolsScreen';
import { BottomNavBar } from './components/MobileNav';
import CallHistoryScreen from './screens/CallHistoryScreen';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import CompleteProfileScreen from './screens/CompleteProfileScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import ChatHistoryScreen from './screens/ChatHistoryScreen';
import { getPersonas, logCall, getOrCreateConversation, getFullHistoryForAI, getMemories, getAllVoiceSettingsForUser, getFavoritePersonaIds, addFavorite, removeFavorite } from './services/db';
import { SyncProvider, useSync } from './context/SyncContext';
import MemoryScreen from './screens/MemoryScreen';
import NigeriaScreen from './screens/NigeriaScreen';

const App: React.FC = () => {
  // FIX: Per Gemini API guidelines, environment variables must be accessed via process.env. This also resolves the 'import.meta.env' TypeScript error.
  const isGoogleClientConfigured = !!process.env.GOOGLE_CLIENT_ID;

  return (
    <ProfileProvider>
      <LanguageProvider>
        {/* FIX: Per Gemini API guidelines, environment variables must be accessed via process.env. This also resolves the 'import.meta.env' TypeScript error. */}
        <LiveAPIProvider apiKey={process.env.API_KEY}>
          <SyncProvider
            // FIX: Per Gemini API guidelines, environment variables must be accessed via process.env. This also resolves the 'import.meta.env' TypeScript error.
            apiKey={process.env.API_KEY}
            // FIX: Using process.env for consistency and to resolve 'import.meta.env' TypeScript error.
            clientId={process.env.GOOGLE_CLIENT_ID}
            isEnabled={isGoogleClientConfigured}
          >
            <AppContent />
          </SyncProvider>
        </LiveAPIProvider>
      </LanguageProvider>
    </ProfileProvider>
  );
};

const MobileMainLayout: React.FC = () => {
    const { appState, setAppState } = useContext(AppContext);
    
    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            <main className="flex-grow overflow-hidden">
                {appState === 'home' && <HomeScreen />}
                {appState === 'favorites' && <FavoritesScreen />}
                {appState === 'makaranta' && <LearnScreen />}
                {appState === 'nigeria' && <NigeriaScreen />}
                {appState === 'tools' && <ToolsScreen />}
            </main>
            <BottomNavBar activeView={appState} setAppState={setAppState} />
        </div>
    );
};


const AppContent: React.FC = () => {
  const { loading: profileLoading, profile, updateProfile } = useProfile();
  const { isTranslationsLoading } = useLanguage();
  const { isInitializing, isSignedIn, restoreData, hasRestored } = useSync();

  const [appState, setAppState] = useState<AppState>('splash');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [lastCallInfo, setLastCallInfo] = useState<{ personaId: string; duration: number } | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<Record<string, VoiceSettings>>({});
  const [favoritePersonaIds, setFavoritePersonaIds] = useState<string[]>([]);

  // Screen Recording State & Refs
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const userAudioStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // FIX: Per Gemini API guidelines, environment variables must be accessed via process.env. This also resolves the 'import.meta.env' TypeScript error.
  const isGeminiKeyMissing = !process.env.API_KEY;
  
  // Restore data from Google Drive once on startup if signed in
  useEffect(() => {
    if (!isInitializing && isSignedIn && !hasRestored) {
        restoreData();
    }
  }, [isInitializing, isSignedIn, hasRestored, restoreData]);

  useEffect(() => {
    const fetchPersonas = async () => {
        setPersonasLoading(true);
        try {
            const fetchedPersonas = await getPersonas();
            setPersonas(fetchedPersonas);
        } catch (e) {
            console.error('Error fetching personas from local data.', e);
        } finally {
            setPersonasLoading(false);
        }
    };
    fetchPersonas();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
        if (profile) {
            try {
                const [fetchedSettings, favoriteIds] = await Promise.all([
                    getAllVoiceSettingsForUser(profile.id),
                    getFavoritePersonaIds(profile.id)
                ]);
                setVoiceSettings(fetchedSettings);
                setFavoritePersonaIds(favoriteIds);
            } catch (e) {
                console.error("Failed to load initial user data", e);
            }
        }
    };
    fetchInitialData();
  }, [profile]);

  useEffect(() => {
    if (profile) {
      if (profile.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('kwararru-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('kwararru-theme', 'light');
      }
    }
  }, [profile]);

  const isMobile = useIsMobile();
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<number | null>(null);

  const { client, connect, disconnect, setConfig } = useLiveAPIContext();
  const { language, getLanguageName, t } = useLanguage();
  const { scheduleBackup } = useSync();

  const ringtoneAudioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneNodesRef = useRef<{ o1: OscillatorNode, o2: OscillatorNode, g: GainNode } | null>(null);

  const stopRinging = useCallback(() => {
    if (ringtoneNodesRef.current) {
        try {
            ringtoneNodesRef.current.o1.stop();
            ringtoneNodesRef.current.o2.stop();
            ringtoneNodesRef.current.g.disconnect();
            ringtoneNodesRef.current = null;
        } catch(e) { console.warn("Could not stop oscillators."); }
    }
    if (ringtoneAudioCtxRef.current && ringtoneAudioCtxRef.current.state !== 'closed') {
        ringtoneAudioCtxRef.current.close();
        ringtoneAudioCtxRef.current = null;
    }
  }, []);

  const startRinging = useCallback(() => {
    if (ringtoneAudioCtxRef.current || !selectedPersona) return;
    try {
        const context = new (window.AudioContext)();
        ringtoneAudioCtxRef.current = context;
        const gain = context.createGain();
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0, context.currentTime);
        const osc1 = context.createOscillator();
        const osc2 = context.createOscillator();
        osc1.type = 'sine'; osc2.type = 'sine';
        osc1.frequency.value = 440; osc2.frequency.value = 480;
        osc1.connect(gain); osc2.connect(gain);
        osc1.start(); osc2.start();
        ringtoneNodesRef.current = { o1: osc1, o2: osc2, g: gain };
        const ring = (time: number) => gain.gain.setTargetAtTime(0.2, time, 0.01);
        const silence = (time: number) => gain.gain.setTargetAtTime(0, time, 0.01);
        let ringTime = context.currentTime + 0.1;
        for (let i = 0; i < 4; i++) {
            ring(ringTime);
            silence(ringTime + 1.5);
            ringTime += 4.0; 
        }
    } catch (error) { console.error("Failed to start ringing sound:", error); }
  }, [selectedPersona]);

  // --- Screen Recording Logic ---
  const stopScreenRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    displayStreamRef.current?.getTracks().forEach(track => track.stop());
    userAudioStreamRef.current?.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    
    displayStreamRef.current = null;
    userAudioStreamRef.current = null;
    audioContextRef.current = null;
    
    setIsScreenRecording(false);
  }, []);

  const startScreenRecording = useCallback(async () => {
    try {
        const userAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        userAudioStreamRef.current = userAudioStream;

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
        });
        displayStreamRef.current = displayStream;
        
        displayStream.getVideoTracks()[0].onended = stopScreenRecording;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const destination = audioContext.createMediaStreamDestination();

        const userAudioSource = audioContext.createMediaStreamSource(userAudioStream);
        userAudioSource.connect(destination);

        if (displayStream.getAudioTracks().length > 0) {
            const displayAudioSource = audioContext.createMediaStreamSource(displayStream);
            displayAudioSource.connect(destination);
        }
        
        const combinedStream = new MediaStream([
            displayStream.getVideoTracks()[0],
            destination.stream.getAudioTracks()[0]
        ]);

        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm; codecs=vp8,opus'
        });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Kwararru-Recording-${new Date().toISOString().replace(/:/g, '-')}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            recordedChunksRef.current = [];
        };

        recorder.start();
        setIsScreenRecording(true);
    } catch (err) {
        console.error("Error starting screen recording:", err);
        stopScreenRecording();
    }
  }, [stopScreenRecording]);

  const toggleScreenRecording = useCallback(() => {
      if (isScreenRecording) {
          stopScreenRecording();
      } else {
          startScreenRecording();
      }
  }, [isScreenRecording, startScreenRecording, stopScreenRecording]);

  // Cleanup effect for screen recording on component unmount (e.g. page refresh)
  useEffect(() => {
    return () => {
        if (isScreenRecording) {
            stopScreenRecording();
        }
    };
  }, [isScreenRecording, stopScreenRecording]);
  // --- End Screen Recording Logic ---

  // Manages the call state machine
  useEffect(() => {
    if (!selectedPersona || callState === 'idle' || !client) return;

    const onOpen = () => setCallState('connected');
    const onCloseOrError = () => {
        if (['connecting', 'connected', 'ringing'].includes(callState)) {
             setCallState('ended');
        }
    };
    client.on('open', onOpen);
    client.on('close', onCloseOrError);
    client.on('error', onCloseOrError);
    
    let stateTimer: number;

    if (callState === 'initiating') {
        const initiateCall = async () => {
            if (!profile || !selectedPersona) return;

            let historyString = '  - No recent chat history.';
            try {
                const convo = await getOrCreateConversation(profile.id, selectedPersona.id);
                const history = await getFullHistoryForAI(convo.id);
                const recentHistory = history.slice(-6); // Keep it to the last 6 messages to be concise
                if (recentHistory.length > 0) {
                    historyString = recentHistory
                        .map(msg => `  - ${msg.sender === 'user' ? 'User' : 'You'}: ${msg.text_content || '(media message)'}`)
                        .join('\n');
                }
            } catch (e) {
                console.error("Failed to fetch chat history for call context:", e);
            }

            let memoryFacts = '  - None';
            try {
                const memories = await getMemories(profile.id, selectedPersona.id);
                if (memories.length > 0) {
                    memoryFacts = memories.map(m => `  - ${m.fact}`).join('\n');
                }
            } catch (e) {
                console.error("Failed to fetch memories for call context:", e);
            }

            const languageName = getLanguageName(language);
            
            const finalSystemInstruction = `
${selectedPersona.systemInstruction}

---
**Call Context**
You are now in a voice call. Use the following context to continue the conversation seamlessly.

- **Language Preference:** ${languageName}
- **Known Facts About User:**
${memoryFacts}
- **Recent Chat History:**
${historyString}
---
            `.trim();

            const baseVoice = selectedPersona.voice;

            setConfig({
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: baseVoice } } },
                systemInstruction: { parts: [{ text: finalSystemInstruction }] },
                responseModalities: [Modality.AUDIO],
            });
            setCallState('ringing');
        };
        initiateCall();
    } else if (callState === 'ringing') {
        startRinging();
        stateTimer = window.setTimeout(() => {
            stopRinging();
            setCallState('connecting');
        }, 6000);
    } else if (callState === 'connecting') {
        connect();
    } else if (callState === 'connected') {
        stopRinging();
        // Send a simple, silent message to prompt the AI to start the conversation.
        // The user won't see this message, but the AI will respond to it.
        if (client) {
             client.send([{ text: "Hello, please greet me briefly and start the conversation." }], false);
        }
    } else if (callState === 'ended') {
        stopRinging();
        disconnect();
    }

    return () => {
      clearTimeout(stateTimer);
      client.off('open', onOpen);
      client.off('close', onCloseOrError);
      client.off('error', onCloseOrError);
    };
  }, [callState, selectedPersona, client, language, getLanguageName, setConfig, connect, disconnect, startRinging, stopRinging, profile]);

  // Manages the call duration timer separately
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callState === 'idle') {
          setCallDuration(0);
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callState]);
  
  const handlePersonaSelect = useCallback((persona: Persona | null) => {
    setSelectedPersona(persona);
  }, []);
  
  const handleNavigate = useCallback((newState: AppState) => {
      setAppState(newState);
  }, []);

  const handleStartCall = useCallback(() => {
    if (selectedPersona && !isGeminiKeyMissing) {
      setCallState('initiating');
      setAppState('call');
    }
  }, [selectedPersona, isGeminiKeyMissing]);

  const handleStartDirectCall = useCallback((persona: Persona) => {
    if (isGeminiKeyMissing) return;
    setSelectedPersona(persona);
    setCallState('initiating');
    setAppState('call');
  }, [isGeminiKeyMissing]);

  const handleEndCall = useCallback(async (duration: number, analysisData?: SpeechAnalysisReport) => {
    if (callState === 'idle' || callState === 'ended') return;
    
    if (profile && selectedPersona) {
        setLastCallInfo({ personaId: selectedPersona.id, duration });
        if (duration > 0) {
            try {
                await logCall(profile.id, selectedPersona.id, duration, analysisData);
                scheduleBackup();
            } catch (error) {
                console.error("Failed to log call:", error);
            }
        }
    }
    
    setCallState('ended');

    setTimeout(() => {
        setCallState('idle');
        handleNavigate(isMobile ? 'chat' : 'home');
    }, 1500);

  }, [isMobile, callState, handleNavigate, profile, selectedPersona, scheduleBackup]);

    const handleToggleFavorite = useCallback(async (personaId: string) => {
        if (!profile) return;
        const isFavorite = favoritePersonaIds.includes(personaId);
        const newFavorites = isFavorite
            ? favoritePersonaIds.filter(id => id !== personaId)
            : [...favoritePersonaIds, personaId];
        
        setFavoritePersonaIds(newFavorites);

        try {
            if (isFavorite) {
                await removeFavorite(profile.id, personaId);
            } else {
                await addFavorite(profile.id, personaId);
            }
            scheduleBackup();
        } catch (e) {
            console.error("Failed to update favorite", e);
            setFavoritePersonaIds(favoritePersonaIds); // Revert UI on failure
        }
    }, [profile, favoritePersonaIds, scheduleBackup]);

  const contextValue = useMemo(() => ({
    isPremium: profile?.is_premium ?? false,
    setIsPremium: (isPremium: boolean) => updateProfile({ is_premium: isPremium }),
    appState,
    setAppState: handleNavigate,
    selectedPersona,
    setSelectedPersona: handlePersonaSelect,
    startCall: handleStartCall,
    endCall: handleEndCall,
    startDirectCall: handleStartDirectCall,
    callState,
    setCallState,
    callDuration,
    lastCallInfo,
    setLastCallInfo,
    tokenBalance: profile?.token_balance ?? 0,
    setTokenBalance: (newBalance: number | ((prev: number) => number)) => {
        const value = typeof newBalance === 'function' ? newBalance(profile?.token_balance ?? 0) : newBalance;
        updateProfile({ token_balance: value });
    },
    theme: profile?.theme ?? 'light',
    setTheme: (theme: 'light' | 'dark') => updateProfile({ theme }),
    isGeminiKeyMissing,
    areFirebaseKeysMissing: false,
    personas,
    personasLoading,
    voiceSettings,
    setVoiceSettings,
    favoritePersonaIds,
    toggleFavorite: handleToggleFavorite,
    isScreenRecording,
    toggleScreenRecording,
  }), [profile, appState, selectedPersona, callState, callDuration, handlePersonaSelect, handleStartCall, handleEndCall, handleNavigate, handleStartDirectCall, updateProfile, isGeminiKeyMissing, personas, personasLoading, lastCallInfo, voiceSettings, favoritePersonaIds, handleToggleFavorite, isScreenRecording, toggleScreenRecording]);

  if (profileLoading || isTranslationsLoading || isInitializing) {
      return <SplashScreen onFinished={() => {}} />;
  }

  const renderContent = () => {
    if (appState === 'splash') {
        return <SplashScreen onFinished={() => {
            if (profile && !profile.full_name) {
                setAppState('completeProfile');
            } else {
                const hasOnboarded = localStorage.getItem('kwararru-onboarded');
                setAppState(hasOnboarded ? 'home' : 'onboarding');
            }
        }} />;
    }
    if (appState === 'onboarding') {
        return <Onboarding onFinished={() => {
            localStorage.setItem('kwararru-onboarded', 'true');
            if (profile && !profile.full_name) {
                setAppState('completeProfile');
            } else {
                setAppState('home');
            }
        }} />;
    }
    if (appState === 'completeProfile') {
        return <CompleteProfileScreen />;
    }
    
    if (isMobile) {
      switch (appState) {
        case 'home':
        case 'favorites':
        case 'makaranta':
        case 'nigeria':
        case 'tools':
          return <MobileMainLayout />;
        case 'chat':
          return selectedPersona ? <ChatScreen /> : <MobileMainLayout />;
        case 'profile':
          return selectedPersona ? <PersonaProfileScreen /> : <MobileMainLayout />;
        case 'call':
          return <ActiveCallScreen />;
        case 'settings':
          return <SettingsScreen />;
        case 'myProfile':
            return <MyProfileScreen />;
        case 'wallet':
          return <WalletScreen />;
        case 'callHistory':
            return <CallHistoryScreen />;
        case 'chatHistory':
            return <ChatHistoryScreen />;
        case 'memory':
            return <MemoryScreen />;
        default:
          return <MobileMainLayout />;
      }
    }
    
    return (
      <div className="relative w-full h-full">
        <DesktopLayout />
      </div>
    );
  };

  const isCallActive = callState === 'connected' || callState === 'connecting' || callState === 'ringing';

  return (
    <AppContext.Provider value={contextValue}>
      <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased overflow-hidden">
        {isGeminiKeyMissing && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white text-center p-2 text-sm z-[100]" role="alert">
            Gemini API key is missing. Please configure environment variables.
          </div>
        )}
        {isCallActive && appState !== 'call' && <CallStatusBar />}
        {renderContent()}
      </div>
    </AppContext.Provider>
  );
};

export default App;
