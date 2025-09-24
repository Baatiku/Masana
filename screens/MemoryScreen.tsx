import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useProfile } from '../context/ProfileContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { Memory, Persona } from '../types';
import { getAllMemoriesForUser, deleteMemory, deleteAllMemoriesForUser, getPersonas } from '../services/db';
import { ChipIcon, TrashIcon } from '../components/icons/Icons';
import PersonaAvatar from '../components/PersonaAvatar';
import EmptyState from '../components/EmptyState';
import { CallHistorySkeletonItem } from '../components/skeletons/Skeletons'; // Reusing skeleton

interface GroupedMemories {
    [personaId: string]: {
        persona: Persona;
        memories: Memory[];
    };
}

const MemoryScreen: React.FC = () => {
    const { setAppState } = useContext(AppContext);
    const { profile } = useProfile();
    const isMobile = useIsMobile();

    const [groupedMemories, setGroupedMemories] = useState<GroupedMemories>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMemories = async () => {
            if (!profile) return;
            setIsLoading(true);
            try {
                const [memories, personas] = await Promise.all([
                    getAllMemoriesForUser(profile.id),
                    getPersonas()
                ]);

                const personasMap = new Map(personas.map(p => [p.id, p]));

                const grouped = memories.reduce((acc, memory) => {
                    const persona = personasMap.get(memory.persona_id);
                    if (persona) {
                        if (!acc[memory.persona_id]) {
                            acc[memory.persona_id] = { persona, memories: [] };
                        }
                        acc[memory.persona_id].memories.push(memory);
                    }
                    return acc;
                }, {} as GroupedMemories);

                setGroupedMemories(grouped);

            } catch (error) {
                console.error("Failed to fetch memories:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMemories();
    }, [profile]);
    
    const handleBack = () => {
        setAppState('settings');
    };

    const handleDelete = async (id?: number) => {
        if (!id || !window.confirm("Are you sure you want to delete this memory?")) return;

        await deleteMemory(id);
        
        // Optimistically update UI
        setGroupedMemories(prev => {
            const newGrouped = { ...prev };
            for (const personaId in newGrouped) {
                const filtered = newGrouped[personaId].memories.filter(m => m.id !== id);
                if (filtered.length === 0) {
                    delete newGrouped[personaId];
                } else {
                    newGrouped[personaId].memories = filtered;
                }
            }
            return newGrouped;
        });
    };

    const handleDeleteAll = async () => {
        if (!profile || !window.confirm("Are you sure you want to delete ALL memories? This action cannot be undone.")) return;

        await deleteAllMemoriesForUser(profile.id);
        setGroupedMemories({});
    };

    return (
        <div className={`h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900`}>
            <header className={`p-4 flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
                <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobile ? "M15 19l-7-7 7-7" : "M10 19l-7-7m0 0l7-7m-7 7h18"} /></svg>
                </button>
                <h1 className="text-xl font-bold">Memory & Personalization</h1>
            </header>

            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm">
                    The AI learns these facts from your conversations to create a more personalized experience. You have full control to manage and delete them at any time.
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        <CallHistorySkeletonItem />
                        <CallHistorySkeletonItem />
                    </div>
                ) : Object.keys(groupedMemories).length === 0 ? (
                    <EmptyState
                        icon={<ChipIcon className="w-16 h-16" />}
                        title="No Memories Yet"
                        message="As you chat with different personas, key facts they learn about you will appear here."
                    />
                ) : (
                    <div className="space-y-4">
                        {Object.values(groupedMemories).map(({ persona, memories }) => (
                            <div key={persona.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-3 mb-3">
                                    <PersonaAvatar persona={persona} className="w-10 h-10 flex-shrink-0" />
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{persona.name}</h3>
                                </div>
                                <ul className="space-y-2">
                                    {memories.map(memory => (
                                        <li key={memory.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{memory.fact}</p>
                                            <button onClick={() => handleDelete(memory.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {Object.keys(groupedMemories).length > 0 && (
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        onClick={handleDeleteAll}
                        className="w-full bg-red-600/10 text-red-700 dark:text-red-400 font-semibold py-3 px-4 rounded-lg hover:bg-red-600/20 transition-colors"
                    >
                        Delete All Memories
                    </button>
                </footer>
            )}
        </div>
    );
};

export default MemoryScreen;