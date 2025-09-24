import React, { useState, useEffect, useRef, useContext, useMemo, useCallback, ReactNode } from 'react';
import { AppContext } from '../context/AppContext';
// Fix: Import PersonaRole to correctly filter for 'AIdviser' personas.
import { ChatMessage, PrebuiltVoice, SupportedLanguage, Persona, SuperCategory, PersonaRole } from '../types';
import { GoogleGenAI, Chat, Type } from '@google/genai';
import { PhoneIcon, SendIcon, InfoIcon, UserIcon, XIcon, GlobeIcon, ChevronDownIcon, RefreshIcon, RecordIcon } from '../components/icons/Icons';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import DocumentMessage from '../components/DocumentMessage';
import LanguageSelector from '../components/LanguageSelector';
import PersonaAvatar from '../components/PersonaAvatar';
import { useProfile } from '../context/ProfileContext';
import WizardChat from '../components/WizardChat';
import { getOrCreateConversation, getMessages, saveMessage, getFullHistoryForAI, getMemories, addMemory, clearMessagesForConversation } from '../services/db';
import { useSync } from '../context/SyncContext';
import CallAnalysisCard from '../components/CallAnalysisCard';


const MESSAGES_PER_PAGE = 25;

// Helper function to parse message content for suggestions
const parseMessageContent = (text: string): { pretext: string, suggestionData: any | null } => {
    const suggestionRegex = /\[SUGGESTION:(.*?)\]/s; // Use 's' flag to match across lines if needed
    const match = text.match(suggestionRegex);

    if (!match || !match[1]) {
        return { pretext: text, suggestionData: null };
    }

    try {
        const suggestionData = JSON.parse(match[1]);
        const pretext = text.substring(0, match.index);
        return { pretext, suggestionData };
    } catch (e) {
        console.error("Failed to parse suggestion JSON:", match[1], e);
        return { pretext: text, suggestionData: null }; // Return full text on parse error
    }
};

