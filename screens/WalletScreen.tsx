
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { WalletIcon, PhoneIcon, CrownIcon, ArrowUpIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/LanguageContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { personas } from '../data/personas/index';
import LanguageSelector from '../components/LanguageSelector';

const WalletScreen: React.FC = () => {
  const { setAppState, tokenBalance } = useContext(AppContext);
  const t = useTranslation();
  const isMobile = useIsMobile();

  const handleBack = () => {
    setAppState('home');
  };

  const mockTransactions = [
    { id: 1, type: 'spend', icon: <PhoneIcon className="w-5 h-5 text-red-500" />, description: t('wallet.transactions.mock1.description', { personaName: personas[0].name }), amount: t('wallet.transactions.mock1.amount') },
    { id: 2, type: 'spend', icon: <CrownIcon className="w-5 h-5 text-red-500" />, description: t('wallet.transactions.mock2.description'), amount: t('wallet.transactions.mock2.amount') },
    { id: 3, type: 'earn', icon: <ArrowUpIcon className="w-5 h-5 text-green-500" />, description: t('wallet.transactions.mock3.description'), amount: t('wallet.transactions.mock3.amount') },
  ];

  return (
    <div className={`h-full w-full flex flex-col ${isMobile ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}>
      <header className={`p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 ${!isMobile ? 'h-[73px]' : ''}`}>
        <div className="flex items-center">
            <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobile ? "M15 19l-7-7 7-7" : "M10 19l-7-7m0 0l7-7m-7 7h18"} /></svg>
            </button>
            <h1 className="text-xl font-bold">{t('wallet.title')}</h1>
        </div>
        {isMobile && <LanguageSelector />}
      </header>

      <div className="flex-grow overflow-y-auto p-6">
        {/* Balance Section */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 text-white text-center mb-8 shadow-lg">
          <p className="text-sm opacity-80 mb-2">{t('wallet.balance')}</p>
          <div className="flex items-center justify-center space-x-2">
            <WalletIcon className="w-8 h-8" />
            <h2 className="text-4xl font-bold tracking-tight">{t('wallet.tokens', { tokenCount: tokenBalance.toLocaleString() })}</h2>
          </div>
          <button className="mt-6 w-full bg-white/20 font-bold py-3 px-4 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm">
            {t('wallet.buyButton')}
          </button>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 mb-3">{t('wallet.transactions.title')}</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md">
            {mockTransactions.map((tx, index) => (
              <div key={tx.id} className={`flex items-center justify-between p-3 transition-colors ${index < mockTransactions.length - 1 ? 'border-b border-gray-100 dark:border-gray-900/50' : ''}`}>
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">{tx.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">May 24, 2024</p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === 'spend' ? 'text-red-500' : 'text-green-500'}`}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletScreen;