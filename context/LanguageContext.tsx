import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { useProfile } from './ProfileContext';

export const LANGUAGES: { code: SupportedLanguage; name: string; localName: string }[] = [
  { code: 'en', name: 'English', localName: 'English' },
  { code: 'ha', name: 'Hausa', localName: 'Hausa' },
  { code: 'ig', name: 'Igbo', localName: 'Igbo' },
  { code: 'yo', name: 'Yoruba', localName: 'Yoruba' },
  { code: 'fr', name: 'French', localName: 'Français' },
];

interface ILanguageContext {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, variables?: Record<string, string>) => string;
  getLanguageName: (code: SupportedLanguage) => string;
  isTranslationsLoading: boolean;
  LANGUAGES: typeof LANGUAGES;
}

const LanguageContext = createContext<ILanguageContext | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslationsLoading, setIsTranslationsLoading] = useState(true);

  useEffect(() => {
    if (!profileLoading && profile) {
      setLanguageState(profile.language);
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    const fetchTranslations = async (lang: SupportedLanguage) => {
      setIsTranslationsLoading(true);
      try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) {
          throw new Error(`Could not load translations for ${lang} (status: ${response.status})`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(error);
        // Fallback to English if the desired language fails to load
        if (lang !== 'en') {
          console.warn(`Falling back to English translations.`);
          try {
            const response = await fetch(`/locales/en.json`);
             if (!response.ok) {
              throw new Error(`Fallback to English failed with status: ${response.status}`);
            }
            const data = await response.json();
            setTranslations(data);
          } catch (fallbackError) {
             console.error("Fallback to English also failed:", fallbackError);
             setTranslations({}); // Set to empty on total failure
          }
        } else {
            // This happens if English itself fails to load.
            setTranslations({});
        }
      } finally {
        setIsTranslationsLoading(false);
      }
    };

    fetchTranslations(language);
  }, [language]);

  const setLanguage = (newLanguage: SupportedLanguage) => {
    if (profile) {
        updateProfile({ language: newLanguage });
    }
    setLanguageState(newLanguage);
  };

  const t = (key: string, variables: Record<string, string> = {}): string => {
    let translation = translations[key] || key;
    Object.entries(variables).forEach(([varKey, value]) => {
      translation = translation.replace(new RegExp(`{${varKey}}`, 'g'), String(value));
    });
    return translation;
  };
  
  const getLanguageName = (code: SupportedLanguage): string => {
      return LANGUAGES.find(lang => lang.code === code)?.name || 'English';
  };

  const value = { language, setLanguage, t, getLanguageName, isTranslationsLoading, LANGUAGES };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): ILanguageContext => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
    // The previous hook implementation had complex logic to prevent showing keys during loading.
    // However, this can mask failures in the translation loading process.
    // The main app already has a loading screen (`AppContent.tsx`) that waits for `isTranslationsLoading`.
    // By simplifying this to return the core `t` function directly, we make the flow clearer.
    // If keys are still showing, it points directly to a failure in loading the JSON files.
    const { t } = useLanguage();
    return t;
}