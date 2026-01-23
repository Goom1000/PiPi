import React from 'react';

interface GameOutcomeProps {
  result: 'caught' | 'home-safe';
  onClose: () => void;
}

const GameOutcome: React.FC<GameOutcomeProps> = ({ result, onClose }) => {
  const isVictory = result === 'home-safe';

  return (
    <div className={`w-full h-full flex items-center justify-center relative
      ${isVictory
        ? 'bg-gradient-to-br from-green-900 via-green-800 to-green-900'
        : 'bg-gradient-to-br from-red-900 via-red-800 to-red-900'
      } animate-fade-in`}>

      {/* Celebration/Defeat Card */}
      <div className="text-center relative z-10">
        {/* Icon */}
        <div className={`text-9xl mb-6 ${isVictory ? 'animate-bounce' : 'animate-pulse'}`}>
          {isVictory ? '🏠' : '😈'}
        </div>

        {/* Outcome Title */}
        <h1 className={`text-6xl font-black uppercase tracking-wider mb-4
          ${isVictory ? 'text-green-200' : 'text-red-200'}`}>
          {isVictory ? 'Home Safe!' : 'Caught!'}
        </h1>

        {/* Message */}
        <p className={`text-2xl mb-8
          ${isVictory ? 'text-green-300' : 'text-red-300'}`}>
          {isVictory
            ? 'You outran the Chaser and made it home!'
            : 'The Chaser caught you on the board!'
          }
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`
            px-8 py-4 text-xl font-bold rounded-xl
            transition-all duration-200 hover:scale-105
            ${isVictory
              ? 'bg-white text-green-900 hover:bg-green-100'
              : 'bg-white text-red-900 hover:bg-red-100'
            }
          `}
        >
          Back to Lesson
        </button>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.05) 10px,
              rgba(255, 255, 255, 0.05) 20px
            )`
          }}
        />
      </div>
    </div>
  );
};

export default GameOutcome;
