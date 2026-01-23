import React from 'react';

interface DualTimerDisplayProps {
  contestantTime: number;
  chaserTime: number;
  activePlayer: 'contestant' | 'chaser';
}

const DualTimerDisplay: React.FC<DualTimerDisplayProps> = ({
  contestantTime,
  chaserTime,
  activePlayer
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = (time: number) => time <= 10;

  const getTimerClasses = (time: number, isActive: boolean, isContestant: boolean) => {
    const base = "flex-1 p-6 md:p-8 rounded-3xl transition-all duration-300";
    const bgColor = isContestant ? 'bg-blue-900/60' : 'bg-red-900/60';
    const urgent = isUrgent(time) ? 'animate-pulse' : '';
    const active = isActive
      ? 'ring-4 ring-yellow-400 scale-105 shadow-xl shadow-yellow-500/20'
      : 'opacity-50 scale-95';

    return `${base} ${bgColor} ${urgent} ${active}`;
  };

  return (
    <div className="flex gap-4 md:gap-6 w-full max-w-4xl mx-auto mb-6">
      {/* Contestant Timer - Left */}
      <div className={getTimerClasses(contestantTime, activePlayer === 'contestant', true)}>
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider text-blue-300 mb-2">
            Contestant
          </div>
          <div className={`text-5xl md:text-7xl font-black ${
            isUrgent(contestantTime) ? 'text-red-500' : 'text-white'
          }`}>
            {formatTime(contestantTime)}
          </div>
          {activePlayer === 'contestant' && (
            <div className="mt-3 text-sm font-bold text-yellow-400 animate-bounce">
              YOUR TURN
            </div>
          )}
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center px-2">
        <div className="text-3xl md:text-4xl font-black text-slate-500">VS</div>
      </div>

      {/* Chaser Timer - Right */}
      <div className={getTimerClasses(chaserTime, activePlayer === 'chaser', false)}>
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider text-red-300 mb-2">
            Chaser
          </div>
          <div className={`text-5xl md:text-7xl font-black ${
            isUrgent(chaserTime) ? 'text-red-500' : 'text-white'
          }`}>
            {formatTime(chaserTime)}
          </div>
          {activePlayer === 'chaser' && (
            <div className="mt-3 text-sm font-bold text-red-400 animate-bounce">
              CHASER'S TURN
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DualTimerDisplay;
