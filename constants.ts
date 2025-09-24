import React from 'react';
import { SuperCategory, VoiceOption, GoalCategory, StyleCategory, GeopoliticalZone } from './types';
import { BriefcaseIcon, UsersIcon, PaletteIcon, ChipIcon, ScaleIcon, MapPinIcon, BookOpenIcon, AcademicCapIcon, RocketIcon, SparklesIcon, FlagIcon } from './components/icons/Icons';

export const SUPER_CATEGORY_DETAILS: Record<SuperCategory, { icon: React.FC<{ className?: string }>, translationKey: string }> = {
  [SuperCategory.KWARARRU]: { icon: SparklesIcon, translationKey: 'superCategory.kwararru' },
  [SuperCategory.MAKARANTA]: { icon: AcademicCapIcon, translationKey: 'superCategory.makaranta' },
  [SuperCategory.TOOLS]: { icon: BriefcaseIcon, translationKey: 'superCategory.tools' },
  [SuperCategory.CIVIC_LIFE]: { icon: FlagIcon, translationKey: 'superCategory.civicLife' },
};

export const VOICE_OPTIONS: VoiceOption[] = [
  // Female
  { id: 'Achernar', name: 'Soft & High-pitch', gender: 'female' },
  { id: 'Aoede', name: 'Breezy & Mid-pitch', gender: 'female' },
  { id: 'Autonoe', name: 'Bright & Mid-pitch', gender: 'female' },
  { id: 'Callirrhoe', name: 'Easy-going & Mid-pitch', gender: 'female' },
  { id: 'Despina', name: 'Smooth & Mid-pitch', gender: 'female' },
  { id: 'Erinome', name: 'Clear & Mid-pitch', gender: 'female' },
  { id: 'Gacrux', name: 'Mature & Mid-pitch', gender: 'female' },
  { id: 'Laomededia', name: 'Upbeat & High-pitch', gender: 'female' },
  { id: 'Pulcherrima', name: 'Forward & Mid-pitch', gender: 'female' },
  { id: 'Sulafat', name: 'Warm & Mid-pitch', gender: 'female' },
  { id: 'Vindemiatrix', name: 'Gentle & Mid-pitch', gender: 'female' },
  { id: 'Zephyr', name: 'Bright & High-pitch', gender: 'female' },
  // Male
  { id: 'Achird', name: 'Friendly & Low-mid pitch', gender: 'male' },
  { id: 'Algenib', name: 'Gravelly & Low-pitch', gender: 'male' },
  { id: 'Algieba', name: 'Smooth & Low-pitch', gender: 'male' },
  { id: 'Charon', name: 'Informative & Low-pitch', gender: 'male' },
  { id: 'Enceladus', name: 'Breathy & Low-pitch', gender: 'male' },
  { id: 'Fenrir', name: 'Excitable & Low-pitch', gender: 'male' },
  { id: 'Iapetus', name: 'Clear & Low-mid pitch', gender: 'male' },
  { id: 'Orus', name: 'Crisp & Firm', gender: 'male' },
  { id: 'Puck', name: 'Upbeat & Mid-pitch', gender: 'male' },
  { id: 'Rasalgethi', name: 'Informative & Mid-pitch', gender: 'male' },
  { id: 'Sadachbia', name: 'Lively & Low-pitch', gender: 'male' },
  { id: 'Schedar', name: 'Even & Low-mid pitch', gender: 'male' },
  { id: 'Umbriel', name: 'Easy-going & Low-pitch', gender: 'male' },
  { id: 'Zubenelgenubi', name: 'Casual & Low-mid pitch', gender: 'male' },
];

export const GOAL_CATEGORY_DETAILS: Record<GoalCategory, { translationKey: string }> = {
    [GoalCategory.LEARN]: { translationKey: 'goalCategory.learn' },
    [GoalCategory.SOLVE]: { translationKey: 'goalCategory.solve' },
    [GoalCategory.CREATE]: { translationKey: 'goalCategory.create' },
    [GoalCategory.EXPLORE]: { translationKey: 'goalCategory.explore' },
    [GoalCategory.PRACTICE]: { translationKey: 'goalCategory.practice' },
};

export const STYLE_CATEGORY_DETAILS: Record<StyleCategory, { translationKey: string }> = {
    [StyleCategory.ANALYTICAL]: { translationKey: 'styleCategory.analytical' },
    [StyleCategory.EMPATHETIC]: { translationKey: 'styleCategory.empathetic' },
    [StyleCategory.PASSIONATE]: { translationKey: 'styleCategory.passionate' },
    [StyleCategory.WISE]: { translationKey: 'styleCategory.wise' },
    [StyleCategory.SUPPORTIVE]: { translationKey: 'styleCategory.supportive' },
};

export const GEOPOLITICAL_ZONE_DETAILS: Record<GeopoliticalZone, { translationKey: string }> = {
    [GeopoliticalZone.NORTH_CENTRAL]: { translationKey: 'geopoliticalZone.northCentral' },
    [GeopoliticalZone.NORTH_EAST]: { translationKey: 'geopoliticalZone.northEast' },
    [GeopoliticalZone.NORTH_WEST]: { translationKey: 'geopoliticalZone.northWest' },
    [GeopoliticalZone.SOUTH_EAST]: { translationKey: 'geopoliticalZone.southEast' },
    [GeopoliticalZone.SOUTH_SOUTH]: { translationKey: 'geopoliticalZone.southSouth' },
    [GeopoliticalZone.SOUTH_WEST]: { translationKey: 'geopoliticalZone.southWest' },
};

/**
 * Default Live API model to use
 */
export const DEFAULT_LIVE_API_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';