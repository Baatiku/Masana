import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Persona, SuperCategory } from '../../types';
import { AppLogo, WalletIcon, ChipIcon, BriefcaseIcon, ShieldCheckIcon, CrownIcon, ChevronRightIcon, GavelIcon, SparklesIcon, AcademicCapIcon, UserIcon, GearIcon, StarIcon } from '../../components/icons/Icons';
import { useIsMobile } from '../../hooks/useIsMobile';
import EmptyState from '../../components/EmptyState';
import { useTranslation } from '../../context/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSelector';

const ToolListItem: React.FC<{ persona: Persona; onSelect: (persona: Persona) => void }> = ({ persona, onSelect }) => {
    const { favoritePersonaIds, toggleFavorite } = useContext(AppContext);
    const isFavorite = favoritePersonaIds.includes(persona.id);
    
    const handleFavoriteToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFavorite(persona.id);
    };
    
    // A simplified icon logic for Makers
    const getIcon = () => {
        const iconProps = { className: "w-7 h-7 text-green-600 dark:text-green-400" };
        return <SparklesIcon {...iconProps} />;
    };

    return (
        <div className="relative group">
            <button
                onClick={() => onSelect(persona)}
                className="w-full text-left flex items-center p-4 space-x-4 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                aria-label={`Launch ${persona.name}`}
            >
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                    {getIcon()}
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white">{persona.name}</h3>
                        {persona.isPremium && <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs font-medium">
                            <CrownIcon className="w-3 h-3"/>
                            <span>Premium</span>
                        </div>}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">{persona.description}</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </button>
             <button onClick={handleFavoriteToggle} className="absolute top-2 right-12 p-1.5 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 transition-all" aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <StarIcon filled={isFavorite} className={`w-5 h-5 ${isFavorite ? 'text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`} />
            </button>
        </div>
    );
};

type ToolTab = 'Students' | 'Business' | 'Professional';

const STUDENT_TOOLS = [
    'maker-essay-outliner', // Male
    'maker-study-plan', // Female
    'maker-research-summary', // Male
    'maker-presentation-creator', // Female
    'maker-resume-builder', // Male
    'maker-group-project-planner', // Female
    'maker-flashcard-maker', // Male
    'maker-citation-generator', // Female
    'maker-creative-story-writer' // Female
];

const BUSINESS_TOOLS = [
    'maker-business-planner', // Male
    'maker-grant-writer', // Female
    'maker-press-release', // Male
    'maker-content-creator', // Female
    'maker-meeting-agenda', // Male
    'maker-legal-drafter', // Female
    'maker-project-proposal', // Male
    'maker-marketing-copywriter', // Female
    'maker-swot-analysis', // Female
    'maker-meeting-summarizer' // Female
];

const PROFESSIONAL_TOOLS = [
    'maker-speech-coach', // Male
    'maker-policy-brief', // Female
    'maker-screenwriter', // Male
    'maker-constituency-update', // Female
    'maker-job-app-assistant', // Male
    'maker-professional-email', // Female
    'maker-travel-itinerary-planner', // Male
    'maker-workout-planner' // Female
];

const ToolsScreen: React.FC = () => {
    const { personas, setAppState, setSelectedPersona, tokenBalance } = useContext(AppContext);
    const isMobile = useIsMobile();
    const t = useTranslation();
    const [activeTab, setActiveTab] = useState<ToolTab>('Students');
    
    const makerPersonas = useMemo(() => personas.filter(p => p.category === SuperCategory.TOOLS && p.subCategory === 'Makers'), [personas]);

    const filteredPersonas = useMemo(() => {
        let toolIds: string[] = [];
        switch(activeTab) {
            case 'Students':
                toolIds = STUDENT_TOOLS;
                break;
            case 'Business':
                toolIds = BUSINESS_TOOLS;
                break;
            case 'Professional':
                toolIds = PROFESSIONAL_TOOLS;
                break;
        }
        return toolIds.map(id => makerPersonas.find(p => p.id === id)).filter((p): p is Persona => !!p);

    }, [activeTab, makerPersonas]);

    const handleSelect = (persona: Persona) => {
        setSelectedPersona(persona);
        setAppState('chat');
    };

    const TABS: ToolTab[] = ['Students', 'Business', 'Professional'];

    return (
        <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <header className={`p-4 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900 ${!isMobile ? 'h-[73px]' : ''}`}>
                 <div className="flex items-center space-x-2">
                    {isMobile && <AppLogo className="w-10 h-10" />}
                    <h1 className="text-xl font-bold">Tools</h1>
                </div>
                {isMobile ? (
                    <div className="flex items-center space-x-2">
                        <LanguageSwitcher />
                        <button onClick={() => setAppState('wallet')} className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800/50 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label={`Wallet balance: ${tokenBalance} tokens`}>
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
            
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <nav className="flex space-x-1 px-2" aria-label="Tool Categories">
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

            <div className="flex-grow overflow-y-auto bg-white dark:bg-gray-900 p-2 pb-20">
                {filteredPersonas.length === 0 ? (
                    <EmptyState 
                        icon={<BriefcaseIcon className="w-12 h-12" />}
                        title={t('emptyState.title.noResults')}
                        message={t('emptyState.message.checkLater')}
                    />
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredPersonas.map(persona => (
                            <ToolListItem key={persona.id} persona={persona} onSelect={handleSelect} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolsScreen;