import { openDB, IDBPDatabase } from 'idb';
import { CallRecording, Profile, Conversation, ChatMessage, Persona, Memory, SpeechAnalysisReport, VoiceSettings } from '../types';
import { personas as localPersonas } from '../data/personas';

const DB_NAME = 'KwararruDB';
const DB_VERSION = 5; // Incremented version for new schema

const STORES = {
    CALL_RECORDINGS: 'call_recordings',
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    MEMORIES: 'memories',
    VOICE_SETTINGS: 'voice_settings',
    FAVORITES: 'favorites',
};

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const initDB = (): Promise<IDBPDatabase<any>> => {
  if (dbPromise) return dbPromise;
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.CALL_RECORDINGS)) {
        db.createObjectStore(STORES.CALL_RECORDINGS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
        const store = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' });
        store.createIndex('by-user-persona', ['user_id', 'persona_id'], { unique: true });
        store.createIndex('by-user-id', 'user_id');
      }
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const store = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        store.createIndex('by-conversation-id', 'conversation_id');
      }
       if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
        const store = db.createObjectStore(STORES.MEMORIES, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-user-persona', ['user_id', 'persona_id']);
      }
      if (!db.objectStoreNames.contains(STORES.VOICE_SETTINGS)) {
        const store = db.createObjectStore(STORES.VOICE_SETTINGS, { keyPath: ['userId', 'personaId'] });
        store.createIndex('by-user-id', 'userId');
      }
      if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
        db.createObjectStore(STORES.FAVORITES, { keyPath: ['userId', 'personaId'] });
      }
    },
  });
  return dbPromise;
};

// --- Call Recordings (IndexedDB) ---

export const addRecording = async (recording: Omit<CallRecording, 'id'>): Promise<number> => {
  const db = await initDB();
  return db.add(STORES.CALL_RECORDINGS, recording);
};

export const getAllRecordings = async (): Promise<CallRecording[]> => {
  const db = await initDB();
  const recordings = await db.getAll(STORES.CALL_RECORDINGS);
  return recordings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const deleteRecording = async (id: number): Promise<void> => {
  const db = await initDB();
  return db.delete(STORES.CALL_RECORDINGS, id);
};

// --- Voice Settings ---

export const saveVoiceSetting = async (userId: string, personaId: string, settings: VoiceSettings): Promise<void> => {
    const db = await initDB();
    await db.put(STORES.VOICE_SETTINGS, { userId, personaId, ...settings });
};

export const getAllVoiceSettingsForUser = async (userId: string): Promise<Record<string, VoiceSettings>> => {
    const db = await initDB();
    if (!userId) return {};
    const allSettings = await db.getAllFromIndex(STORES.VOICE_SETTINGS, 'by-user-id', userId);
    const settingsMap: Record<string, VoiceSettings> = {};
    for (const setting of allSettings) {
        settingsMap[setting.personaId] = setting;
    }
    return settingsMap;
};

// --- Favorites ---

export const addFavorite = async (userId: string, personaId: string): Promise<void> => {
    const db = await initDB();
    await db.put(STORES.FAVORITES, { userId, personaId });
};

export const removeFavorite = async (userId: string, personaId: string): Promise<void> => {
    const db = await initDB();
    await db.delete(STORES.FAVORITES, [userId, personaId]);
};

export const getFavoritePersonaIds = async (userId: string): Promise<string[]> => {
    const db = await initDB();
    if (!userId) return [];
    const allFavorites = await db.getAll(STORES.FAVORITES);
    return allFavorites
        .filter(fav => fav.userId === userId)
        .map(fav => fav.personaId);
};


// --- Persona functions ---
export const getPersonas = async (): Promise<Persona[]> => {
    return Promise.resolve(localPersonas);
};

// --- Conversation & Message functions (IndexedDB) ---
export const getOrCreateConversation = async (userId: string, personaId: string): Promise<Conversation> => {
    const db = await initDB();
    const existingConvo = await db.getFromIndex(STORES.CONVERSATIONS, 'by-user-persona', [userId, personaId]);

    if (existingConvo) {
        return { ...existingConvo, persona: localPersonas.find(p => p.id === existingConvo.persona_id) };
    }

    const newConvo: Conversation = {
        id: crypto.randomUUID(),
        user_id: userId,
        persona_id: personaId,
        last_message_snippet: null,
        last_message_timestamp: new Date().toISOString(),
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    await db.add(STORES.CONVERSATIONS, newConvo);
    return { ...newConvo, persona: localPersonas.find(p => p.id === newConvo.persona_id) };
};

export const saveMessage = async (message: ChatMessage): Promise<string> => {
    const db = await initDB();
    await db.add(STORES.MESSAGES, message);
    
    // Update conversation metadata
    let snippet = message.text_content;
    if (!snippet || snippet.trim() === '') {
        if (message.message_type === 'call_log') {
            snippet = message.metadata?.callAnalysis 
                ? 'Call Performance Report' 
                : 'Call completed.';
        }
        else if (message.message_type === 'document') snippet = `Document: ${message.metadata?.title || 'Untitled'}`;
        else if (message.image_url) snippet = 'Image attachment';
        else snippet = '...';
    }

    const conversation = await db.get(STORES.CONVERSATIONS, message.conversation_id);
    if (conversation) {
        conversation.last_message_snippet = snippet.substring(0, 100);
        conversation.last_message_timestamp = message.created_at;
        conversation.updated_at = new Date().toISOString();
        await db.put(STORES.CONVERSATIONS, conversation);
    }
    return message.id;
};

export const getMessages = async (conversationId: string, page: number, messagesLimit: number, lastVisible?: string): Promise<{ messages: ChatMessage[], lastVisible?: string }> => {
    const db = await initDB();
    const allMessages = await db.getAllFromIndex(STORES.MESSAGES, 'by-conversation-id', conversationId);
    allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Simple pagination for local data
    const startIndex = page * messagesLimit;
    const endIndex = startIndex + messagesLimit;
    const messages = allMessages.slice(startIndex, endIndex).reverse();

    return { messages };
};

export const getFullHistoryForAI = async (conversationId: string): Promise<ChatMessage[]> => {
    const db = await initDB();
    const messages = await db.getAllFromIndex(STORES.MESSAGES, 'by-conversation-id', conversationId);
    return messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const getAllConversations = async (userId: string): Promise<Conversation[]> => {
    const db = await initDB();
    const convos = await db.getAllFromIndex(STORES.CONVERSATIONS, 'by-user-id', userId);

    const conversationsWithPersonas = convos.map(convo => ({
        ...convo,
        persona: localPersonas.find(p => p.id === convo.persona_id)
    }));
    
    return conversationsWithPersonas.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.last_message_timestamp).getTime() - new Date(a.last_message_timestamp).getTime();
    });
};

