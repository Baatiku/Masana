import React, { useState, useRef, useContext } from 'react';
import { useProfile } from '../context/ProfileContext';
import { AppContext } from '../context/AppContext';
import { CameraIcon, UserIcon, AppLogo } from '../components/icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import PersonaAvatar from '../components/PersonaAvatar';
import { Profile } from '../types';

const CompleteProfileScreen: React.FC = () => {
    const { profile, updateProfile } = useProfile();
    const { setAppState } = useContext(AppContext);
    const t = useTranslation();

    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [gender, setGender] = useState<Profile['gender']>(profile?.gender || 'male');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setAppState('home');
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const genderOptions = [
        { value: 'male', label: t('myProfile.gender.male') },
        { value: 'female', label: t('myProfile.gender.female') }
    ] as {value: Profile['gender'], label: string}[];


    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full text-center">
                <AppLogo className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('completeProfile.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{t('completeProfile.description')}</p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="relative w-32 h-32 mx-auto">
                         <PersonaAvatar persona={{name: fullName, avatarUrl: avatarPreview}} className="w-32 h-32" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition-colors"
                            aria-label={t('completeProfile.uploadAvatar')}
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarChange}
                            accept="image/png, image/jpeg"
                            className="hidden"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="fullName" className="sr-only">{t('myProfile.fullName')}</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder={t('completeProfile.fullNamePlaceholder')}
                            required
                            className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <div>
                        <label className="text-left block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('myProfile.gender')}</label>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-200 dark:bg-gray-800 p-1">
                           {genderOptions.map(option => (
                                <button
                                    type="button"
                                    key={option.value || 'male'}
                                    onClick={() => setGender(option.value)}
                                    className={`w-full px-2 py-2 text-sm font-semibold rounded-md transition-colors ${
                                        gender === option.value
                                            ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                        {loading ? t('myProfile.updating') : t('completeProfile.continue')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfileScreen;