import React from 'react';

interface EnableAIModalProps {
  featureName: string;
  onOpenSettings: () => void;
}

const EnableAIModal: React.FC<EnableAIModalProps> = ({ featureName, onOpenSettings }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Lock Icon Decoration */}
        <div className="pt-8 pb-4 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-amber-400 dark:to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 dark:shadow-amber-500/30">
            <svg className="w-10 h-10 text-white dark:text-slate-900" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-fredoka mb-3">
            Add an API key to unlock AI features!
          </h2>

          <p className="text-slate-600 dark:text-slate-300 mb-4">
            To {featureName}, add an API key in Settings.
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            An API key lets you connect to AI services like Gemini or Claude.
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Many providers offer free tiers to get started.
          </p>

          {/* Single Action Button */}
          <button
            onClick={onOpenSettings}
            className="w-full py-4 bg-indigo-600 dark:bg-amber-500 hover:bg-indigo-700 dark:hover:bg-amber-400 text-white dark:text-slate-900 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/20 dark:shadow-amber-500/20"
          >
            Open Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnableAIModal;
