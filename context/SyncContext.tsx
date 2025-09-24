import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { exportAllData, importAllData } from '../services/db';

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const BACKUP_FILENAME = 'kwararru_backup.json';

interface SyncContextType {
    isEnabled: boolean;
    isInitializing: boolean;
    isSignedIn: boolean;
    isSyncing: boolean;
    lastSyncTime: number | null;
    hasRestored: boolean;
    syncError: string | null;
    signIn: () => void;
    signOut: () => void;
    backupData: () => Promise<void>;
    restoreData: () => Promise<void>;
    scheduleBackup: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

declare global {
  interface Window {
    gapi: any;
  }
}

export const SyncProvider: React.FC<{ children: ReactNode; apiKey?: string; clientId?: string, isEnabled: boolean; }> = ({ children, apiKey, clientId, isEnabled }) => {
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => {
        const storedTime = localStorage.getItem('kwararru-last-sync');
        return storedTime ? parseInt(storedTime, 10) : null;
    });
    const [syncError, setSyncError] = useState<string | null>(null);
    const [hasRestored, setHasRestored] = useState(false);
    const backupTimeoutRef = useRef<number | null>(null);


    const updateAuthStatus = useCallback((signedIn: boolean) => {
        setIsSignedIn(signedIn);
        setIsInitializing(false);
    }, []);

    useEffect(() => {
        if (!isEnabled) {
            setIsInitializing(false);
            return;
        }

        const initClient = () => {
            window.gapi.client.init({
                apiKey: apiKey,
                clientId: clientId,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES,
            }).then(() => {
                const authInstance = window.gapi.auth2.getAuthInstance();
                authInstance.isSignedIn.listen(updateAuthStatus);
                updateAuthStatus(authInstance.isSignedIn.get());
            }).catch((error: any) => {
                console.error("Error initializing Google API client:", error);
                setSyncError("Failed to initialize sync service.");
                setIsInitializing(false);
            });
        };
        window.gapi.load('client:auth2', initClient);
    }, [apiKey, clientId, updateAuthStatus, isEnabled]);

    const signIn = () => {
        if (window.gapi) {
            window.gapi.auth2.getAuthInstance().signIn();
        }
    };

    const signOut = () => {
        if (window.gapi) {
            window.gapi.auth2.getAuthInstance().signOut();
        }
    };
    
    const getFileId = async (): Promise<string | null> => {
        const response = await window.gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            pageSize: 10
        });
        const file = response.result.files.find((f: any) => f.name === BACKUP_FILENAME);
        return file ? file.id : null;
    };

    const backupData = useCallback(async () => {
        if (!isSignedIn || isSyncing) return;
        
        setIsSyncing(true);
        setSyncError(null);
        try {
            const fileId = await getFileId();
            const dataToBackup = await exportAllData();
            
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            
            const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
            
            const multipartRequestBody =
              delimiter +
              'Content-Type: application/json\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              'Content-Type: application/json\r\n\r\n' +
              dataToBackup +
              close_delim;

            const request = window.gapi.client.request({
                path: `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
                method: fileId ? 'PATCH' : 'POST',
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                body: multipartRequestBody
            });
            
            await request;
            
            const now = Date.now();
            setLastSyncTime(now);
            localStorage.setItem('kwararru-last-sync', now.toString());

        } catch (error: any) {
            console.error("Backup failed:", error);
            setSyncError("Backup failed. Please try again.");
        } finally {
            setIsSyncing(false);
        }
    }, [isSignedIn, isSyncing]);
    
    const scheduleBackup = useCallback(() => {
        if (backupTimeoutRef.current) {
            clearTimeout(backupTimeoutRef.current);
        }
        backupTimeoutRef.current = window.setTimeout(() => {
            backupData();
        }, 5000); // Debounce for 5 seconds
    }, [backupData]);

    const restoreData = useCallback(async () => {
        if (!isSignedIn || isSyncing) return;

        setIsSyncing(true);
        setSyncError(null);
        setHasRestored(true); // Mark that we've attempted a restore
        try {
            const fileId = await getFileId();
            if (!fileId) {
                console.log("No backup file found to restore.");
                return;
            }
            
            const response = await window.gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            await importAllData(response.body);
            
            alert("Data restored successfully! The app will now reload.");
            window.location.reload();

        } catch (error: any) {
            console.error("Restore failed:", error);
            setSyncError("Failed to restore data.");
        } finally {
            setIsSyncing(false);
        }
    }, [isSignedIn, isSyncing]);

    const value = {
        isEnabled,
        isInitializing,
        isSignedIn,
        isSyncing,
        lastSyncTime,
        hasRestored,
        syncError,
        signIn,
        signOut,
        backupData,
        restoreData,
        scheduleBackup,
    };

    return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};