export const deleteConversation = async (conversationId: string): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction([STORES.CONVERSATIONS, STORES.MESSAGES], 'readwrite');
    const messages = await tx.objectStore(STORES.MESSAGES).index('by-conversation-id').getAllKeys(conversationId);
    await Promise.all(messages.map(key => tx.objectStore(STORES.MESSAGES).delete(key)));
    await tx.objectStore(STORES.CONVERSATIONS).delete(conversationId);
    await tx.done;
};

export const clearMessagesForConversation = async (conversationId: string): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction([STORES.MESSAGES, STORES.CONVERSATIONS], 'readwrite');
    
    // Delete messages
    const messageStore = tx.objectStore(STORES.MESSAGES);
    const messageKeys = await messageStore.index('by-conversation-id').getAllKeys(conversationId);
    await Promise.all(messageKeys.map(key => messageStore.delete(key)));

    // Reset conversation metadata
    const convoStore = tx.objectStore(STORES.CONVERSATIONS);
    const conversation = await convoStore.get(conversationId);
    if (conversation) {
        conversation.last_message_snippet = null;
        conversation.last_message_timestamp = new Date().toISOString();
        conversation.updated_at = new Date().toISOString();
        await convoStore.put(conversation);
    }
    
    await tx.done;
};

export const updateConversation = async(conversation: Conversation): Promise<string> => {
    const db = await initDB();
    const { persona, ...convoToSave } = conversation;
    convoToSave.updated_at = new Date().toISOString();
    await db.put(STORES.CONVERSATIONS, convoToSave);
    return conversation.id;
};

// Call Logging Function
export const logCall = async (userId: string, personaId: string, duration: number, analysisData?: SpeechAnalysisReport) => {
    const convo = await getOrCreateConversation(userId, personaId);
    if (convo) {
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            user_id: userId,
            conversation_id: convo.id,
            sender: 'system',
            message_type: 'call_log',
            call_duration_seconds: duration,
            text_content: analysisData ? 'Call performance report' : 'Call completed.',
            metadata: analysisData ? { callAnalysis: analysisData } : undefined
        };
        await saveMessage(message);
    }
};

// --- Memory Functions ---

