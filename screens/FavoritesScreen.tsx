import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Persona } from '../types';
import { CrownIcon, StarIcon } from '../components/icons/Icons';
import { useIsMobile } from '../hooks/useIsMobile';
import PersonaAvatar from '../components/PersonaAvatar';
import EmptyState from '../components/EmptyState';
import LanguageSwitcher from '../components/LanguageSelector';

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
                        {persona.specialty}
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


const FavoritesScreen: React.FC = () => {
    const { personas, favoritePersonaIds, setSelectedPersona, setAppState, selectedPersona } = useContext(AppContext);
    const isMobile = useIsMobile();
    
    const favoritePersonas = useMemo(() => {
        const favoriteSet = new Set(favoritePersonaIds);
        return personas.filter(p => favoriteSet.has(p.id));
    }, [personas, favoritePersonaIds]);


    return (
        <div className="h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <header className={`p-4 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
                <div className="flex items-center space-x-3">
                    <StarIcon className="w-7 h-7 text-yellow-400" filled />
                    <h1 className="text-xl font-bold">Favorites</h1>
                </div>
                <LanguageSwitcher />
            </header>

            <div className="flex-grow overflow-y-auto p-2 pb-20">
                {favoritePersonas.length === 0 ? (
                     <EmptyState 
                        icon={<StarIcon className="w-12 h-12" />}
                        title="No Favorites Yet"
                        message="Click the star icon on any persona to add them to your favorites list for quick access."
                    />
                ) : (
                    <div className="space-y-2">
                        {favoritePersonas.map(p => 
                            <PersonaListItem 
                                key={p.id}
                                persona={p} 
                                onSelect={setSelectedPersona}
                                isSelected={selectedPersona?.id === p.id}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesScreen;