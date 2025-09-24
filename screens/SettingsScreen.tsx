// This file implements the Settings Screen for the application.
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CrownIcon, ShieldCheckIcon, HelpCircleIcon, FileTextIcon, InfoIcon, ChevronRightIcon, HistoryIcon, SunIcon, MoonIcon, UserIcon, MessageSquareIcon, RefreshIcon, ChipIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import LanguageSelector from '../components/LanguageSelector';
import { useProfile } from '../context/ProfileContext';
import PersonaAvatar from '../components/PersonaAvatar';
import { useSync } from '../context/SyncContext';


const ThemeToggleItem: React.FC = () => {
    const { theme, setTheme } = useContext(AppContext);
    
    return (
        <div className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-4">
                {theme === 'light' ? <SunIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <MoonIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                <span className="text-gray-900 dark:text-white">Theme</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="sr-only peer" id="theme-toggle" />
                <label htmlFor="theme-toggle" className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></label>
            </div>
        </div>
    );
};

const SyncSection: React.FC = () => {
    const { isEnabled, isSignedIn, isSyncing, lastSyncTime, syncError, signIn, signOut, backupData } = useSync();

    if (!isEnabled) {
        return (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg text-sm">
                Sync functionality is not configured. Please set the GOOGLE_CLIENT_ID environment variable.
            </div>
        )
    }
    
    const getStatusText = () => {
        if (isSyncing) return 'Syncing...';
        if (syncError) return `Error: ${syncError}`;
        if (isSignedIn && lastSyncTime) return `Last sync: ${new Date(lastSyncTime).toLocaleString()}`;
        if (isSignedIn) return 'Connected. Ready to sync.';
        return 'Not connected.';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Sync & Backup</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getStatusText()}</p>
                </div>
                {isSignedIn && (
                    <button
                        onClick={backupData}
                        disabled={isSyncing}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50"
                        title="Sync Now"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>
            {isSignedIn ? (
                 <button onClick={signOut} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm">
                    Disconnect Google Drive
                </button>
            ) : (
                <button onClick={signIn} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    Connect to Google Drive
                </button>
            )}
             <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                Backs up your data to a private folder in your Google Drive.
            </p>
        </div>
    );
};


const SettingsScreen: React.FC = () => {
  const { setAppState, isPremium, setIsPremium } = useContext(AppContext);
  const { profile } = useProfile();
  const t = useTranslation();
  const isMobile = useIsMobile();

  const handleBack = () => {
    setAppState('home');
  }

  return (
    <div className={`h-full w-full flex flex-col ${isMobile ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
      {isMobile ? (
        <header className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl font-bold">{t('settings.title')}</h1>
          </div>
          <LanguageSelector />
        </header>
      ) : (
        <header className="p-4 h-[73px] flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        </header>
      )}

      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4">{t('settings.account.title')}</h3>
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                 <button onClick={() => setAppState('myProfile')} className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors rounded-lg">
                    <div className="flex items-center space-x-4">
                        <PersonaAvatar persona={{ name: profile?.full_name, avatarUrl: profile?.avatar_url }} className="w-12 h-12" />
                        <div>
                            <span className="font-semibold text-lg text-gray-900 dark:text-white">{profile?.full_name || 'Valued User'}</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-left">{t('settings.account.myProfileDescription')}</p>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
             </div>
        </div>

        {isPremium ? (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-center shadow-lg">
            <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold text-white">{t('settings.premium.title')}</h2>
            <p className="text-green-200 mt-2">{t('settings.premium.description')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md">
            <CrownIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-2xl font-bold">{t('settings.upgrade.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('settings.upgrade.description')}</p>
            <button 
              onClick={() => setIsPremium(true)}
              className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('settings.upgrade.button')}
            </button>
          </div>
        )}
        
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4">Backup</h3>
            <SyncSection />
        </div>
        
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4">Appearance</h3>
            <ThemeToggleItem />
        </div>

        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4">{t('settings.general.title')}</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                 <SettingsItem icon={<ChipIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text="Memory & Personalization" onClick={() => setAppState('memory')} />
                 <SettingsItem icon={<InfoIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text={t('settings.general.about')} />
                 <SettingsItem icon={<MessageSquareIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text={t('settings.general.chatHistory')} onClick={() => setAppState('chatHistory')} />
                 <SettingsItem icon={<HistoryIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text={t('settings.general.callHistory')} onClick={() => setAppState('callHistory')} />
                 <SettingsItem icon={<HelpCircleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text={t('settings.general.help')} />
            </div>
        </div>
        
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4">{t('settings.legal.title')}</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <SettingsItem icon={<FileTextIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text={t('settings.legal.privacy')} />
                <SettingsItem icon={<FileTextIcon className="w-5 h-5 text-gray-500 dark:text-gray-400"/>} text={t('settings.legal.terms')} />
            </div>
        </div>
        
        <div className="text-center text-gray-500 text-xs">
            {t('settings.version')}
        </div>
      </div>
    </div>
  );
};

const SettingsItem: React.FC<{icon: React.ReactNode, text: string, onClick?: () => void}> = ({icon, text, onClick}) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 dark:border-gray-900/50 last:border-b-0 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:hover:bg-transparent" disabled={!onClick}>
        <div className="flex items-center space-x-4">
            {icon}
            <span className="text-gray-900 dark:text-white">{text}</span>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    </button>
);


export default SettingsScreen;