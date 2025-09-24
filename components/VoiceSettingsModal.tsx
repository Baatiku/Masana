// Fix: Correctly import types and consume context for voice settings.
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useProfile } from '../context/ProfileContext';
import { Persona, VoiceSettings, PrebuiltVoice, VoiceOption } from '../types';
import { XIcon } from './icons/Icons';
import { VOICE_OPTIONS } from '../constants';
import { saveVoiceSetting } from '../services/db';

interface VoiceSettingsModalProps {
    persona: Persona;
    onClose: () => void;
}

const PITCH_LEVELS: VoiceSettings['pitch'][] = ['Very Low', 'Low', 'Normal', 'High', 'Very High'];
const SPEED_LEVELS: VoiceSettings['speed'][] = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];


const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ persona, onClose }) => {
    const { voiceSettings, setVoiceSettings } = useContext(AppContext);
    const { profile } = useProfile();
    
    const currentSettings = voiceSettings[persona.id];

    const [baseVoice, setBaseVoice] = useState<PrebuiltVoice>(currentSettings?.baseVoice || persona.voice);
    const [pitch, setPitch] = useState<VoiceSettings['pitch']>(currentSettings?.pitch || 'Normal');
    const [speed, setSpeed] = useState<VoiceSettings['speed']>(currentSettings?.speed || 'Normal');
    const [accent, setAccent] = useState<string>(currentSettings?.accent || `${persona.communicationStyle} ${persona.gender === 'female' ? 'female' : 'male'} voice`);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        const newSettings: VoiceSettings = { baseVoice, pitch, speed, accent };

        try {
            await saveVoiceSetting(profile.id, persona.id, newSettings);
            
            setVoiceSettings(prev => ({
                ...prev,
                [persona.id]: newSettings,
            }));
            
            onClose();

        } catch (error) {
            console.error("Failed to save voice settings:", error);
            alert("Could not save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const groupedVoices = useMemo(() => {
        return VOICE_OPTIONS.reduce((acc, voice) => {
            (acc[voice.gender] = acc[voice.gender] || []).push(voice);
            return acc;
        }, {} as Record<string, VoiceOption[]>);
    }, []);

    const renderSlider = (
        label: string, 
        value: string, 
        setter: (val: any) => void, 
        levels: string[]
    ) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}: <span className="font-semibold text-green-600 dark:text-green-400">{value}</span></label>
            <input
                type="range"
                min="0"
                max={levels.length - 1}
                value={levels.indexOf(value)}
                onChange={(e) => setter(levels[parseInt(e.target.value, 10)])}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2 accent-green-500"
            />
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Voice Settings for {persona.name}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><XIcon className="w-6 h-6"/></button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto">
                     <div>
                        <label htmlFor="baseVoice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Voice</label>
                        <select
                            id="baseVoice"
                            value={baseVoice}
                            onChange={(e) => setBaseVoice(e.target.value as PrebuiltVoice)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                        >
                            {Object.entries(groupedVoices).map(([gender, voices]) => (
                                <optgroup key={gender} label={gender.charAt(0).toUpperCase() + gender.slice(1)}>
                                    {/* FIX: Cast `voices` to `VoiceOption[]` to resolve TypeScript error. */}
                                    {(voices as VoiceOption[]).map(voice => (
                                        <option key={voice.id} value={voice.id}>{voice.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {renderSlider('Pitch', pitch, setPitch, PITCH_LEVELS)}
                    {renderSlider('Speed', speed, setSpeed, SPEED_LEVELS)}

                    <div>
                        <label htmlFor="accent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Accent Description</label>
                        <input
                            type="text"
                            id="accent"
                            value={accent}
                            onChange={(e) => setAccent(e.target.value)}
                            placeholder="e.g., Warm Nigerian accent"
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        />
                         <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Describe the accent you'd like the AI to use.</p>
                    </div>

                </main>

                <footer className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VoiceSettingsModal;
