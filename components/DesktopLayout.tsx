// Fix: Corrected component import and added 'myProfile' state handling.
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationPlaceholder from './ConversationPlaceholder';
import SideBar from './SideBar';
import SettingsScreen from '../screens/SettingsScreen';
import WalletScreen from '../screens/WalletScreen';
import { PersonaProfileScreen } from '../screens/PersonaDetailScreen';
import ActiveCallScreen from '../screens/ActiveCallScreen';
import LearnScreen from '../screens/LearnScreen';
import ToolsScreen from '../screens/tools/ToolsScreen';
import CallHistoryScreen from '../screens/CallHistoryScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';
import MemoryScreen from '../screens/MemoryScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import NigeriaScreen from '../screens/NigeriaScreen';

const DesktopLayout: React.FC = () => {
    const { selectedPersona, appState } = useContext(AppContext);

    const renderMainContent = () => {
        switch (appState) {
            case 'settings':
                return <SettingsScreen />;
            case 'myProfile':
                return <MyProfileScreen />;
            case 'wallet':
                return <WalletScreen />;
            case 'callHistory':
                return <CallHistoryScreen />;
            case 'chatHistory':
                return <ChatHistoryScreen />;
            case 'memory':
                return <MemoryScreen />;
            case 'profile':
                return <PersonaProfileScreen />;
            case 'call':
                return <ActiveCallScreen />;
            default:
                // For 'home', 'chat', 'favorites' etc.
                // When a persona is selected, show chat. Otherwise, placeholder.
                // This implicitly handles the 'home' state correctly for the main panel.
                return selectedPersona ? <ChatScreen /> : <ConversationPlaceholder />;
        }
    };

    const renderListPanel = () => {
        switch (appState) {
            case 'favorites':
                return <FavoritesScreen />;
            case 'makaranta':
                return <LearnScreen />;
            case 'nigeria':
                return <NigeriaScreen />;
            case 'tools':
                return <ToolsScreen />;
            default:
                return <HomeScreen />;
        }
    }

    return (
        <div className="flex h-screen w-full">
            <SideBar />
            <div className="w-[35%] max-w-[500px] min-w-[350px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
                {renderListPanel()}
            </div>
            <div className="flex-grow bg-gray-100 dark:bg-gray-900">
                {renderMainContent()}
            </div>
        </div>
    );
};

export default DesktopLayout;