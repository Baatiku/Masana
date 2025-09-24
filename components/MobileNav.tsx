import React, { useContext } from 'react';
import { BriefcaseIcon, AcademicCapIcon, SparklesIcon, StarIcon, FlagIcon } from './icons/Icons';
import { AppState, SuperCategory } from '../types';
import { AppContext } from '../context/AppContext';

interface BottomNavBarProps {
  activeView: AppState;
  setAppState: (state: AppState) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setAppState }) => {
  const { selectedPersona, favoritePersonaIds } = useContext(AppContext);
  
  const navItems = [
    { state: 'home', icon: SparklesIcon, label: 'Kwararru' },
    { state: 'makaranta', icon: AcademicCapIcon, label: 'Makaranta' },
    { state: 'nigeria', icon: FlagIcon, label: 'Nigeria' },
    { state: 'tools', icon: BriefcaseIcon, label: 'Tools' },
    { state: 'favorites', icon: StarIcon, label: 'Favorites' },
  ];
  
  const isTabActive = (itemState: AppState): boolean => {
    if (activeView === itemState) return true;
    
    if (['chat', 'profile', 'call'].includes(activeView) && selectedPersona) {
        if (itemState === 'favorites') {
            return favoritePersonaIds.includes(selectedPersona.id);
        }

        const personaCategory = selectedPersona.category;
        switch(itemState) {
            case 'home':
                // FIX: Property 'MASANAWA' does not exist on type 'typeof SuperCategory'.
                return personaCategory === SuperCategory.KWARARRU;
            case 'makaranta':
                return personaCategory === SuperCategory.MAKARANTA;
            case 'nigeria':
                return personaCategory === SuperCategory.CIVIC_LIFE;
            case 'tools':
                return personaCategory === SuperCategory.TOOLS;
        }
    }
    return false;
  };

  return (
    <nav className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16">
      {navItems.map(item => (
        <button
          key={item.state}
          onClick={() => setAppState(item.state as AppState)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            isTabActive(item.state as AppState) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
          }`}
          aria-current={isTabActive(item.state as AppState)}
        >
          <item.icon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// FAB removed as per new design
export const Fab: React.FC<{ onClick: () => void }> = () => null;