// Helper function to render inline markdown elements
const renderInlineMarkdown = (text: string): React.ReactNode => {
    // This regex will split the string by markdown delimiters, but keep the delimiters.
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`|`.*?`)/g);
    
    return parts.filter(Boolean).map((part, index) => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-gray-200 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded px-1 py-0.5 text-sm font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

// Polished markdown renderer for chat messages
const renderPolishedMarkdown = (markdown: string = ""): React.ReactNode => {
    if (!markdown) return null;
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            const ListComponent = listType === 'ol' ? 'ol' : 'ul';
            const listClasses = listType === 'ol' 
                ? "list-decimal list-inside space-y-1 my-1 pl-5" 
                : "list-disc list-inside space-y-1 my-1 pl-5";
            elements.push(React.createElement(ListComponent, { key: `list-${elements.length}`, className: listClasses }, listItems));
            listItems = [];
        }
        listType = null;
    };

    lines.forEach((line, index) => {
        if (line.startsWith('# ')) {
            flushList();
            elements.push(<h1 key={index} className="text-lg font-bold mt-2 mb-1">{renderInlineMarkdown(line.substring(2))}</h1>);
            return;
        }
        if (line.startsWith('## ')) {
            flushList();
            elements.push(<h2 key={index} className="text-md font-bold mt-1 mb-1">{renderInlineMarkdown(line.substring(3))}</h2>);
            return;
        }
        if (line.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="font-bold">{renderInlineMarkdown(line.substring(4))}</h3>);
            return;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            listItems.push(<li key={index}>{renderInlineMarkdown(line.substring(2))}</li>);
            return;
        }

        const orderedListMatch = line.match(/^(\d+)\.\s(.*)/);
        if (orderedListMatch) {
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
            }
            listItems.push(<li key={index}>{renderInlineMarkdown(orderedListMatch[2])}</li>);
            return;
        }
        
        flushList();

        if (line.trim() !== '') {
            elements.push(<p key={index} className="my-1">{renderInlineMarkdown(line)}</p>);
        }
    });

    flushList();
    return elements;
};

const FoldableSources: React.FC<{ groundingChunks: any[] }> = ({ groundingChunks }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const validSources = useMemo(() => groundingChunks.filter(chunk => chunk.web && chunk.web.uri), [groundingChunks]);

    if (validSources.length === 0) return null;

    return (
        <div className="mt-2 pl-2 max-w-xs md:max-w-md lg:max-w-2xl">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-1 rounded-md hover:bg-black/5 dark:hover:bg-gray-700/50 transition-colors text-left"
                aria-expanded={isExpanded}
            >
                <h4 className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    Sources ({validSources.length})
                </h4>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <ol className="space-y-1 mt-1 pl-2">
                    {validSources.map((chunk: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 dark:text-green-400 hover:underline truncate" title={chunk.web.title}>
                                {chunk.web.title || new URL(chunk.web.uri).hostname}
                            </a>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
};


const ChatScreen: React.FC = () => {
    const { selectedPersona, setAppState, startCall, isPremium, setSelectedPersona, theme, isGeminiKeyMissing, lastCallInfo, setLastCallInfo, personas, isScreenRecording, toggleScreenRecording } = useContext(AppContext);
    const { profile } = useProfile();
    const { language, getLanguageName, t } = useLanguage();
    const { scheduleBackup } = useSync();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [lastVisible, setLastVisible] = useState<any>(null);
    
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const textInputRef = useRef<HTMLInputElement>(null);

    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);
    
    // Component to render text with a character-by-character typing animation
    const TypingTextMessage: React.FC<{ text: string }> = ({ text }) => {
        const [displayedText, setDisplayedText] = useState('');
        const prevTextRef = useRef('');

        useEffect(() => {
            const fullText = text || '';
            // If the text hasn't changed, do nothing.
            if (prevTextRef.current === fullText) {
                return;
            }

            // Find the new part of the text that needs to be animated
            const newChunk = fullText.substring(prevTextRef.current.length);
            prevTextRef.current = fullText;
            
            if (newChunk) {
                let i = 0;
                const intervalId = setInterval(() => {
                    setDisplayedText(prev => prev + newChunk[i]);
                    i++;
                    if (i >= newChunk.length) {
                        clearInterval(intervalId);
                    }
                }, 15); // Typing speed in milliseconds

                return () => clearInterval(intervalId);
            }
        }, [text]);

        const { pretext } = parseMessageContent(displayedText);
        return (
            <div className="text-gray-900 dark:text-white">{renderPolishedMarkdown(pretext)}</div>
        );
    };

    // Component to render the suggestion card
    const SuggestionCard: React.FC<{ suggestionData: any }> = ({ suggestionData }) => {
        const { personas, setSelectedPersona } = useContext(AppContext);
        
        if (!suggestionData || !suggestionData.id || !suggestionData.type) return null;

        const suggestedPersona = personas.find(p => p.id === suggestionData.id);

        if (!suggestedPersona) {
            console.warn(`Suggested persona with id "${suggestionData.id}" not found.`);
            return null;
        }

        const handleSelect = () => {
            setSelectedPersona(suggestedPersona);
        };
        
        const buttonText = suggestionData.type === 'tool' 
            ? `Use ${suggestedPersona.name}` 
            : `Chat with ${suggestedPersona.name}`;
        
        return (
            <div className="mt-3 border-t border-gray-300 dark:border-gray-600/50 pt-3 text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">SUGGESTION</p>
                <div className="flex items-center space-x-3 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                    <PersonaAvatar persona={suggestedPersona} className="w-10 h-10 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{suggestedPersona.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{suggestionData.reason}</p>
                    </div>
                    <button 
                        onClick={handleSelect}
                        className="bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-green-700 transition-colors flex-shrink-0 shadow-sm"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        );
    };

    const formatTime = (seconds: number = 0) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const isWizardActive = useMemo(() => {
        return !!selectedPersona?.interactionScript && !messages.some(m => m.sender === 'user');
    }, [selectedPersona, messages]);


    useEffect(() => {
        if (!isSending) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isSending, suggestions]);

    const fetchMessages = useCallback(async (convoId: string, pageNum: number, currentLastVisible: any) => {
        try {
            const { messages: newMessages, lastVisible: newLastVisible } = await getMessages(convoId, pageNum, MESSAGES_PER_PAGE, currentLastVisible);
            
            if (pageNum === 0) {
                setMessages(newMessages);
            } else {
                setMessages(prev => [...newMessages, ...prev]);
            }
            
            setLastVisible(newLastVisible);
            
            if (!newMessages || newMessages.length < MESSAGES_PER_PAGE) {
                setHasMoreMessages(false);
            }
            setPage(pageNum);

        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            if (pageNum === 0) {
                setIsLoading(false);
            }
        }
    }, []);
    

    useEffect(() => {
        if (!selectedPersona || !profile) {
            setIsLoading(false);
            return;
        }

        const initialize = async () => {
            setIsLoading(true);
            setMessages([]);
            setPage(0);
            setHasMoreMessages(true);

            const convo = await getOrCreateConversation(profile.id, selectedPersona.id);
            const convoId = convo.id;
            
            if (!convoId) {
                console.error("Error getting or creating conversation");
                setIsLoading(false);
                setMessages([{
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    sender: 'system',
                    conversation_id: '',
                    user_id: profile.id,
                    message_type: 'disclaimer',
                    text_content: t('chat.info.startConversationError')
                }]);
                return;
            }

            setConversationId(convoId);

            await fetchMessages(convoId, 0, null);

            // FIX: Per Gemini API guidelines, environment variables must be accessed via process.env. This also resolves the 'import.meta.env' TypeScript error.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const languageName = getLanguageName(language);
            
            const languageInstruction = `\n\nThe user's preferred language is ${languageName}.`;

            // FIX: The type for `profile.gender` is `'male' | 'female' | null | undefined`. The check for `'prefer_not_to_say'` caused a type error.
            // Corrected to only check for 'male' or 'female'.
            const genderInstruction = (profile?.gender === 'male' || profile?.gender === 'female') ? `\n\nThe user you are speaking with has identified their gender as ${profile.gender}. You may adjust your form of address accordingly if appropriate for the language and context.` : '';
            
            const memories = await getMemories(profile.id, selectedPersona.id);
            let memoryInstruction = '';
            if (memories.length > 0) {
                const memoryFacts = memories.map(m => `- ${m.fact}`).join('\n');
                memoryInstruction = `\n\nREMEMBER THESE FACTS ABOUT THE USER (for personalization):\n${memoryFacts}`;
            }

            // Create the recommendation instruction
            const toolList = personas
                .filter(p => p.category === SuperCategory.TOOLS)
                .map(p => `- ${p.name} (ID: ${p.id}): ${p.description}`)
                .join('\n');
                
            const adviserList = personas
                // Fix: Correctly filter for 'AIdviser' personas using their role and category.
                .filter(p => p.role === PersonaRole.EXPERT_ADVISOR && p.category === SuperCategory.KWARARRU && p.id !== selectedPersona.id)
                .map(p => `- ${p.name} (ID: ${p.id}): Specializes in ${p.specialty}`)
                .join('\n');

            const recommendationInstruction = `
---
CROSS-PROMOTION INSTRUCTIONS:
You are part of a collaborative team of AI assistants. If a user's request could be better handled by a specialized tool or another AIdviser, you MUST recommend it.

To make a recommendation, embed a special command in your response using this EXACT format: [SUGGESTION:{"type":"persona" or "tool","id":"the_persona_id","reason":"A brief reason for the suggestion"}]

Example 1: "For detailed financial projections, our financial advisor would be perfect. [SUGGESTION:{\\"type\\":\\"persona\\",\\"id\\":\\"mentor-financial-advisor\\",\\"reason\\":\\"Discuss financial projections\\"}]"
Example 2: "That's a great idea for a business. We can create a structured plan for that. [SUGGESTION:{\\"type\\":\\"tool\\",\\"id\\":\\"maker-business-planner\\",\\"reason\\":\\"Create a business plan\\"}]"

Here are the available specialists:
AIdvisers:
${adviserList}

Tools:
${toolList}

Only recommend ONE specialist per response and only when it is highly relevant. Do not mention that you are a "collaborative team". Just make the recommendation naturally.
---
`;

            const systemInstruction = `${selectedPersona.systemInstruction}${languageInstruction}${genderInstruction}${memoryInstruction}${recommendationInstruction}`;

            const chatConfig = { 
                systemInstruction, 
                tools: [{googleSearch: {}}]
            };
            
            const allMessagesForHistory = await getFullHistoryForAI(convoId);
            
            const geminiHistory = allMessagesForHistory
                .filter(msg => (msg.sender === 'user' || msg.sender === 'ai'))
                .map(msg => {
                    const parts: any[] = [];
                    if (msg.text_content) parts.push({ text: msg.text_content });
                    return { role: msg.sender === 'user' ? 'user' : 'model', parts };
                }).filter(h => h.parts.length > 0);

            chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', history: geminiHistory, config: chatConfig });

            if (allMessagesForHistory.length === 0 && !selectedPersona.interactionScript) {
                setIsSending(true);
                try {
                    setSuggestions(selectedPersona.quickReplies || []);
                    const stream = await chatRef.current.sendMessageStream({ message: "Please greet me briefly and ask how you can help me today, according to your persona." });
                    let accumulatedText = '';
                    const aiMessageId = crypto.randomUUID();
                    
                    for await (const chunk of stream) {
                        accumulatedText += chunk.text;
                    }

                    const greetingMessage: ChatMessage = {
                        id: aiMessageId,
                        created_at: new Date().toISOString(),
                        sender: 'ai',
                        message_type: 'text',
                        text_content: accumulatedText,
                        conversation_id: convoId, 
                        user_id: profile.id
                    };
                    await saveMessage(greetingMessage);
                    scheduleBackup();
                    setMessages([greetingMessage]);
                } catch (error) {
                    console.error("Error sending initial greeting:", error);
                    const errorMessage: ChatMessage = {
                        id: crypto.randomUUID(),
                        sender: 'system',
                        created_at: new Date().toISOString(),
                        text_content: 'Sorry, I had trouble starting our conversation. Please try refreshing or sending a message.',
                        message_type: 'disclaimer',
                        conversation_id: convoId,
                        user_id: profile.id
                    };
                    setMessages([errorMessage]);
                } finally {
                    setIsSending(false);
                }
            }
        };

        initialize();

        return () => {
            const summarizeAndStoreMemories = async () => {
                if (!profile || !selectedPersona || !chatRef.current || messagesRef.current.length < 2) return;
        
                const recentMessages = messagesRef.current.slice(-12);
                if (recentMessages.filter(m => m.sender === 'user').length < 2) {
                    return;
                }
        
                try {
                    // FIX: Per Gemini API guidelines, environment variables must be accessed via process.env. This also resolves the 'import.meta.env' TypeScript error.
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const existingMemories = await getMemories(profile.id, selectedPersona.id);
                    const existingFacts = existingMemories.map(m => m.fact);
        
                    const conversationHistory = recentMessages
                        .map(msg => `${msg.sender === 'user' ? 'User' : 'You'}: ${msg.text_content || '(non-text message)'}`)
                        .join('\n');
          
                    const prompt = `Based on the following conversation history, extract any new, important, and lasting personal facts about the user. Focus on preferences, goals, relationships, key projects, or personal details they have shared. Do not extract trivial, temporary, or sensitive information. Here are facts we already know, do not repeat them:\n\nExisting facts:\n${existingFacts.join('\n') || 'None'}\n\nConversation to analyze:\n"""\n${conversationHistory}\n"""\n\nRespond ONLY with a JSON object.`;

                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: prompt,
                        config: {
                           responseMimeType: "application/json",
                           responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    new_facts: {
                                        type: Type.ARRAY,
                                        description: "A list of new, important, and lasting facts about the user.",
                                        items: { type: Type.STRING }
                                    }
                                }
                           },
                        },
                    });
          
                    const jsonStr = response.text.trim();
                    const result = JSON.parse(jsonStr);
                    const newFacts: string[] = result.new_facts || [];

                    if (newFacts.length > 0) {
                        console.log("Storing new memories:", newFacts);
                        for (const fact of newFacts) {
                            if (fact.trim()) { // Ensure fact is not empty
                                await addMemory(profile.id, selectedPersona.id, fact.trim());
                            }
                        }
                        scheduleBackup();
                    }
                } catch (err) {
                    console.error("Failed to summarize and store memories:", err);
                }
            };

            summarizeAndStoreMemories();
        };

    }, [selectedPersona, profile, language, getLanguageName, t, fetchMessages, scheduleBackup, personas, refreshKey]);
    
    // Effect for handling post-call follow-up
    useEffect(() => {
        if (lastCallInfo && selectedPersona && lastCallInfo.personaId === selectedPersona.id && chatRef.current && conversationId && profile && !isSending) {
            const { duration } = lastCallInfo;
            setLastCallInfo(null); // Clear it immediately to prevent re-triggering

            const generateFollowUp = async () => {
                setIsSending(true);

                // Note: The call log message is now created in App.tsx via logCall.
                // We just need to trigger the AI follow-up here.
                
                let prompt = `I just finished a voice call with the user that lasted ${duration} seconds.`;
                if (duration < 15 && duration > 0) {
                    prompt += " The call was very short, so it might have been disconnected accidentally. Please write a brief, concerned follow-up message asking if everything is okay or if they got cut off. Keep it natural and in character.";
                } else {
                    prompt += " Please write a brief, natural follow-up message to continue the conversation or provide a warm closing remark. You can reference that we just spoke. Keep it in character.";
                }

                let aiMessageId: string = '';
                try {
                    const stream = await chatRef.current!.sendMessageStream({ message: prompt });
                    let accumulatedText = '';
                    aiMessageId = crypto.randomUUID();
                    const aiPlaceholder: ChatMessage = { id: aiMessageId, sender: 'ai', created_at: new Date().toISOString(), text_content: '', message_type: 'text', conversation_id: conversationId, user_id: profile.id };
                    setMessages(prev => [...prev, aiPlaceholder]);

                    for await (const chunk of stream) {
                        accumulatedText += chunk.text;
                        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text_content: accumulatedText } : m));
                    }

                    const finalAiMessage = { ...aiPlaceholder, text_content: accumulatedText };
                    await saveMessage(finalAiMessage);
                    scheduleBackup();
                } catch (error) {
                    console.error("Error sending post-call message:", error);
                } finally {
                    setIsSending(false);
                }
            };

            // Re-fetch messages to include the new call log before generating follow-up
            if(conversationId) {
                fetchMessages(conversationId, 0, null).then(() => {
                    generateFollowUp();
                });
            }
        }
    }, [lastCallInfo, selectedPersona, conversationId, profile, isSending, setLastCallInfo, scheduleBackup, fetchMessages]);


    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input.trim();

        if (!textToSend || isSending || !chatRef.current || !conversationId || !profile) return;
        
        setInput('');
        setIsSending(true);
        setSuggestions([]);

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'user',
            created_at: new Date().toISOString(),
            conversation_id: conversationId,
            user_id: profile.id,
            message_type: 'text',
            text_content: textToSend,
            isSaving: true,
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        await saveMessage(userMessage);
        
        setMessages(prev => prev.map(m => m.id === userMessage.id ? { ...m, isSaving: false } : m));
        
        let aiMessageId: string = '';
        try {
            const stream = await chatRef.current.sendMessageStream({ message: textToSend });
            
            let accumulatedText = '';
            let groundingChunks: any[] | undefined = undefined;
            aiMessageId = crypto.randomUUID();
            const aiPlaceholder: ChatMessage = {
                id: aiMessageId, sender: 'ai', created_at: new Date().toISOString(), text_content: '', message_type: 'text', conversation_id: conversationId, user_id: profile.id
            };
            setMessages(prev => [...prev, aiPlaceholder]);
            
            for await (const chunk of stream) {
                accumulatedText += chunk.text;
                groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || groundingChunks;
                setMessages(prev => prev.map(m =>
                    m.id === aiMessageId ? { ...m, text_content: accumulatedText, metadata: { groundingChunks } } : m
                ));
            }
            
            const finalAiMessage = { ...aiPlaceholder, text_content: accumulatedText, metadata: { groundingChunks } };
            await saveMessage(finalAiMessage);
            scheduleBackup();

        } catch (error) {
            console.error("Error sending message:", error);
            const aiErrorId = crypto.randomUUID();
            const errorMessage: ChatMessage = {
                id: aiErrorId, sender: 'system', created_at: new Date().toISOString(), text_content: 'Sorry, there was an error getting a response.', message_type: 'disclaimer', conversation_id: conversationId, user_id: profile.id
            }
            setMessages(prev => [...prev.filter(m => m.id !== aiMessageId), errorMessage]);

        } finally {
            setIsSending(false);
        }
    };

    const retryMessage = (failedMessage: ChatMessage) => {
        if (!failedMessage.text_content) return;
        setMessages(prev => prev.filter(m => m.id !== failedMessage.id));
        handleSend(failedMessage.text_content);
    };
    
    
    const handleSuggestionClick = (suggestion: string) => {
        handleSend(suggestion);
    };

    const handleRefreshChat = async () => {
        if (conversationId && window.confirm('Are you sure you want to clear this conversation? This will delete all messages and cannot be undone.')) {
            try {
                setMessages([]); // Optimistically clear UI
                setIsLoading(true); // Show loading state
                await clearMessagesForConversation(conversationId);
                scheduleBackup();
                setRefreshKey(k => k + 1); // Triggers re-initialization
            } catch (error) {
                console.error("Failed to clear chat:", error);
                alert("Failed to clear conversation. Please try again.");
            }
        }
    };
    

    if (!selectedPersona) return null;
    
    const isLocked = (selectedPersona.isPremium && !isPremium) || isGeminiKeyMissing;

    return (
        <div className="h-screen w-full flex flex-col bg-gray-200 dark:bg-gray-900" style={{ backgroundImage: "url('https://www.toptal.com/designers/subtlepatterns/uploads/connect.png')", backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: theme === 'light' ? 'rgba(229, 231, 235, 0.95)' : 'rgba(17, 24, 39, 0.95)' }}>
            <header className="p-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
                 <div className="flex items-center space-x-2">
                    {isMobile && (
                        <button onClick={() => { setSelectedPersona(null); setAppState('home'); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <PersonaAvatar persona={selectedPersona} className="w-10 h-10" />
                    <div>
                        <h1 className="text-md font-bold">{selectedPersona.name}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPersona.title}</p>
                    </div>
                 </div>
                 <div className="flex items-center space-x-1">
                    <button
                        onClick={toggleScreenRecording}
                        className={`p-2 rounded-full transition-colors ${
                            isScreenRecording 
                                ? 'bg-red-100 dark:bg-red-900/50' 
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'
                        }`}
                        aria-label={isScreenRecording ? 'Stop Recording' : 'Start Screen Recording'}
                    >
                        <RecordIcon className={`w-5 h-5 transition-colors ${
                            isScreenRecording 
                                ? 'text-red-500 animate-pulse' 
                                : 'text-gray-600 dark:text-gray-400'
                        }`} />
                    </button>
                    <button onClick={handleRefreshChat} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50" aria-label="Clear Conversation"><RefreshIcon className="w-5 h-5" /></button>
                    <button onClick={startCall} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50" aria-label={t('chat.call.label')}><PhoneIcon className="w-5 h-5" /></button>
                    <button onClick={() => setAppState('profile')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/50" aria-label={t('chat.header.moreInfo')}><InfoIcon className="w-5 h-5" /></button>
                    {!isMobile && <LanguageSelector />}
                </div>
            </header>

            {isWizardActive ? (
                <div className="flex-grow flex items-center justify-center overflow-y-auto">
                    <WizardChat 
                        persona={selectedPersona}
                        onComplete={(prompt) => handleSend(prompt)}
                        isSending={isSending}
                    />
                </div>
            ) : (
                <>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {isLoading && <div className="text-center text-gray-500">Loading conversation...</div>}
                        {hasMoreMessages && !isLoading && (
                            <div className="text-center">
                                <button onClick={() => fetchMessages(conversationId!, page + 1, lastVisible)} className="text-sm text-green-600 font-semibold hover:underline">
                                    Load more messages
                                </button>
                            </div>
                        )}
                        {messages.map((msg, index) => {
                            if (msg.sender === 'system') {
                                if (msg.message_type === 'call_log') {
                                    if (msg.metadata?.callAnalysis) {
                                        return <CallAnalysisCard key={msg.id} report={msg.metadata.callAnalysis} duration={msg.call_duration_seconds} />;
                                    }
                                    return (
                                        <div key={msg.id} className="text-center text-xs text-gray-500 py-2 my-2 flex items-center justify-center space-x-2" role="log">
                                            <PhoneIcon className="w-3 h-3 flex-shrink-0" />
                                            <span>Call ended &bull; Duration: {formatTime(msg.call_duration_seconds)}</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={msg.id} className="text-center text-xs text-blue-800 dark:text-gray-400 p-2 my-2 bg-blue-100 dark:bg-gray-800/50 rounded-lg max-w-md mx-auto">
                                        {msg.text_content}
                                    </div>
                                );
                            }
                            if (msg.sender === 'user') {
                                return (
                                    <div key={msg.id} className="flex items-end gap-3 justify-end">
                                        <div className="flex flex-col items-end">
                                            <div className={`w-full max-w-md bg-emerald-100 dark:bg-green-700 rounded-l-2xl rounded-tr-2xl rounded-br-md p-3 shadow-sm transition-opacity ${msg.isSaving ? 'opacity-60' : 'opacity-100'}`}>
                                                {msg.text_content && <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{msg.text_content}</p>}
                                            </div>
                                            {msg.error && (
                                                <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1.5">
                                                    <span>{msg.error}</span>
                                                    <button onClick={() => retryMessage(msg)} className="font-semibold underline hover:text-red-600 dark:hover:text-red-300">Retry</button>
                                                </div>
                                            )}
                                        </div>
                                         <UserIcon className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-600 p-1" />
                                    </div>
                                );
                            }
                             // AI message
                            if (msg.message_type === 'document') {
                                return <DocumentMessage key={msg.id} message={msg} persona={selectedPersona} />;
                            }
                            return (
                                <div key={msg.id} className="flex items-end gap-3 justify-start">
                                    <PersonaAvatar persona={selectedPersona} className="w-8 h-8 flex-shrink-0" />
                                    <div className="w-full max-w-md bg-white dark:bg-gray-700 rounded-r-2xl rounded-tl-2xl rounded-bl-md p-3 shadow-sm">
                                         {(() => {
                                            if (isSending && index === messages.length - 1) {
                                                return <TypingTextMessage text={msg.text_content || ''} />;
                                            }
                                            
                                            const { pretext, suggestionData } = parseMessageContent(msg.text_content || '');
                                            return (
                                                <>
                                                    <div className="text-gray-900 dark:text-white">{renderPolishedMarkdown(pretext)}</div>
                                                    {suggestionData && <SuggestionCard suggestionData={suggestionData} />}
                                                </>
                                            );
                                        })()}
                                        {msg.metadata?.groundingChunks && <FoldableSources groundingChunks={msg.metadata.groundingChunks} />}
                                        {msg.error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{msg.error}</p>}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
                        <div className="p-2">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
                                <input
                                    ref={textInputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('chat.input.placeholder')}
                                    className="flex-grow bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    disabled={isSending || isLocked}
                                />
                                <button type="submit" disabled={!input.trim() || isSending || isLocked} className="bg-green-600 rounded-full p-3 disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-green-500 transition-colors">
                                    <SendIcon className="w-6 h-6 text-white" />
                                </button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatScreen;
