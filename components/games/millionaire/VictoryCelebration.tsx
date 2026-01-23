import React, { useEffect, useState } from 'react';

interface VictoryCelebrationProps {
  finalPrize: number;
  onClose: () => void;
  onRestart?: () => void;
}

interface ConfettiPiece {
  id: number;
  left: string;
  backgroundColor: string;
  animationDelay: string;
}

const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({
  finalPrize,
  onClose,
  onRestart,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    // Generate 25 confetti pieces
    const pieces: ConfettiPiece[] = [];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#fbbf24'];

    for (let i = 0; i < 25; i++) {
      pieces.push({
        id: i,
        left: `${Math.random() * 100}%`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        animationDelay: `${Math.random() * 2}s`,
      });
    }

    setConfetti(pieces);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500">
      {/* Confetti */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: piece.left,
            backgroundColor: piece.backgroundColor,
            animationDelay: piece.animationDelay,
          }}
        />
      ))}

      {/* Victory Content */}
      <div className="text-center space-y-8 px-8 animate-fade-in relative z-10">
        <div className="text-9xl animate-bounce">💰</div>
        <h2 className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">
          MILLIONAIRE!
        </h2>

        <div className="bg-white/20 backdrop-blur-sm rounded-3xl px-16 py-10 border-4 border-white/40 space-y-4">
          <p className="text-3xl font-bold text-amber-950">You won:</p>
          <p className="text-9xl font-black text-green-600 drop-shadow-2xl">
            ${finalPrize.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-6 justify-center pt-6">
          {onRestart && (
            <button
              onClick={onRestart}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xl
                rounded-2xl shadow-xl transition-colors uppercase tracking-wider hover:scale-105 transform"
            >
              Play Again
            </button>
          )}
          <button
            onClick={onClose}
            className="px-12 py-4 bg-white text-amber-900 font-bold text-2xl rounded-2xl
              shadow-xl hover:scale-105 transition-transform uppercase tracking-wider"
          >
            Back to Lesson
          </button>
        </div>
      </div>
    </div>
  );
};

export default VictoryCelebration;
