import React, { useState, useRef, useContext } from 'react';
import { useProfile } from '../context/ProfileContext';
import { AppContext } from '../context/AppContext';
import { CameraIcon, PencilIcon, UserIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import PersonaAvatar from '../components/PersonaAvatar';
import { Profile } from '../types';


const MyProfileScreen: React.FC = () => {
    const { profile, updateProfile } = useProfile();
    const { setAppState } = useContext(AppContext);
    const t = useTranslation();
    const isMobile = useIsMobile();

    const [editMode, setEditMode] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [gender, setGender] = useState<Profile['gender']>(profile?.gender || null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBack = () => {
        setAppState('settings');
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('File is too large. Please select an image under 2MB.');
                return;
            }
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCancelEdit = () => {
        setFullName(profile?.full_name || '');
        setGender(profile?.gender || null);
        setAvatarPreview(profile?.avatar_url || null);
        setError('');
        setEditMode(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setError(t('myProfile.error.nameRequired'));
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await updateProfile({
                full_name: fullName,
                avatar_url: avatarPreview || '',
                gender: gender,
            });
            setEditMode(false);
        } catch (err: any) {
            setError(err.message || "Failed to save profile.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getGenderDisplay = (genderValue: Profile['gender']) => {
        if (genderValue === 'male' || genderValue === 'female') {
            const key = `myProfile.gender.${genderValue}`;
            const translated = t(key);
            return translated === key ? genderValue.charAt(0).toUpperCase() + genderValue.slice(1) : translated;
        }
        return 'Not Specified'; // A sensible fallback
    };

    const genderOptions = [
        { value: 'male', label: t('myProfile.gender.male') },
        { value: 'female', label: t('myProfile.gender.female') }
    ] as {value: Profile['gender'], label: string}[];

    if (!profile) return null;

    return (
        <div className={`h-full w-full flex flex-col ${isMobile ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <header className={`p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
                <div className="flex items-center">
                    <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobile ? "M15 19l-7-7 7-7" : "M10 19l-7-7m0 0l7-7m-7 7h18"} /></svg>
                    </button>
                    <h1 className="text-xl font-bold">{t('myProfile.title')}</h1>
                </div>
                {!editMode && (
                    <button onClick={() => setEditMode(true)} className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                        <span>{t('myProfile.edit')}</span>
                    </button>
                )}
            </header>

            <div className="flex-grow overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-36 h-36">
                            <PersonaAvatar persona={{name: fullName, avatarUrl: avatarPreview}} className="w-36 h-36" />
                            {editMode && (
                                <>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-white flex flex-col items-center"
                                            aria-label={t('myProfile.uploadAvatar')}
                                        >
                                            <CameraIcon className="w-8 h-8" />
                                            <span className="text-xs mt-1">Change</span>
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg" className="hidden" />
                                </>
                            )}
                        </div>
                        
                        {!editMode ? (
                            <div className="text-center">
                                <h2 className="text-3xl font-bold">{profile.full_name || 'Valued User'}</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">{getGenderDisplay(profile.gender)}</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-6">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('myProfile.fullName')}</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('myProfile.gender')}</label>
                                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 p-1">
                                        {genderOptions.map(option => (
                                            <button
                                                type="button"
                                                key={option.value || 'male'}
                                                onClick={() => setGender(option.value)}
                                                className={`w-full px-2 py-2 text-sm font-semibold rounded-md transition-colors ${
                                                    (gender || 'male') === option.value
                                                        ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow'
                                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    {editMode && (
                        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button type="button" onClick={handleCancelEdit} className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                {t('myProfile.cancel')}
                            </button>
                            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                                {loading ? t('myProfile.updating') : t('myProfile.save')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default MyProfileScreen;