import React from 'react';

interface WrongAnswerRevealProps {
  correctAnswer: string;
  correctLetter: string; // "A", "B", "C", "D"
  safeHavenAmount: number;
  onClose: () => void;
}

const WrongAnswerReveal: React.FC<WrongAnswerRevealProps> = ({
  correctAnswer,
  correctLetter,
  safeHavenAmount,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-950">
      <div className="text-center space-y-8 px-8 animate-fade-in">
        <div className="text-8xl animate-bounce">❌</div>
        <h2 className="text-8xl font-black text-white drop-shadow-lg animate-wrong-answer">
          WRONG ANSWER
        </h2>

        <div className="bg-white/10 backdrop-blur-sm rounded-3xl px-12 py-8 border-4 border-white/30 space-y-6">
          <div className="space-y-2">
            <p className="text-2xl font-bold text-red-200">The correct answer was:</p>
            <div className="bg-green-600 rounded-2xl px-8 py-6 border-4 border-green-400">
              <p className="text-5xl font-black text-white">
                {correctLetter}: {correctAnswer}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-white/20 pt-6 space-y-2">
            <p className="text-2xl font-bold text-amber-200">You take home:</p>
            <p className="text-7xl font-black text-amber-400 drop-shadow-lg">
              ${safeHavenAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-12 py-4 bg-white text-red-900 font-bold text-2xl rounded-2xl
            shadow-xl hover:scale-105 transition-transform uppercase tracking-wider"
        >
          Game Over
        </button>
      </div>
    </div>
  );
};

export default WrongAnswerReveal;
