import React, { useState, useEffect, useRef } from 'react';
import { Persona, ChatMessage } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface WizardChatProps {
    persona: Persona;
    onComplete: (prompt: string) => void;
    isSending: boolean;
}

const WizardChat: React.FC<WizardChatProps> = ({ persona, onComplete, isSending }) => {
    const { interactionScript } = persona;
    const t = useTranslation();
    
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [currentStep]);

    if (!interactionScript || interactionScript.length === 0) {
        return <div className="p-4 text-center text-red-500">Interaction script is missing or empty for this persona.</div>;
    }

    const currentQuestion = interactionScript[currentStep];
    const isLastStep = currentStep === interactionScript.length - 1;
    const progress = ((currentStep + 1) / interactionScript.length) * 100;
    
    // Replace placeholders like {businessName} in the current question
    const getFormattedQuestion = () => {
        let questionText = currentQuestion.question;
        Object.entries(answers).forEach(([key, value]) => {
            questionText = questionText.replace(`{${key}}`, value);
        });
        return questionText;
    };


    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newAnswers = { ...answers, [currentQuestion.key]: inputValue.trim() };
        setAnswers(newAnswers);
        setInputValue('');

        if (isLastStep) {
            // Compile the final prompt
            const finalPrompt = `Please generate a document based on the following information:\n\n` +
                interactionScript.map(scriptItem => {
                    const answer = newAnswers[scriptItem.key];
                    const question = scriptItem.question.replace(/\{(\w+)\}/g, (match, key) => newAnswers[key] || match);
                    return `${question}\nAnswer: ${answer}`;
                }).join('\n\n');
            
            onComplete(finalPrompt);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };
    
    return (
        <div className="p-4 space-y-4 max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg m-4">
            <div className="text-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{persona.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Step {currentStep + 1} of {interactionScript.length}</p>
                 <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                    <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg min-h-[6rem] flex items-center justify-center">
                <p className="text-md text-gray-800 dark:text-gray-200 text-center">{getFormattedQuestion()}</p>
            </div>

            <form onSubmit={handleNextStep}>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-300 dark:border-gray-600"
                    disabled={isSending}
                />
                <button
                    type="submit"
                    className="w-full mt-3 bg-green-600 rounded-lg py-3 text-white font-bold hover:bg-green-500 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    disabled={!inputValue.trim() || isSending}
                >
                    {isSending ? 'Generating...' : (isLastStep ? 'Generate Document' : 'Next')}
                </button>
            </form>
        </div>
    );
};

export default WizardChat;