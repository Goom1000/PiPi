import React from 'react';

interface GameBoardProps {
  contestantPosition: number;  // 0-6 (0 = top/chaser start, 6 = home)
  chaserPosition: number;      // 0-6
  highlightHome?: boolean;     // Flash home zone on victory
  className?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  contestantPosition,
  chaserPosition,
  highlightHome = false,
  className = ''
}) => {
  // 7 steps total (0-6), each step is 1/7 of board height
  const stepPercent = 100 / 7;

  return (
    <div className={`relative w-48 h-80 bg-slate-800 rounded-2xl border-4 border-slate-600 overflow-hidden ${className}`}>
      {/* Step divider lines - 6 lines to create 7 sections */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-px bg-slate-600"
          style={{ top: `${(i + 1) * stepPercent}%` }}
        />
      ))}

      {/* Home zone at bottom (position 6) */}
      <div className={`absolute bottom-0 left-0 right-0 h-12 bg-green-600/30
        flex items-center justify-center font-bold text-green-400 text-sm
        ${highlightHome ? 'animate-pulse' : ''}`}>
        HOME
      </div>

      {/* Game pieces */}
      <GamePiece position={chaserPosition} type="chaser" stepPercent={stepPercent} />
      <GamePiece position={contestantPosition} type="contestant" stepPercent={stepPercent} />
    </div>
  );
};

interface GamePieceProps {
  position: number;
  type: 'contestant' | 'chaser';
  stepPercent: number;
}

const GamePiece: React.FC<GamePieceProps> = ({ position, type, stepPercent }) => {
  const topPos = position * stepPercent;

  return (
    <div
      className="absolute left-1/2 w-12 h-12 -translate-x-1/2 transition-all duration-500 ease-out"
      style={{ top: `calc(${topPos}% + 2px)` }}
    >
      <div className={`w-full h-full rounded-full flex items-center justify-center text-2xl shadow-lg
        ${type === 'contestant' ? 'bg-blue-500' : 'bg-red-600'}`}>
        {type === 'contestant' ? '👤' : '😈'}
      </div>
    </div>
  );
};

export default GameBoard;
