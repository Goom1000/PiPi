import React, { useEffect } from 'react';

interface SafeHavenCelebrationProps {
  amount: number;
  onComplete: () => void;
}

const SafeHavenCelebration: React.FC<SafeHavenCelebrationProps> = ({ amount, onComplete }) => {
  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500 animate-safe-haven cursor-pointer"
      onClick={onComplete}
    >
      <div className="text-center space-y-6 animate-fade-in">
        <div className="text-8xl animate-bounce">🛟</div>
        <h2 className="text-7xl font-black text-white drop-shadow-lg animate-pulse">
          SAFE HAVEN REACHED!
        </h2>
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl px-12 py-8 border-4 border-white/40">
          <p className="text-9xl font-black text-white drop-shadow-2xl">
            ${amount.toLocaleString()}
          </p>
        </div>
        <p className="text-4xl font-bold text-amber-950">
          You've secured ${amount.toLocaleString()}!
        </p>
        <p className="text-xl text-amber-900 opacity-75 animate-pulse">
          Click to continue
        </p>
      </div>
    </div>
  );
};

export default SafeHavenCelebration;
