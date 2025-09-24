import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useProfile } from '../context/ProfileContext';
import { Conversation, Persona } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { HistoryIcon, SearchIcon, TrashIcon, PinIcon, MessageSquareIcon, PinOffIcon } from '../components/icons/Icons';
import PersonaAvatar from '../components/PersonaAvatar';
import { PersonaListSkeletonItem } from '../components/skeletons/Skeletons';
import EmptyState from '../components/EmptyState';
import { getAllConversations, deleteConversation, updateConversation } from '../services/db';
import { fuzzySearchAndSort } from '../lib/search';

const ChatHistoryScreen: React.FC = () => {
    const { setAppState, setSelectedPersona } = useContext(AppContext);
    const { profile } = useProfile();
    const isMobile = useIsMobile();
    const t = useTranslation();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchConversations = async () => {
            if (!profile) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const data = await getAllConversations(profile.id);
                setConversations(data);
            } catch (error) {
                console.error("Failed to fetch conversations:", error);
            } finally {
                setLoading(false);
            }
        };

        if (profile) {
            fetchConversations();
        }
    }, [profile]);

    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) {
            return conversations;
        }
        return fuzzySearchAndSort<Conversation>(
            searchTerm,
            conversations,
            ['persona.name', 'last_message_snippet']
        );
    }, [conversations, searchTerm]);

    const handleBack = () => {
        setAppState('settings');
    };
    
    const handleDelete = async (conversationId: string) => {
        if (window.confirm(t('chatHistory.deleteConfirm'))) {
            try {
                await deleteConversation(conversationId);
                setConversations(prev => prev.filter(c => c.id !== conversationId));
            } catch (error) {
                console.error("Failed to delete conversation:", error);
                alert("Could not delete conversation. Please try again.");
            }
        }
    };

    const handleTogglePin = async (conversation: Conversation) => {
        try {
            const updatedConvo = { ...conversation, is_pinned: !conversation.is_pinned };
            await updateConversation(updatedConvo);
            
            const updatedConversations = conversations.map(c => c.id === updatedConvo.id ? updatedConvo : c);
            updatedConversations.sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                return new Date(b.last_message_timestamp).getTime() - new Date(a.last_message_timestamp).getTime();
            });
            setConversations(updatedConversations);

        } catch (error) {
             console.error("Failed to update pin status:", error);
             alert("Could not update pin status. Please try again.");
        }
    };
    
    const handleSelectConversation = (persona: Persona) => {
        setSelectedPersona(persona);
        setAppState('chat');
    };

    return (
        <div className={`h-full w-full flex flex-col bg-gray-100 dark:bg-gray-900`}>
            <header className={`p-4 flex items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
                <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobile ? "M15 19l-7-7 7-7" : "M10 19l-7-7m0 0l7-7m-7 7h18"} /></svg>
                </button>
                <h1 className="text-xl font-bold">{t('chatHistory.title')}</h1>
            </header>
            
            <div className="p-3 flex-shrink-0">
                <div className="relative">
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('chatHistory.search.placeholder')} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-gray-400" /></div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-2">
                {loading ? (
                    <div className="space-y-2">
                        <PersonaListSkeletonItem />
                        <PersonaListSkeletonItem />
                        <PersonaListSkeletonItem />
                    </div>
                ) : conversations.length === 0 ? (
                    <EmptyState
                        icon={<MessageSquareIcon className="w-16 h-16" />}
                        title={t('chatHistory.empty.title')}
                        message={t('chatHistory.empty.message')}
                        actionText={t('chatHistory.empty.action')}
                        onAction={() => setAppState('home')}
                    />
                ) : (
                    <ul className="space-y-2">
                        {filteredConversations.map(convo => (
                             <li key={convo.id} className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <div onClick={() => convo.persona && handleSelectConversation(convo.persona)} className="flex items-start p-3 space-x-4 cursor-pointer">
                                    <PersonaAvatar persona={convo.persona || { name: 'Unknown', avatarUrl: '' }} className="w-12 h-12 flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-md text-gray-900 dark:text-white truncate">{convo.persona?.name || 'Unknown Persona'}</h3>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{new Date(convo.last_message_timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{convo.last_message_snippet}</p>
                                        {convo.is_pinned && <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mt-2 inline-block">{t('chatHistory.pinned')}</span>}
                                    </div>
                                </div>
                                 <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleTogglePin(convo)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                        {convo.is_pinned 
                                            ? <PinIcon filled className="w-5 h-5 text-yellow-500" />
                                            : <PinIcon className="w-5 h-5 text-gray-500" />
                                        }
                                    </button>
                                     <button onClick={() => handleDelete(convo.id)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                        <TrashIcon className="w-5 h-5 text-red-500" />
                                    </button>
                                 </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ChatHistoryScreen;
