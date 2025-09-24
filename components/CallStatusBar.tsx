import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { PhoneHangupIcon } from './icons/Icons';
import PersonaAvatar from './PersonaAvatar';

const CallStatusBar: React.FC = () => {
    const { selectedPersona, callDuration, setAppState, endCall } = useContext(AppContext);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    if (!selectedPersona) return null;

    return (
        <div 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-50"
            role="alert"
            aria-live="assertive"
        >
            <div className="bg-green-600/80 backdrop-blur-md text-white rounded-full shadow-2xl flex items-center justify-between p-2 animate-pulse-bg">
                <button
                    onClick={() => setAppState('call')}
                    className="flex items-center space-x-3 flex-grow text-left hover:bg-white/10 rounded-full p-1 transition-colors"
                    aria-label={`Return to call with ${selectedPersona.name}`}
                >
                    <PersonaAvatar persona={selectedPersona} className="w-10 h-10 border-2 border-white/50" />
                    <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm truncate">{selectedPersona.name}</p>
                        <p className="text-xs opacity-80">Ongoing call</p>
                    </div>
                </button>
                <div className="flex items-center space-x-3 px-3 flex-shrink-0">
                    <span className="font-mono text-sm font-semibold">{formatTime(callDuration)}</span>
                    <button
                        onClick={() => endCall(callDuration)}
                        className="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                        aria-label="End call"
                    >
                        <PhoneHangupIcon className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes pulse-bg {
                    0%, 100% { background-color: rgba(22, 163, 74, 0.8); } /* green-600 with opacity */
                    50% { background-color: rgba(21, 128, 61, 0.8); } /* green-700 with opacity */
                }
                .animate-pulse-bg {
                    animation: pulse-bg 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default CallStatusBar;