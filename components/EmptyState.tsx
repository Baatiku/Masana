import React, { ReactNode } from 'react';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, onAction }) => {
    return (
        <div className="text-center py-10 px-4 flex flex-col items-center justify-center h-full">
            <div className="text-gray-400">{icon}</div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{message}</p>
            {onAction && actionText && (
                <button
                    onClick={onAction}
                    className="mt-6 bg-green-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
