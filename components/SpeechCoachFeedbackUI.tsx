import React, { useMemo } from 'react';
import { TrendingUp, Wind, Zap } from 'lucide-react'; // Using lucide for icons

interface SpeechCoachFeedbackUIProps {
    analysisData: {
        paceHistory: number[];
        hesitationCount: number;
        engagementHistory: number[];
    };
}

const Gauge: React.FC<{ value: number; label: string; minLabel: string; maxLabel: string; icon: React.ReactNode }> = ({ value, label, minLabel, maxLabel, icon }) => {
    const percentage = Math.max(0, Math.min(1, value)) * 100;
    const rotation = -90 + (percentage * 1.8); // Map 0-100% to -90 to 90 degrees

    return (
        <div className="flex flex-col items-center text-center p-2 bg-white/5 dark:bg-black/20 rounded-xl backdrop-blur-sm w-36 h-36">
            <div className="flex items-center space-x-1.5">
                {icon}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
            </div>
            <div className="relative w-24 h-12 overflow-hidden mt-2">
                {/* Gauge Background */}
                <div className="absolute top-0 left-0 w-full h-full border-t-8 border-l-8 border-r-8 border-gray-300 dark:border-gray-600 rounded-t-full" style={{ borderBottom: 'none' }}></div>
                <div className="absolute top-0 left-0 w-full h-full border-t-8 border-l-8 border-r-8 border-green-500 rounded-t-full" style={{ 
                    borderBottom: 'none',
                    clipPath: `path('M 0 48 A 48 48 0 0 1 ${48 + 48 * Math.cos((rotation-90) * Math.PI/180)} ${48 + 48 * Math.sin((rotation-90) * Math.PI/180)} L 48 48 Z')`
                }}></div>
                {/* Needle */}
                <div 
                    className="absolute bottom-0 left-1/2 w-0.5 h-11 bg-gray-800 dark:bg-gray-200 origin-bottom transition-transform duration-500 ease-in-out" 
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                ></div>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full" style={{ transform: 'translate(-50%, 50%)' }}></div>
            </div>
            <div className="flex justify-between w-full text-xs text-gray-500 dark:text-gray-400 px-1 -mt-1">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );
};

const SpeechCoachFeedbackUI: React.FC<SpeechCoachFeedbackUIProps> = ({ analysisData }) => {
    
    const latestPace = useMemo(() => {
        if (analysisData.paceHistory.length === 0) return 0.5;
        // Simple moving average of last 3 readings for stability
        const recentPaces = analysisData.paceHistory.slice(-3);
        const avgPace = recentPaces.reduce((acc, p) => acc + p, 0) / recentPaces.length;
        
        // Normalize pace: ideal pace is around 60-70% speaking time.
        // Map 0-0.4 to 0-0.25 (Too Slow), 0.4-0.8 to 0.25-0.75 (Good), 0.8-1 to 0.75-1 (Too Fast)
        if (avgPace < 0.4) return avgPace / 1.6;
        if (avgPace > 0.8) return 0.75 + ((avgPace - 0.8) / 0.2) * 0.25;
        return 0.25 + ((avgPace - 0.4) / 0.4) * 0.5;

    }, [analysisData.paceHistory]);
    
    const latestEngagement = useMemo(() => {
         if (analysisData.engagementHistory.length === 0) return 0.5;
         const recentEngagements = analysisData.engagementHistory.slice(-3);
         return recentEngagements.reduce((acc, p) => acc + p, 0) / recentEngagements.length;
    }, [analysisData.engagementHistory]);


    return (
        <div className="w-full max-w-md flex items-center justify-center space-x-2 mt-4">
            <Gauge 
                label="Pacing" 
                value={latestPace}
                minLabel="Slow"
                maxLabel="Fast"
                icon={<Wind className="w-4 h-4 text-gray-800 dark:text-gray-200" />}
            />

            <div className="flex flex-col items-center text-center p-2 bg-white/5 dark:bg-black/20 rounded-xl backdrop-blur-sm w-36 h-36 justify-center">
                 <div className="flex items-center space-x-1.5 mb-2">
                    <Zap className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Clarity</span>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{analysisData.hesitationCount}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Hesitations</div>
            </div>

             <Gauge 
                label="Engagement" 
                value={latestEngagement}
                minLabel="Monotone"
                maxLabel="Dynamic"
                icon={<TrendingUp className="w-4 h-4 text-gray-800 dark:text-gray-200" />}
            />
        </div>
    );
};

export default SpeechCoachFeedbackUI;
