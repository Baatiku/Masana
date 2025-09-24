import React from 'react';

export enum SuperCategory {
  KWARARRU = 'Kwararru',
  MAKARANTA = "Makaranta",
  TOOLS = "Tools",
  CIVIC_LIFE = 'Civic Life',
}

export const PREBUILT_VOICES = [
  // Female
  'Achernar', 'Aoede', 'Autonoe', 'Callirrhoe', 'Despina', 'Erinome', 'Gacrux', 
  'Laomededia', 'Pulcherrima', 'Sulafat', 'Vindemiatrix', 'Zephyr',
  // Male
  'Achird', 'Algenib', 'Algieba', 'Charon', 'Enceladus', 'Fenrir', 
  'Iapetus', 'Orus', 'Puck', 'Rasalgethi', 'Sadachbia', 'Schedar', 
  'Umbriel', 'Zubenelgenubi'
] as const;
export type PrebuiltVoice = typeof PREBUILT_VOICES[number];

// Fix: Add VoiceSettings type definition to resolve import errors.
export interface VoiceSettings {
  baseVoice: PrebuiltVoice;
  pitch: 'Very Low' | 'Low' | 'Normal' | 'High' | 'Very High';
  speed: 'Very Slow' | 'Slow' | 'Normal' | 'Fast' | 'Very Fast';
  accent: string;
}

export type VoiceGender = 'male' | 'female';

export interface VoiceOption {
  id: PrebuiltVoice;
  name: string;
  gender: VoiceGender;
}

export enum PersonaRole {
  ADVISOR = 'Advisor',
  TEACHER = 'Teacher',
  ACTOR = 'Actor',
  EXPERT_ADVISOR = 'Expert Advisor',
  CONVERSATIONALIST = 'Conversationalist',
  MINISTRY = 'Ministry',
  STATE_EMISSARY = 'State Emissary',
  HISTORICAL_FIGURE = 'Historical Figure',
}

export enum GoalCategory {
  LEARN = 'Learn a Skill',
  SOLVE = 'Solve a Problem',
  CREATE = 'Get Creative',
  EXPLORE = 'Explore a Topic',
  PRACTICE = 'Practice & Roleplay',
}

export enum StyleCategory {
  ANALYTICAL = 'Direct & Analytical',
  EMPATHETIC = 'Empathetic & Calm',
  PASSIONATE = 'Passionate & Energetic',
  WISE = 'Wise & Measured',
  SUPPORTIVE = 'Encouraging & Supportive',
}

export enum GeopoliticalZone {
  NORTH_CENTRAL = 'North Central',
  NORTH_EAST = 'North East',
  NORTH_WEST = 'North West',
  SOUTH_EAST = 'South East',
  SOUTH_SOUTH = 'South South',
  SOUTH_WEST = 'South West',
}

export type EducationLevel = 'Tertiary' | 'Secondary' | 'Primary' | 'Islamiyya';
export type SubCategory = 'Makers' | 'Simulators';


export interface Persona {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  role: PersonaRole;
  category: SuperCategory;
  description: string;
  specialty: string;
  longDescription: string;
  expertise: string[];
  communicationStyle: string;
  goal: string;
  isPremium: boolean;
  voice: PrebuiltVoice;
  systemInstruction: string;
  gender: VoiceGender;
  goalCategory: GoalCategory;
  styleCategory: StyleCategory;
  geopoliticalZone?: GeopoliticalZone;
  quickReplies?: string[];
  specialInteraction?: 'speech-coach';
  subCategory?: SubCategory;
  educationLevel?: EducationLevel;
  created_at?: string;
  interactionScript?: { step: number; question: string; key: string; }[];
}

export type AppState = 'splash' | 'onboarding' | 'completeProfile' | 'myProfile' | 'home' | 'chat' | 'profile' | 'call' | 'settings' | 'wallet' | 'favorites' | 'makaranta' | 'tools' | 'callHistory' | 'chatHistory' | 'memory' | 'nigeria';
export type CallState = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended';

export interface OnboardingStep {
  title: string;
  text: string;
  hero: React.ReactNode;
}

// Fix: Added the missing `CallRecording` interface to fix type errors in `db.ts` and `CallHistoryScreen.tsx`.
export interface CallRecording {
  id?: number;
  personaId: string;
  personaName: string;
  personaAvatarUrl: string;
  timestamp: Date;
  duration: number;
  audioBlob: Blob;
}

export interface SpeechAnalysisReport {
    avgPace: number;
    hesitationCount: number;
    engagement: number; 
}

export interface ChatMessage {
    id: string; // uuid
    created_at: string;
    sender: 'user' | 'ai' | 'system';
    conversation_id: string;
    user_id: string;
    message_type: 'text' | 'call_log' | 'disclaimer' | 'document';
    text_content?: string | null;
    image_url?: string | null; // URL from storage
    call_duration_seconds?: number | null;
    metadata?: { // JSONB
        groundingChunks?: any[];
        title?: string;
        content?: string; // for documents
        callAnalysis?: SpeechAnalysisReport;
    } | null;
    isSaving?: boolean;
    error?: string | null;
}
export type SupportedLanguage = 'en' | 'ha' | 'fr' | 'ig' | 'yo';

export interface Profile {
  id: string; 
  full_name?: string;
  avatar_url?: string; // Can be a remote URL or a local base64 data URI
  theme: 'light' | 'dark';
  language: SupportedLanguage;
  is_premium: boolean;
  token_balance: number;
  gender?: 'male' | 'female' | null;
}

export interface Conversation {
    id: string;
    user_id: string;
    persona_id: string;
    last_message_snippet: string | null;
    last_message_timestamp: string;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    persona?: Persona; 
}

export interface Memory {
    id?: number;
    user_id: string;
    persona_id: string;
    fact: string;
    created_at: string;
}