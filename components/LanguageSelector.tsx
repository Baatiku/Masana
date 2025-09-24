import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';

const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage, LANGUAGES } = useLanguage();

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  return (
    <div className={`flex items-center space-x-1 p-0.5 bg-gray-200 dark:bg-gray-700 rounded-full ${className}`}>
      {LANGUAGES.map(langInfo => (
        <button
          key={langInfo.code}
          onClick={() => handleSetLanguage(langInfo.code)}
          className={`px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
            language === langInfo.code
              ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
          aria-pressed={language === langInfo.code}
          aria-label={`Switch to ${langInfo.name}`}
        >
          {langInfo.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;