export const addMemory = async (userId: string, personaId: string, fact: string): Promise<number> => {
    const db = await initDB();
    const memory: Omit<Memory, 'id'> = {
      user_id: userId,
      persona_id: personaId,
      fact: fact,
      created_at: new Date().toISOString(),
    };
    return db.add(STORES.MEMORIES, memory);
};

export const getMemories = async (userId: string, personaId: string): Promise<Memory[]> => {
    const db = await initDB();
    return db.getAllFromIndex(STORES.MEMORIES, 'by-user-persona', [userId, personaId]);
};

export const getAllMemoriesForUser = async (userId: string): Promise<Memory[]> => {
    const db = await initDB();
    const allMemories = await db.getAll(STORES.MEMORIES);
    return allMemories.filter(mem => mem.user_id === userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const deleteMemory = async (id: number): Promise<void> => {
    const db = await initDB();
    return db.delete(STORES.MEMORIES, id);
};

export const deleteAllMemoriesForUser = async (userId: string): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORES.MEMORIES, 'readwrite');
    const store = tx.objectStore(STORES.MEMORIES);
    const allMemories = await store.getAll();
    const userMemoryKeys = allMemories.filter(mem => mem.user_id === userId).map(mem => mem.id!);
    await Promise.all(userMemoryKeys.map(key => store.delete(key)));
    await tx.done;
};


// --- Backup and Restore ---
export const exportAllData = async (): Promise<string> => {
    const db = await initDB();
    const profile = localStorage.getItem('kwararru-local-profile');

    const tx = db.transaction(Object.values(STORES), 'readonly');
    const callRecordings = await tx.objectStore(STORES.CALL_RECORDINGS).getAll();
    const conversations = await tx.objectStore(STORES.CONVERSATIONS).getAll();
    const messages = await tx.objectStore(STORES.MESSAGES).getAll();
    const memories = await tx.objectStore(STORES.MEMORIES).getAll();
    const favorites = await tx.objectStore(STORES.FAVORITES).getAll();
    await tx.done;

    // Convert blobs to base64 for JSON serialization
    const serializableRecordings = await Promise.all(
        callRecordings.map(async (rec: CallRecording) => {
            if (rec.audioBlob instanceof Blob) {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(rec.audioBlob);
                });
                return { ...rec, audioBlob: base64 };
            }
            return rec;
        })
    );

    const backupData = {
        profile: profile ? JSON.parse(profile) : null,
        callRecordings: serializableRecordings,
        conversations,
        messages,
        voiceSettings: [], // Legacy, return empty
        memories,
        favorites,
    };

    return JSON.stringify(backupData);
};

export const importAllData = async (jsonString: string): Promise<void> => {
    const data = JSON.parse(jsonString);
    const db = await initDB();

    // Clear existing data
    const clearTx = db.transaction(Object.values(STORES), 'readwrite');
    await Promise.all(Object.values(STORES).map(storeName =>
        clearTx.objectStore(storeName).clear()
    ));
    await clearTx.done;
    localStorage.removeItem('kwararru-local-profile');

    // Import new data
    if (data.profile) {
        localStorage.setItem('kwararru-local-profile', JSON.stringify(data.profile));
    }

    const importTx = db.transaction(Object.values(STORES), 'readwrite');
    
    // Convert base64 back to blobs
    if (data.callRecordings) {
        const recordingsWithBlobs = await Promise.all(
            data.callRecordings.map(async (rec: any) => {
                if (typeof rec.audioBlob === 'string' && rec.audioBlob.startsWith('data:')) {
                    const blob = await (await fetch(rec.audioBlob)).blob();
                    return { ...rec, audioBlob: blob };
                }
                return rec;
            })
        );
        await Promise.all(recordingsWithBlobs.map((item: any) => importTx.objectStore(STORES.CALL_RECORDINGS).put(item)));
    }
    
    if (data.conversations) {
        await Promise.all(data.conversations.map((item: any) => importTx.objectStore(STORES.CONVERSATIONS).put(item)));
    }
    if (data.messages) {
        await Promise.all(data.messages.map((item: any) => importTx.objectStore(STORES.MESSAGES).put(item)));
    }
    if (data.memories) {
        await Promise.all(data.memories.map((item: any) => importTx.objectStore(STORES.MEMORIES).put(item)));
    }
    if (data.favorites) {
        await Promise.all(data.favorites.map((item: any) => importTx.objectStore(STORES.FAVORITES).put(item)));
    }
    await importTx.done;
};