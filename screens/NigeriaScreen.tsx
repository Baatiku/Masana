import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Persona, SuperCategory, GeopoliticalZone } from '../types';
import { CrownIcon, AppLogo, SearchIcon, WalletIcon, GearIcon, StarIcon, FlagIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import PersonaAvatar from '../components/PersonaAvatar';
import EmptyState from '../components/EmptyState';
import { fuzzySearchAndSort } from '../lib/search';
import LanguageSwitcher from '../components/LanguageSelector';
import { GEOPOLITICAL_ZONE_DETAILS } from '../constants';

interface PersonaListItemProps {
  persona: Persona;
  onSelect: (persona: Persona | null) => void;
  isSelected: boolean;
}

const PersonaListItem: React.FC<PersonaListItemProps> = ({ persona, onSelect, isSelected }) => {
  const { setAppState, favoritePersonaIds, toggleFavorite } = useContext(AppContext);
  const isMobile = useIsMobile();
  const isFavorite = favoritePersonaIds.includes(persona.id);

  const handleClick = () => {
    const newPersona = isSelected ? null : persona;
    onSelect(newPersona);
    if (isMobile && newPersona) {
      setAppState('chat');
    }
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(persona.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group flex items-start p-3 space-x-4 cursor-pointer transition-all bg-white dark:bg-gray-800 border rounded-xl shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 ${isSelected ? 'border-green-500 dark:border-green-400 ring-2 ring-green-500/20 dark:ring-green-400/20' : 'border-gray-200 dark:border-gray-700'}`}
      role="button"
      aria-pressed={isSelected}
    >
      <PersonaAvatar persona={persona} className="w-12 h-12 flex-shrink-0 mt-1" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-md text-gray-900 dark:text-white truncate">{persona.name}</h3>
          {persona.isPremium && <CrownIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
        </div>
        <div className="mt-1.5">
          <span className="inline-block max-w-full text-xs bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded-full truncate">
            {persona.title}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-2">{persona.description}</p>
      </div>
      <button onClick={handleFavoriteToggle} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 transition-all" aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <StarIcon filled={isFavorite} className={`w-5 h-5 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`} />
      </button>
    </div>
  );
};


type NigeriaTab = 'Overview' | 'Federal' | 'States & FCT' | 'Figures';
const TABS: NigeriaTab[] = ['Overview', 'Federal', 'States & FCT', 'Figures'];
const ZONES = Object.keys(GEOPOLITICAL_ZONE_DETAILS) as GeopoliticalZone[];

const NigeriaScreen: React.FC = () => {
    const { personas, setSelectedPersona, setAppState, selectedPersona, tokenBalance } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<NigeriaTab>(TABS[1]); // Default to Federal
    const [activeZone, setActiveZone] = useState<GeopoliticalZone | 'All'>('All');
    const t = useTranslation();
    const isMobile = useIsMobile();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const civicPersonas = useMemo(() => personas.filter(p => p.category === SuperCategory.CIVIC_LIFE), [personas]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setActiveZone('All');
    };

    const filteredPersonas = useMemo(() => {
        let basePersonas: Persona[] = [];
        
        switch (activeTab) {
            case 'Federal':
                basePersonas = civicPersonas.filter(p => p.role === 'Ministry');
                break;
            case 'States & FCT':
                basePersonas = civicPersonas.filter(p => p.role === 'State Emissary');
                if (activeZone !== 'All') {
                    basePersonas = basePersonas.filter(p => p.geopoliticalZone === activeZone);
                }
                break;
            case 'Figures':
                basePersonas = civicPersonas.filter(p => p.role === 'Historical Figure' || p.id.startsWith('figure-'));
                break;
            default:
                basePersonas = [];
        }

        if (searchQuery.trim()) {
            const searchKeys: (keyof Persona)[] = ['name', 'title', 'specialty', 'description', 'expertise'];
            return fuzzySearchAndSort(searchQuery.trim(), basePersonas, searchKeys);
        }
        
        // Interleave by gender for default view
        const males = basePersonas.filter(p => p.gender === 'male');
        const females = basePersonas.filter(p => p.gender === 'female');
        const result: Persona[] = [];
        const maxLength = Math.max(males.length, females.length);
        for (let i = 0; i < maxLength; i++) {
            if (males[i]) result.push(males[i]);
            if (females[i]) result.push(females[i]);
        }
        return result;
        
    }, [searchQuery, activeTab, activeZone, civicPersonas]);

    const renderPersonaList = (personaList: Persona[]) => {
        if (personaList.length === 0) {
            return (
                 <EmptyState 
                    icon={<SearchIcon className="w-12 h-12" />}
                    title={t('emptyState.title.noResults')}
                    message={t('emptyState.message.adjustFilters')}
                    actionText={t('emptyState.button.clearFilters')}
                    onAction={handleClearFilters}
                />
            );
        }
        return (
            <div className="space-y-2">
                {personaList.map(p => 
                    <PersonaListItem 
                        key={p.id}
                        persona={p} 
                        onSelect={setSelectedPersona}
                        isSelected={selectedPersona?.id === p.id}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <header className={`p-4 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
                <div className="flex items-center space-x-2">
                    {isMobile && <AppLogo className="w-10 h-10" />}
                    <h1 className="text-xl font-bold">Nigeria</h1>
                </div>
                {isMobile ? (
                    <div className="flex items-center space-x-2">
                        <LanguageSwitcher />
                        <button onClick={() => setAppState('wallet')} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={`Wallet balance: ${tokenBalance} tokens`}>
                            <WalletIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
                            <span className="text-sm font-semibold">{tokenBalance.toLocaleString()}</span>
                        </button>
                        <button onClick={() => setAppState('settings')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors" aria-label="Settings">
                            <GearIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                ) : (
                    <LanguageSwitcher />
                )}
            </header>

            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <nav className="flex space-x-1 px-2" aria-label="Nigeria Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 group inline-flex items-center justify-center py-3 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 dark:border-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden">
                {activeTab === 'Overview' ? (
                    <div className="flex-grow p-6 text-center flex flex-col items-center justify-center">
                        <FlagIcon className="w-16 h-16 text-green-600 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Explore Nigerian Civic Life</h2>
                        <p className="max-w-md mt-2 text-gray-600 dark:text-gray-400">
                            Engage with AI personas representing federal ministries, state emissaries, and notable historical figures to learn more about Nigeria's governance, culture, and history.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="px-3 pt-3 pb-1 flex-shrink-0">
                            <div className="relative">
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab}...`} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg py-2 pl-10 pr-4 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500" />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-gray-400" /></div>
                            </div>
                        </div>

                        {activeTab === 'States & FCT' && (
                            <div ref={scrollContainerRef} className="flex-shrink-0 overflow-x-auto py-2 px-2 no-scrollbar">
                                <div className="flex space-x-2">
                                    <button onClick={() => setActiveZone('All')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${activeZone === 'All' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>All</button>
                                    {ZONES.map(zone => (
                                        <button key={zone} onClick={() => setActiveZone(zone)} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${activeZone === zone ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                            {t(GEOPOLITICAL_ZONE_DETAILS[zone].translationKey)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-grow overflow-y-auto p-2 pb-20">
                            {renderPersonaList(filteredPersonas)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NigeriaScreen;