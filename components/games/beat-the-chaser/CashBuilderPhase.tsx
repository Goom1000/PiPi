import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '../../../services/geminiService';
import {
  TIME_PER_CORRECT,
  MAX_CONTESTANT_TIME,
  CASH_BUILDER_QUESTIONS
} from './beatTheChaserConfig';

interface CashBuilderPhaseProps {
  questions: QuizQuestion[];
  onComplete: (accumulatedTime: number) => void;
  onExit: () => void;
}

const CashBuilderPhase: React.FC<CashBuilderPhaseProps> = ({
  questions,
  onComplete,
  onExit
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean[]>([]);

  // Limit to CASH_BUILDER_QUESTIONS
  const limitedQuestions = questions.slice(0, CASH_BUILDER_QUESTIONS);
  const currentQuestion = limitedQuestions[currentQuestionIndex];

  // Handle answer selection
  const handleAnswer = useCallback((selectedIndex: number) => {
    if (isAnswering) return;

    setIsAnswering(true);
    const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

    // Flash feedback
    setLastAnswerCorrect(isCorrect);

    if (isCorrect) {
      // Add time, capped at MAX_CONTESTANT_TIME
      setAccumulatedTime(prev => Math.min(prev + TIME_PER_CORRECT, MAX_CONTESTANT_TIME));
      setAnsweredCorrectly(prev => [...prev, true]);
    } else {
      setAnsweredCorrectly(prev => [...prev, false]);
    }

    // Brief pause (300ms) then next question
    setTimeout(() => {
      setLastAnswerCorrect(null);
      setIsAnswering(false);

      if (currentQuestionIndex < limitedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Cash Builder complete - pass accumulated time
        const finalTime = isCorrect
          ? Math.min(accumulatedTime + TIME_PER_CORRECT, MAX_CONTESTANT_TIME)
          : accumulatedTime;
        onComplete(finalTime);
      }
    }, 300);
  }, [currentQuestion, currentQuestionIndex, limitedQuestions.length, accumulatedTime, isAnswering, onComplete]);

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        handleAnswer(parseInt(e.key) - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer]);

  const correctCount = answeredCorrectly.filter(Boolean).length;

  return (
    <div className={`w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      flex flex-col p-6 ${lastAnswerCorrect === true ? 'animate-chase-score-flash' : ''}
      ${lastAnswerCorrect === false ? 'animate-chase-wrong-flash' : ''}`}>

      {/* Header with Time Bank */}
      <div className="flex justify-between items-center mb-6">
        {/* Progress */}
        <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-slate-600">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Question</div>
          <div className="text-4xl font-bold text-white">
            {currentQuestionIndex + 1}/{limitedQuestions.length}
          </div>
        </div>

        {/* Round Label */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-green-400 uppercase tracking-widest">
            Cash Builder
          </h2>
          <p className="text-slate-400 mt-1">Build your time bank!</p>
        </div>

        {/* Time Bank */}
        <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-green-500/30">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Time Bank</div>
          <div className="text-5xl font-bold text-green-400">
            {accumulatedTime}s
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {correctCount} correct x {TIME_PER_CORRECT}s
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
        {/* Question */}
        <div className="bg-slate-800/60 p-8 rounded-2xl border-2 border-slate-600 mb-6">
          <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed text-center">
            {currentQuestion?.question}
          </p>
        </div>

        {/* Answer Options - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion?.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={isAnswering}
              className={`
                p-6 rounded-xl text-left font-bold text-lg
                transition-all duration-150 border-2
                ${isAnswering
                  ? idx === currentQuestion.correctAnswerIndex
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-400'
                  : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:scale-[1.02]'
                }
              `}
            >
              <span className="text-slate-400 mr-3">{idx + 1}.</span>
              {option}
            </button>
          ))}
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-slate-500 text-sm mt-4">
          Press 1-4 to answer quickly
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center mt-4">
        {limitedQuestions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < currentQuestionIndex
                ? answeredCorrectly[i]
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentQuestionIndex
                ? 'bg-blue-500 ring-2 ring-blue-300'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Exit button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={onExit}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          End Game
        </button>
      </div>
    </div>
  );
};

export default CashBuilderPhase;
