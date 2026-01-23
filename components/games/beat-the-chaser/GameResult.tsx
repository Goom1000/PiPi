import React from 'react';

interface GameResultProps {
  winner: 'contestant' | 'chaser';
  contestantFinalTime: number;
  chaserFinalTime: number;
  onClose: () => void;
}

const GameResult: React.FC<GameResultProps> = ({
  winner,
  contestantFinalTime,
  chaserFinalTime,
  onClose
}) => {
  const contestantWon = winner === 'contestant';

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-8 font-poppins text-white ${
      contestantWon
        ? 'bg-gradient-to-br from-green-900 via-slate-900 to-green-900'
        : 'bg-gradient-to-br from-red-900 via-slate-900 to-red-900'
    }`}>
      {/* Result Banner */}
      <div className="text-center mb-12">
        <h1 className={`text-7xl md:text-9xl font-black mb-4 ${
          contestantWon ? 'text-green-400' : 'text-red-400'
        }`}>
          {contestantWon ? 'VICTORY!' : 'DEFEATED!'}
        </h1>
        <p className="text-2xl md:text-3xl text-white">
          {contestantWon
            ? "You beat the chaser!"
            : "The chaser caught you!"
          }
        </p>
      </div>

      {/* Final Times */}
      <div className="flex gap-8 md:gap-16 mb-12">
        <div className={`text-center p-8 rounded-2xl ${
          contestantWon ? 'bg-blue-900/50 border-2 border-blue-500' : 'bg-slate-800/50'
        }`}>
          <div className={`text-6xl md:text-8xl font-bold ${
            contestantWon ? 'text-blue-400' : 'text-slate-400'
          } mb-2`}>
            {contestantFinalTime}s
          </div>
          <div className="text-slate-300 uppercase tracking-wider">Contestant</div>
        </div>

        <div className="flex items-center">
          <div className="text-4xl md:text-6xl font-bold text-slate-500">vs</div>
        </div>

        <div className={`text-center p-8 rounded-2xl ${
          !contestantWon ? 'bg-red-900/50 border-2 border-red-500' : 'bg-slate-800/50'
        }`}>
          <div className={`text-6xl md:text-8xl font-bold ${
            !contestantWon ? 'text-red-400' : 'text-slate-400'
          } mb-2`}>
            {chaserFinalTime}s
          </div>
          <div className="text-slate-300 uppercase tracking-wider">Chaser</div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-lg text-slate-400 mb-8 text-center max-w-lg">
        {contestantWon
          ? "The chaser's time ran out before yours. Well played!"
          : "Your time ran out before the chaser's. Better luck next time!"
        }
      </p>

      {/* Exit Button */}
      <button
        onClick={onClose}
        className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform text-lg"
      >
        Back to Lesson
      </button>
    </div>
  );
};

export default GameResult;
