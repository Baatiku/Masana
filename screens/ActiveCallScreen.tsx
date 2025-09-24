

import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { useLiveAPIContext } from '../context/LiveApiContext';
import { AudioRecorder } from '../services/audio-recorder';
import { MicIcon, MicOffIcon, PhoneHangupIcon, SpeakerIcon, ChevronDownIcon, RecordIcon, StopCircleIcon } from '../components/icons/Icons';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { ConversationRecorder } from '../services/ConversationRecorder';
import { addRecording } from '../services/db';
import PersonaAvatar from '../components/PersonaAvatar';
import SpeechCoachFeedbackUI from '../components/SpeechCoachFeedbackUI';
import { SpeechAnalysisReport } from '../types';

const AI_SPEAKING_THRESHOLD = 0.01;

const ActiveCallScreen: React.FC = () => {
  const { selectedPersona, endCall, callState, callDuration, setAppState } = useContext(AppContext);
  const { client, volume, speakerVolume, setSpeakerVolume, aiAudioStream } = useLiveAPIContext();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const [statusText, setStatusText] = useState(t('call.status.initializing'));
  const [isRecording, setIsRecording] = useState(false);

  // State for speech coaching
  const [analysisData, setAnalysisData] = useState<any>({ paceHistory: [], hesitationCount: 0, engagementHistory: [] });
  const analysisHistoryRef = useRef<any>({ paceHistory: [], hesitationCount: 0, engagementHistory: [] });


  const isAiSpeaking = volume > AI_SPEAKING_THRESHOLD;
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const conversationRecorderRef = useRef<ConversationRecorder | null>(null);
  const aiAudioEl = useRef<HTMLAudioElement>(null);

  const isSpeechCoachSession = selectedPersona?.specialInteraction === 'speech-coach';
  
  useEffect(() => {
    switch(callState) {
        case 'ringing':
            setStatusText(t('call.status.ringing'));
            break;
        case 'connecting':
            setStatusText(t('call.status.connecting', { personaName: selectedPersona?.name || '' }));
            break;
        case 'connected':
            setStatusText(isSpeechCoachSession ? "Begin speaking to get feedback..." : t('call.status.connected'));
            break;
        case 'ended':
            setStatusText(t('call.status.ended'));
            break;
        case 'initiating':
        default:
            setStatusText(t('call.status.initializing'));
            break;
    }
  }, [callState, selectedPersona, t, isSpeechCoachSession]);


  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([{ mimeType: 'audio/pcm;rate=16000', data: base64 }]);
    };
    
    const onSpeechAnalysis = (data: any) => {
        setAnalysisData(prev => ({
            paceHistory: [...prev.paceHistory, data.pace],
            hesitationCount: prev.hesitationCount + data.hesitationCount,
            engagementHistory: [...prev.engagementHistory, data.engagement],
        }));
        analysisHistoryRef.current = {
            paceHistory: [...analysisHistoryRef.current.paceHistory, data.pace],
            hesitationCount: analysisHistoryRef.current.hesitationCount + data.hesitationCount,
            engagementHistory: [...analysisHistoryRef.current.engagementHistory, data.engagement],
        };
    };

    if (callState === 'connected') {
      if (!isMuted) {
        audioRecorder.start();
        audioRecorder.on('data', onData);
      } else {
        audioRecorder.stop();
        audioRecorder.off('data', onData);
      }
      
      if (isSpeechCoachSession) {
        audioRecorder.startSpeechAnalysis();
        audioRecorder.on('speechAnalysis', onSpeechAnalysis);
      }
    } else {
      audioRecorder.stop();
      audioRecorder.off('data', onData);
      if (isSpeechCoachSession) {
        audioRecorder.stopSpeechAnalysis();
        audioRecorder.off('speechAnalysis', onSpeechAnalysis);
      }
    }

    return () => {
      audioRecorder.off('data', onData);
      audioRecorder.off('speechAnalysis', onSpeechAnalysis);
      if (audioRecorder.recording) {
        audioRecorder.stop();
      }
    };
  }, [callState, isMuted, audioRecorder, client, isSpeechCoachSession]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
            setIsVolumeSliderVisible(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect to attach the AI audio stream to the audio element for playback.
  useEffect(() => {
    const audioEl = aiAudioEl.current;
    if (audioEl && aiAudioStream) {
        if (audioEl.srcObject !== aiAudioStream) {
            audioEl.srcObject = aiAudioStream;
        }
        // Autoplay might be blocked, so we try to play it here.
        audioEl.play().catch(error => {
            // Ignore AbortError which can happen if the component unmounts quickly.
            if (error.name !== 'AbortError') {
                console.error("Error playing AI audio stream:", error);
            }
        });
    }
  }, [aiAudioStream]);

  // Effect to control the volume of the AI audio element based on the shared state.
  useEffect(() => {
    if (aiAudioEl.current) {
        aiAudioEl.current.volume = speakerVolume;
    }
  }, [speakerVolume]);


  const stopRecordingAndSave = async () => {
    if (!isRecording) return;
    const recordedDuration = callDuration;
    const blob = await conversationRecorderRef.current?.stop();
    setIsRecording(false);
    if (blob && selectedPersona) {
        try {
            await addRecording({
                personaId: selectedPersona.id,
                personaName: selectedPersona.name,
                personaAvatarUrl: selectedPersona.avatarUrl,
                timestamp: new Date(),
                duration: recordedDuration,
                audioBlob: blob,
            });
            console.log("Recording saved successfully.");
        } catch (error) {
            console.error("Failed to save recording:", error);
        }
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
        await stopRecordingAndSave();
    } else {
        if (audioRecorder.stream && aiAudioStream) {
            if (!conversationRecorderRef.current) {
                conversationRecorderRef.current = new ConversationRecorder();
            }
            await conversationRecorderRef.current.start(audioRecorder.stream, aiAudioStream);
            setIsRecording(true);
        } else {
            console.error("Audio streams not available to start recording.");
        }
    }
  };
  
  useEffect(() => {
    // Cleanup effect to stop recording if component unmounts or call ends unexpectedly
    return () => {
        if (isRecording) {
            stopRecordingAndSave();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);


  const handleToggleMute = () => setIsMuted(prev => !prev);
  
  const handleEndCall = () => {
      if (isRecording) {
        stopRecordingAndSave();
      }

      let report: SpeechAnalysisReport | undefined = undefined;
      if (isSpeechCoachSession && analysisHistoryRef.current.paceHistory.length > 0) {
          const paceSum = analysisHistoryRef.current.paceHistory.reduce((a:number, b:number) => a + b, 0);
          const engagementSum = analysisHistoryRef.current.engagementHistory.reduce((a:number, b:number) => a + b, 0);
          report = {
              avgPace: paceSum / analysisHistoryRef.current.paceHistory.length,
              hesitationCount: analysisHistoryRef.current.hesitationCount,
              engagement: engagementSum / analysisHistoryRef.current.engagementHistory.length,
          };
      }

      endCall(callDuration, report);
  };
  
  const handleMinimizeCall = () => setAppState(isMobile ? 'chat' : 'home');

  const getCurrentStatusText = () => {
    if (callState === 'connected' && isMuted) {
      return t('call.status.muted');
    }
    return statusText;
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (!selectedPersona) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-8 bg-gradient-to-br from-green-50 to-gray-100 dark:from-green-900 dark:to-gray-900 text-gray-900 dark:text-white relative">
       <audio ref={aiAudioEl} autoPlay playsInline className="hidden" />
       <header className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-start">
            <button 
                onClick={handleMinimizeCall} 
                className="bg-black/10 dark:bg-black/20 p-2 rounded-full backdrop-blur-sm hover:bg-black/20 dark:hover:bg-black/40 transition-colors"
                aria-label="Minimize call"
            >
                <ChevronDownIcon className="w-6 h-6 text-gray-800 dark:text-white" />
            </button>
        </header>

      <div className="text-center mt-12">
        <p className="text-lg text-gray-600 dark:text-gray-300">{callState === 'connected' && !isSpeechCoachSession ? t('call.status.learningFrom') : ' '}</p>
        <h1 className="text-4xl font-bold">{selectedPersona.name}</h1>
        <p className="text-2xl font-mono text-gray-500 dark:text-gray-400 mt-2">{callState === 'connected' ? formatTime(callDuration) : ' '}</p>
        <p className="text-green-600 dark:text-green-300 min-h-[1.5rem] transition-opacity duration-300">{getCurrentStatusText()}</p>
        {isRecording && (
            <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 dark:text-red-400 font-semibold text-sm">REC</span>
            </div>
        )}
      </div>
      
      <div className="relative">
        <PersonaAvatar
          persona={selectedPersona}
          className="w-52 h-52 border-8 border-gray-300 dark:border-gray-600 transition-all duration-300"
        />
        <div 
          className="absolute inset-0 rounded-full border-8 border-green-500/70 transition-opacity duration-300"
          style={{
              opacity: isAiSpeaking ? 1 : 0,
              boxShadow: isAiSpeaking ? '0 0 35px 15px rgba(34, 197, 94, 0.7)' : 'none',
              animation: isAiSpeaking ? 'pulse-shadow 2s ease-in-out infinite' : 'none',
          }}
        ></div>
      </div>
      
       {isSpeechCoachSession && callState === 'connected' && <SpeechCoachFeedbackUI analysisData={analysisData} />}

      <div className="w-full max-w-sm grid grid-cols-4 items-center justify-items-center gap-x-2">
         <button 
            onClick={handleToggleMute} 
            className="bg-black/5 dark:bg-white/10 p-4 rounded-full backdrop-blur-sm disabled:opacity-50"
            disabled={callState !== 'connected'}
            aria-label={isMuted ? t('call.button.unmute') : t('call.button.mute')}
          >
           {isMuted ? <MicOffIcon className="h-8 w-8" /> : <MicIcon className="h-8 w-8" />}
        </button>
        <button
            onClick={handleToggleRecording}
            className="bg-black/5 dark:bg-white/10 p-4 rounded-full backdrop-blur-sm disabled:opacity-50"
            disabled={callState !== 'connected'}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
            {isRecording ? <StopCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" /> : <RecordIcon className="h-8 w-8" />}
        </button>
        <div ref={volumeControlRef} className="relative flex items-center justify-center">
            <button 
                onClick={() => setIsVolumeSliderVisible(prev => !prev)}
                className="bg-black/5 dark:bg-white/10 p-4 rounded-full backdrop-blur-sm disabled:opacity-50"
                disabled={callState !== 'connected'}
                aria-label={t('call.button.volume')}
            >
                <SpeakerIcon className="h-8 w-8" />
            </button>
            {isVolumeSliderVisible && (
                 <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg w-40">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={speakerVolume}
                        onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                        className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>
            )}
        </div>
        <button onClick={handleEndCall} className="bg-red-500 p-4 rounded-full">
          <PhoneHangupIcon className="h-8 w-8 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ActiveCallScreen;