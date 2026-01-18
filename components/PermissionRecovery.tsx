import React from 'react';

type BrowserType = 'chrome' | 'edge' | 'unknown';

/**
 * Detects browser type for permission reset instructions.
 * Edge UA includes "Chrome" so must check Edg/ first.
 */
const detectBrowser = (): BrowserType => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Chrome/') && !ua.includes('Chromium/')) return 'chrome';
  return 'unknown';
};

const browserInstructions: Record<BrowserType, { name: string; steps: string[] }> = {
  chrome: {
    name: 'Chrome',
    steps: [
      'Click the lock icon (or tune icon) in the address bar',
      'Select "Site settings"',
      'Find "Window management" under Permissions',
      'Change from "Block" to "Ask" or "Allow"',
      'Refresh this page'
    ]
  },
  edge: {
    name: 'Edge',
    steps: [
      'Click the lock icon in the address bar',
      'Select "Permissions for this site"',
      'Find "Window management"',
      'Change from "Block" to "Ask" or "Allow"',
      'Refresh this page'
    ]
  },
  unknown: {
    name: 'your browser',
    steps: [
      'Open your browser settings',
      'Find Site permissions or Site settings',
      'Look for Window management',
      'Reset or allow permission for this site',
      'Refresh this page'
    ]
  }
};

interface PermissionRecoveryProps {
  onClose: () => void;
}

/**
 * Modal showing browser-specific instructions to reset window management permission.
 * Displayed when teacher clicks "Learn how" link after permission was denied.
 */
const PermissionRecovery: React.FC<PermissionRecoveryProps> = ({ onClose }) => {
  const browser = detectBrowser();
  const instructions = browserInstructions[browser];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-poppins">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">
                Reset Permission
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                for {instructions.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            To enable auto-placement on your projector:
          </p>
          <ol className="space-y-2">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <span className="text-slate-700 dark:text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Manual dragging still works if you prefer
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionRecovery;
