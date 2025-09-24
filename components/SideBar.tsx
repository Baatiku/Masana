import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AppLogo, GearIcon, WalletIcon, StarIcon, AcademicCapIcon, BriefcaseIcon, SparklesIcon, FlagIcon } from './icons/Icons';
import { AppState, SuperCategory } from '../types';
import { useProfile } from '../context/ProfileContext';
import PersonaAvatar from './PersonaAvatar';

const SideBar: React.FC = () => {
    const { appState, setAppState, selectedPersona, favoritePersonaIds } = useContext(AppContext);
    const { profile } = useProfile();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const isTabActive = (itemState: AppState): boolean => {
        if (appState === itemState) return true;
        
        if (['chat', 'profile', 'call'].includes(appState) && selectedPersona) {
             if (itemState === 'favorites') {
                return favoritePersonaIds.includes(selectedPersona.id);
            }
            const category = selectedPersona.category;
            // FIX: Property 'MASANAWA' does not exist on type 'typeof SuperCategory'.
            if (itemState === 'home' && category === SuperCategory.KWARARRU) return true;
            if (itemState === 'makaranta' && category === SuperCategory.MAKARANTA) return true;
            if (itemState === 'nigeria' && category === SuperCategory.CIVIC_LIFE) return true;
            if (itemState === 'tools' && category === SuperCategory.TOOLS) return true;
        }
        
        return false;
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-20 h-full bg-white dark:bg-gray-900 flex flex-col justify-between items-center py-4 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex flex-col items-center space-y-6">
                <div className="w-12 h-12 flex items-center justify-center mb-4">
                    <AppLogo className="w-10 h-10" />
                </div>
                <button
                    onClick={() => setAppState('home')}
                    className={`p-3 rounded-lg transition-colors relative w-14 h-14 flex items-center justify-center ${
                        isTabActive('home') ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label="Masanawa"
                    aria-current={isTabActive('home')}
                >
                    <SparklesIcon className="w-7 h-7" />
                    {isTabActive('home') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 dark:bg-white rounded-r-md" />}
                </button>
                 <button
                    onClick={() => setAppState('makaranta')}
                    className={`p-3 rounded-lg transition-colors relative w-14 h-14 flex items-center justify-center ${
                        isTabActive('makaranta') ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label="Makaranta"
                    aria-current={isTabActive('makaranta')}
                >
                    <AcademicCapIcon className="w-7 h-7" />
                    {isTabActive('makaranta') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 dark:bg-white rounded-r-md" />}
                </button>
                 <button
                    onClick={() => setAppState('nigeria')}
                    className={`p-3 rounded-lg transition-colors relative w-14 h-14 flex items-center justify-center ${
                        isTabActive('nigeria') ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label="Nigeria"
                    aria-current={isTabActive('nigeria')}
                >
                    <FlagIcon className="w-7 h-7" />
                    {isTabActive('nigeria') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 dark:bg-white rounded-r-md" />}
                </button>
                 <button
                    onClick={() => setAppState('favorites')}
                    className={`p-3 rounded-lg transition-colors relative w-14 h-14 flex items-center justify-center ${
                        isTabActive('favorites') ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label="Favorites"
                    aria-current={isTabActive('favorites')}
                >
                    <StarIcon className="w-7 h-7" />
                    {isTabActive('favorites') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 dark:bg-white rounded-r-md" />}
                </button>
                 <button
                    onClick={() => setAppState('tools')}
                    className={`p-3 rounded-lg transition-colors relative w-14 h-14 flex items-center justify-center ${
                        isTabActive('tools') ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label="Tools"
                    aria-current={isTabActive('tools')}
                >
                    <BriefcaseIcon className="w-7 h-7" />
                    {isTabActive('tools') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 dark:bg-white rounded-r-md" />}
                </button>
            </div>
            <div className="flex flex-col items-center space-y-4">
                <div className="relative" ref={profileMenuRef}>
                    <button onClick={() => setIsProfileMenuOpen(o => !o)} aria-label="Open user menu">
                        <PersonaAvatar persona={{ name: profile?.full_name, avatarUrl: profile?.avatar_url }} className="w-12 h-12 cursor-pointer rounded-full ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-transparent hover:ring-green-500 transition-shadow" />
                    </button>
                    {isProfileMenuOpen && (
                        <div className="absolute bottom-0 left-full ml-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                           <ul className="py-1">
                                <li>
                                    <button onClick={() => { setAppState('wallet'); setIsProfileMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3">
                                        <WalletIcon className="w-5 h-5"/>
                                        <span>Wallet</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => { setAppState('settings'); setIsProfileMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3">
                                        <GearIcon className="w-5 h-5"/>
                                        <span>Settings</span>
                                    </button>
                                </li>
                           </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SideBar;