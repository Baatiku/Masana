

import React, { useState } from 'react';
import { OnboardingStep } from '../types';
import { UsersIcon, AcademicCapIcon, BriefcaseIcon } from './icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSelector';

const getOnboardingSteps = (t: (key: string) => string): OnboardingStep[] => [
  {
    title: t('onboarding.step1.title'),
    text: t('onboarding.step1.text'),
    hero: <div className="text-green-500"><UsersIcon className="w-24 h-24" /></div>
  },
  {
    title: t('onboarding.step2.title'),
    text: t('onboarding.step2.text'),
    hero: <div className="text-green-500"><AcademicCapIcon className="w-24 h-24" /></div>
  },
  {
    title: t('onboarding.step3.title'),
    text: t('onboarding.step3.text'),
    hero: <div className="text-green-500"><BriefcaseIcon className="w-24 h-24" /></div>
  }
];

interface OnboardingProps {
  onFinished: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onFinished }) => {
  const [step, setStep] = useState(0);
  const t = useTranslation();
  const onboardingSteps = getOnboardingSteps(t);
  const currentStep = onboardingSteps[step];

  const nextStep = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      onFinished();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-8 bg-white dark:bg-gray-900 relative">
       <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <div className="mb-8">{currentStep.hero}</div>
        <h2 className="text-3xl font-bold mb-4">{currentStep.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">{currentStep.text}</p>
      </div>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${index === step ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
        </div>
        <button
          onClick={nextStep}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          {step === onboardingSteps.length - 1 ? t('onboarding.start') : t('onboarding.continue')}
        </button>
        {step < onboardingSteps.length - 1 && (
           <button onClick={onFinished} className="w-full text-gray-500 py-3 px-4 rounded-lg mt-2 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
             {t('onboarding.skip')}
           </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;