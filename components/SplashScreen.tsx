

import React, { useEffect } from 'react';
import { AppLogo } from './icons/Icons';
import { useTranslation } from '../context/LanguageContext';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const t = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-50 dark:from-green-900 dark:via-gray-900 dark:to-green-700 animate-fadeIn">
      <div className="flex items-center space-x-4 animate-pulse">
        <AppLogo className="w-16 h-16" />
        <h1 className="text-5xl font-bold tracking-wider text-gray-800 dark:text-white">Kwararru</h1>
      </div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 animate-fadeIn" style={{ animationDelay: '1s' }}>
        {t('splash.tagline.kwararru')}
      </p>
    </div>
  );
};

export default SplashScreen;