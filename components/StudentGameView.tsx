import React from 'react';
import { GameSyncState } from '../types';

interface StudentGameViewProps {
  gameState: GameSyncState;
}

/**
 * Read-only game display for student view.
 * Renders identical visual to QuizOverlay but without controls.
 * Students see questions and answers but cannot interact.
 */
const StudentGameView: React.FC<StudentGameViewProps> = ({ gameState }) => {
  const { mode, questions, currentQuestionIndex, isAnswerRevealed } = gameState;
  const currentQuestion = questions[currentQuestionIndex];

  // Shape renderer (same as QuizOverlay)
  const renderShape = (idx: number) => {
    const classes = "w-6 h-6 md:w-10 md:h-10 text-white/80";
    if (idx === 0) return <svg className={classes} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>;
    if (idx === 1) return <svg className={classes} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l10 10-10 10L2 12 12 2z"/></svg>;
    if (idx === 2) return <svg className={classes} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>;
    return <svg className={classes} viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18"/></svg>;
  };

  const bgColors = [
    "bg-red-600 border-red-800",
    "bg-blue-600 border-blue-800",
    "bg-amber-500 border-amber-700",
    "bg-green-600 border-green-800"
  ];

  // Loading state - shown when game is generating questions
  if (mode === 'loading') {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-8 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-t-indigo-500 border-l-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-4 bg-indigo-600 rounded-full flex items-center justify-center text-3xl animate-pulse">
              <span role="img" aria-label="robot">&#129302;</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white animate-pulse">Loading Game...</h2>
          <p className="text-indigo-200 mt-2">Preparing questions</p>
        </div>
      </div>
    );
  }

  // Summary state - quiz complete
  if (mode === 'summary') {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center font-poppins">
        <div className="text-8xl mb-6 animate-bounce">
          <span role="img" aria-label="trophy">&#127942;</span>
        </div>
        <h2 className="text-5xl font-black text-white mb-4">Quiz Complete!</h2>
        <p className="text-2xl text-indigo-200">Great job reviewing the lesson.</p>
      </div>
    );
  }

  // Play mode - render current question and options
  if (mode === 'play' && currentQuestion) {
    return (
      <div className="h-screen w-screen bg-slate-900/95 flex items-center justify-center p-6 font-poppins text-white">
        <div className="w-full max-w-6xl h-full flex flex-col justify-between py-6">
          {/* Question header */}
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-sm font-bold uppercase tracking-widest mb-4">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="bg-white text-slate-900 p-8 md:p-12 rounded-3xl shadow-2xl text-2xl md:text-4xl font-bold leading-tight min-h-[200px] flex items-center justify-center border-b-8 border-slate-200">
              {currentQuestion.question}
            </div>
          </div>

          {/* Answer options grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 flex-1 min-h-0">
            {currentQuestion.options.map((opt, idx) => {
              const isCorrect = idx === currentQuestion.correctAnswerIndex;
              const isDimmed = isAnswerRevealed && !isCorrect;

              return (
                <div
                  key={idx}
                  className={`
                    relative rounded-2xl p-6 md:p-8 flex items-center shadow-lg border-b-8 transition-all duration-500
                    ${bgColors[idx]}
                    ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100'}
                  `}
                >
                  <div className="absolute top-4 left-4 opacity-50">{renderShape(idx)}</div>
                  <span className="text-xl md:text-3xl font-bold text-white pl-12 md:pl-16 drop-shadow-md">
                    {opt}
                  </span>
                  {isAnswerRevealed && isCorrect && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-green-600 p-2 rounded-full shadow-lg">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation (shown when answer revealed) */}
          {isAnswerRevealed && currentQuestion.explanation && (
            <div className="mt-8 flex justify-center">
              <div className="bg-indigo-900/50 p-4 rounded-xl border border-indigo-500/30 max-w-4xl w-full">
                <span className="text-xs font-bold text-indigo-300 uppercase block mb-1">Explanation</span>
                <p className="text-lg">{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-xl">Waiting for game...</div>
    </div>
  );
};

export default StudentGameView;
