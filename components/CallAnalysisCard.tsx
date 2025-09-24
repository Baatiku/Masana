import React from 'react';
import { SpeechAnalysisReport } from '../types';
import { PhoneIcon } from './icons/Icons';

interface CallAnalysisCardProps {
    report: SpeechAnalysisReport;
    duration?: number | null;
}

const StatBar: React.FC<{ label: string, value: number, remark: string }> = ({ label, value, remark }) => {
    const percentage = Math.max(0, Math.min(100, value * 100));
    const barColor = percentage > 75 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{remark}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const CallAnalysisCard: React.FC<CallAnalysisCardProps> = ({ report, duration }) => {
    const formatTime = (seconds: number = 0) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const getPaceRemark = (pace: number) => {
        if (pace > 0.8) return 'Very Fast';
        if (pace > 0.7) return 'Fast';
        if (pace > 0.5) return 'Good';
        if (pace > 0.3) return 'Slow';
        return 'Very Slow';
    };

    const getClarityRemark = (hesitations: number) => {
        const hesitationsPerMinute = duration ? (hesitations / (duration / 60)) : 0;
        if (hesitationsPerMinute <= 2) return 'Excellent';
        if (hesitationsPerMinute <= 5) return 'Good';
        if (hesitationsPerMinute <= 10) return 'Some Fillers';
        return 'Many Fillers';
    };
    
    // Normalize hesitation count to a 0-1 score for the progress bar (lower is better)
    const clarityScore = duration ? Math.max(0, 1 - (report.hesitationCount / (duration / 60)) / 10) : 0.5;

    const getEngagementRemark = (engagement: number) => {
        if (engagement > 0.75) return 'Very Dynamic';
        if (engagement > 0.5) return 'Engaging';
        if (engagement > 0.25) return 'Slightly Monotone';
        return 'Monotone';
    };

    return (
        <div className="my-4 mx-auto max-w-lg">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Call Performance Report</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Summary of your practice session.</p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm font-mono text-gray-600 dark:text-gray-300">
                        <PhoneIcon className="w-4 h-4"/>
                        <span>{formatTime(duration || 0)}</span>
                    </div>
                </div>
                <div className="space-y-4 pt-4">
                    <StatBar 
                        label="Pacing"
                        value={report.avgPace}
                        remark={getPaceRemark(report.avgPace)}
                    />
                     <StatBar 
                        label="Clarity (Hesitations)"
                        value={clarityScore}
                        remark={`${report.hesitationCount} fillers (${getClarityRemark(report.hesitationCount)})`}
                    />
                     <StatBar 
                        label="Engagement"
                        value={report.engagement}
                        remark={getEngagementRemark(report.engagement)}
                    />
                </div>
            </div>
        </div>
    );
};

export default CallAnalysisCard;
