import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CrownIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import LanguageSelector from '../components/LanguageSelector';
import PersonaAvatar from '../components/PersonaAvatar';

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-gray-200 dark:bg-gray-700 text-sm px-3 py-1 rounded-full">{children}</span>
);

const DefaultProfileView: React.FC = () => {
  const { selectedPersona } = useContext(AppContext);
  const t = useTranslation();

  if (!selectedPersona) return null;

  return (
    <>
      <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto">{selectedPersona.longDescription}</p>
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-2">{t('profile.expertise')}</h3>
        <div className="flex flex-wrap gap-2">
          {selectedPersona.expertise.map(e => <Pill key={e}>{e}</Pill>)}
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-2">{t('profile.communicationStyle')}</h3>
        <p className="text-gray-600 dark:text-gray-300">{selectedPersona.communicationStyle}</p>
      </div>
    </>
  );
};


export const PersonaProfileScreen: React.FC = () => {
  const { selectedPersona, setAppState } = useContext(AppContext);
  const t = useTranslation();
  const isMobile = useIsMobile();

  if (!selectedPersona) {
    return <div className="p-4">Persona not found.</div>;
  }

  const handleBack = () => {
    if (isMobile) {
      setAppState('chat');
    } else {
      setAppState('home');
    }
  };
  
  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-800">
      <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        </div>
        {isMobile && <LanguageSelector />}
      </header>
      
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <PersonaAvatar persona={selectedPersona} className="w-36 h-36 mx-auto mb-4 border-4 border-green-500" />
             {selectedPersona.isPremium && <CrownIcon className="absolute top-0 right-0 w-8 h-8 text-yellow-400 bg-gray-50 dark:bg-gray-800 p-1 rounded-full" />}
          </div>
          <h2 className="text-3xl font-bold">{selectedPersona.name}</h2>
          <p className="text-green-600 dark:text-green-400">{selectedPersona.title}</p>
        </div>
        
        <DefaultProfileView />

      </div>
    </div>
  );
};