

import React from 'react';
import { AppLogo } from './icons/Icons';
import { useTranslation } from '../context/LanguageContext';

const ConversationPlaceholder: React.FC = () => {
    const t = useTranslation();
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center p-8 border-l border-gray-200 dark:border-gray-700" style={{ backgroundImage: "url('https://www.toptal.com/designers/subtlepatterns/uploads/connect.png')", backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(243, 244, 246, 0.95)' }}>
            <div className="h-full w-full flex flex-col items-center justify-center dark:bg-gray-900/90 bg-gray-100/90">
                <AppLogo className="w-24 h-24 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Kwararru for Desktop</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Select a persona to begin a conversation. Kwararru connects you with 'the professionals' to help you learn, create, and achieve your goals.
                </p>
            </div>
        </div>
    );
};

export default ConversationPlaceholder;