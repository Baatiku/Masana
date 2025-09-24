
import React from 'react';
import { createContext } from 'react';
import { AppState, CallState, Persona, SpeechAnalysisReport, VoiceSettings } from '../types';

interface IAppContext {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
  appState: AppState;
  setAppState: (newState: AppState) => void;
  selectedPersona: Persona | null;
  setSelectedPersona: (persona: Persona | null) => void;
  startCall: () => void;
  // Fix: Updated endCall signature to accept optional SpeechAnalysisReport
  endCall: (duration: number, analysisData?: SpeechAnalysisReport) => void;
  startDirectCall: (persona: Persona) => void;
  callState: CallState;
  setCallState: (newState: CallState) => void;
  callDuration: number;
  lastCallInfo: { personaId: string; duration: number } | null;
  setLastCallInfo: (info: { personaId: string; duration: number } | null) => void;
  tokenBalance: number;
  setTokenBalance: (newBalance: number | ((prev: number) => number)) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isGeminiKeyMissing: boolean;
  areFirebaseKeysMissing: boolean;
  personas: Persona[];
  personasLoading: boolean;
  // Fix: Add voiceSettings and setVoiceSettings to the context.
  voiceSettings: Record<string, VoiceSettings>;
  setVoiceSettings: React.Dispatch<React.SetStateAction<Record<string, VoiceSettings>>>;
  favoritePersonaIds: string[];
  toggleFavorite: (personaId: string) => void;
  isScreenRecording: boolean;
  toggleScreenRecording: () => void;
}

export const AppContext = createContext<IAppContext>({
  isPremium: false,
  setIsPremium: () => {},
  appState: 'splash',
  setAppState: () => {},
  selectedPersona: null,
  setSelectedPersona: () => {},
  startCall: () => {},
  endCall: () => {},
  startDirectCall: () => {},
  callState: 'idle',
  setCallState: () => {},
  callDuration: 0,
  lastCallInfo: null,
  setLastCallInfo: () => {},
  tokenBalance: 0,
  setTokenBalance: () => {},
  theme: 'light',
  setTheme: () => {},
  isGeminiKeyMissing: false,
  areFirebaseKeysMissing: true,
  personas: [],
  personasLoading: true,
  // Fix: Provide default values for voiceSettings.
  voiceSettings: {},
  setVoiceSettings: () => {},
  favoritePersonaIds: [],
  toggleFavorite: () => {},
  isScreenRecording: false,
  toggleScreenRecording: () => {},
});
