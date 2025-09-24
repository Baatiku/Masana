import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTranslation } from '../context/LanguageContext';
// Fix: The CallRecording type is not exported from db.ts. It is defined in types.ts.
import { getAllRecordings, deleteRecording } from '../services/db';
import { HistoryIcon, PlayIcon, PauseIcon, TrashIcon, ClockIcon } from '../components/icons/Icons';
import PersonaAvatar from '../components/PersonaAvatar';
import { Persona, CallRecording } from '../types';
import { CallHistorySkeletonItem } from '../components/skeletons/Skeletons';
import EmptyState from '../components/EmptyState';

const CallHistoryScreen: React.FC = () => {
    const { setAppState } = useContext(AppContext);
    const isMobile = useIsMobile();
    const t = useTranslation();
    const [recordings, setRecordings] = useState<CallRecording[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const fetchRecordings = async () => {
            try {
                const fetchedRecordings = await getAllRecordings();
                setRecordings(fetchedRecordings);
            } catch (error) {
                console.error("Failed to fetch recordings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecordings();
    }, []);

    useEffect(() => {
        const audioEl = audioRef.current;
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentlyPlaying(null);
        };
        audioEl?.addEventListener('ended', handleEnded);
        return () => {
            audioEl?.removeEventListener('ended', handleEnded);
        };
    }, []);

    const handleBack = () => {
        setAppState('settings');
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this recording?")) {
            await deleteRecording(id);
            setRecordings(prev => prev.filter(rec => rec.id !== id));
            if (currentlyPlaying === id) {
                audioRef.current?.pause();
                setCurrentlyPlaying(null);
                setIsPlaying(false);
            }
        }
    };
    
    const handlePlayPause = (recording: CallRecording) => {
        if (currentlyPlaying === recording.id) {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                audioRef.current?.play();
                setIsPlaying(true);
            }
        } else {
            const objectUrl = URL.createObjectURL(recording.audioBlob);
            if (audioRef.current) {
                audioRef.current.src = objectUrl;
                audioRef.current.play();
                setCurrentlyPlaying(recording.id!);
                setIsPlaying(true);
                // Note: We don't revoke the URL here; it's handled when the component unmounts
            }
        }
    };

    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    return (
        <div className={`h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900`}>
            <header className={`p-4 flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
                <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobile ? "M15 19l-7-7 7-7" : "M10 19l-7-7m0 0l7-7m-7 7h18"} /></svg>
                </button>
                <h1 className="text-xl font-bold">{t('settings.general.callHistory')}</h1>
            </header>
            
            <audio ref={audioRef} className="hidden" />

            <div className="flex-grow overflow-y-auto p-4">
                {isLoading ? (
                    <div className="space-y-3">
                        <CallHistorySkeletonItem />
                        <CallHistorySkeletonItem />
                        <CallHistorySkeletonItem />
                    </div>
                ) : recordings.length === 0 ? (
                    <EmptyState
                        icon={<HistoryIcon className="w-16 h-16" />}
                        title="No Recordings Found"
                        message="Your recorded calls will appear here."
                        actionText={t('callHistory.empty.action')}
                        onAction={() => setAppState('home')}
                    />
                ) : (
                    <ul className="space-y-3">
                        {recordings.map(rec => (
                            <li key={rec.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center space-x-4 shadow-sm border border-gray-200 dark:border-gray-700">
                                <PersonaAvatar persona={{ name: rec.personaName, avatarUrl: rec.personaAvatarUrl } as Persona} className="w-14 h-14 flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{rec.personaName}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(rec.timestamp).toLocaleString()}</p>
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      <ClockIcon className="w-3 h-3 mr-1.5" />
                                      <span>{formatTime(rec.duration)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={() => handlePlayPause(rec)} className="p-3 bg-green-100 text-green-700 dark:bg-green-600/20 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-600/40 transition-colors">
                                        {currentlyPlaying === rec.id && isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => handleDelete(rec.id!)} className="p-3 bg-red-100 text-red-600 dark:bg-red-600/20 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-600/40 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CallHistoryScreen;