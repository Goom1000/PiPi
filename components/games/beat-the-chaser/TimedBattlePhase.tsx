import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuizQuestion } from '../../../services/geminiService';
import { useTimer } from '../../../hooks/useTimer';
import { useChaserAI } from '../../../hooks/useChaserAI';
import DualTimerDisplay from './DualTimerDisplay';
import { getChaserThinkingTime, BeatTheChaserDifficulty } from './beatTheChaserConfig';

interface TimedBattlePhaseProps {
  contestantStartTime: number;
  chaserStartTime: number;
  difficulty: BeatTheChaserDifficulty;
  isAIControlled: boolean;
  questions: QuizQuestion[];
  onComplete: (winner: 'contestant' | 'chaser') => void;
  onExit: () => void;
  onStateUpdate?: (state: {
    contestantTime: number;
    chaserTime: number;
    activePlayer: 'contestant' | 'chaser';
  }) => void;
}

type TurnPhase = 'answering' | 'feedback-correct' | 'feedback-wrong' | 'thinking';

const TimedBattlePhase: React.FC<TimedBattlePhaseProps> = ({
  contestantStartTime,
  chaserStartTime,
  difficulty,
  isAIControlled,
  questions,
  onComplete,
  onExit,
  onStateUpdate
}) => {
  // Split questions: even indices for contestant, odd for chaser
  const contestantQuestions = useMemo(() =>
    questions.filter((_, i) => i % 2 === 0), [questions]);
  const chaserQuestions = useMemo(() =>
    questions.filter((_, i) => i % 2 === 1), [questions]);

  const [contestantQIndex, setContestantQIndex] = useState(0);
  const [chaserQIndex, setChaserQIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState<'contestant' | 'chaser'>('contestant');
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('answering');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  // Get chaser AI hook
  const { getChaserAnswer } = useChaserAI({
    difficulty,
    thinkingDelayMs: 0  // We handle thinking delay manually
  });

  // Current question based on active player
  const currentQuestion = activePlayer === 'contestant'
    ? contestantQuestions[contestantQIndex]
    : chaserQuestions[chaserQIndex];

  // Contestant timer - only runs during contestant's turn
  const contestantTimer = useTimer({
    initialSeconds: contestantStartTime,
    autoStart: true,
    onComplete: () => {
      if (!gameEnded) {
        setGameEnded(true);
        onComplete('chaser');
      }
    }
  });

  // Chaser timer - only runs during chaser's turn
  const chaserTimer = useTimer({
    initialSeconds: chaserStartTime,
    autoStart: false,
    onComplete: () => {
      if (!gameEnded) {
        setGameEnded(true);
        onComplete('contestant');
      }
    }
  });

  // Sync state to parent for student view
  useEffect(() => {
    onStateUpdate?.({
      contestantTime: contestantTimer.timeRemaining,
      chaserTime: chaserTimer.timeRemaining,
      activePlayer
    });
  }, [contestantTimer.timeRemaining, chaserTimer.timeRemaining, activePlayer, onStateUpdate]);

  // Handle answer (works for both contestant and chaser)
  const handleAnswer = useCallback(async (selectedIndex: number) => {
    if (turnPhase !== 'answering' || gameEnded) return;

    // Pause active timer during feedback
    if (activePlayer === 'contestant') {
      contestantTimer.pause();
    } else {
      chaserTimer.pause();
    }

    setSelectedAnswer(selectedIndex);
    const isCorrect = selectedIndex === currentQuestion?.correctAnswerIndex;

    if (isCorrect) {
      setTurnPhase('feedback-correct');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Switch to other player
      if (activePlayer === 'contestant') {
        // Check if chaser has questions left
        if (chaserQIndex >= chaserQuestions.length) {
          setGameEnded(true);
          onComplete('contestant'); // Chaser ran out of questions
          return;
        }
        setActivePlayer('chaser');
        contestantTimer.pause();
        chaserTimer.start();

        // If AI controlled, trigger chaser's turn
        if (isAIControlled) {
          setTurnPhase('thinking');
          setSelectedAnswer(null);

          const thinkingTime = getChaserThinkingTime(difficulty);
          await new Promise(resolve => setTimeout(resolve, thinkingTime));

          const chaserIdx = await getChaserAnswer(chaserQuestions[chaserQIndex]);
          handleChaserAIAnswer(chaserIdx);
        } else {
          setTurnPhase('answering');
          setSelectedAnswer(null);
        }
      } else {
        // Chaser got it right, switch to contestant
        if (contestantQIndex >= contestantQuestions.length) {
          setGameEnded(true);
          onComplete('chaser'); // Contestant ran out of questions
          return;
        }
        setActivePlayer('contestant');
        chaserTimer.pause();
        contestantTimer.start();
        setTurnPhase('answering');
        setSelectedAnswer(null);
      }
    } else {
      // Wrong answer - stay on turn, next question
      setTurnPhase('feedback-wrong');
      await new Promise(resolve => setTimeout(resolve, 800));

      if (activePlayer === 'contestant') {
        const nextIdx = contestantQIndex + 1;
        if (nextIdx >= contestantQuestions.length) {
          setGameEnded(true);
          onComplete('chaser'); // Ran out of questions
          return;
        }
        setContestantQIndex(nextIdx);
        contestantTimer.start(); // Resume timer
      } else {
        const nextIdx = chaserQIndex + 1;
        if (nextIdx >= chaserQuestions.length) {
          setGameEnded(true);
          onComplete('contestant'); // Chaser ran out of questions
          return;
        }
        setChaserQIndex(nextIdx);
        chaserTimer.start(); // Resume timer

        // If AI, continue answering
        if (isAIControlled) {
          setTurnPhase('thinking');
          setSelectedAnswer(null);

          const thinkingTime = getChaserThinkingTime(difficulty);
          await new Promise(resolve => setTimeout(resolve, thinkingTime));

          const chaserIdx = await getChaserAnswer(chaserQuestions[nextIdx]);
          handleChaserAIAnswer(chaserIdx);
          return;
        }
      }

      setTurnPhase('answering');
      setSelectedAnswer(null);
    }
  }, [turnPhase, gameEnded, activePlayer, currentQuestion, contestantTimer, chaserTimer,
      contestantQIndex, chaserQIndex, contestantQuestions, chaserQuestions,
      isAIControlled, getChaserAnswer, difficulty, onComplete]);

  // Separate handler for AI chaser answers to avoid recursion issues
  const handleChaserAIAnswer = useCallback(async (selectedIndex: number) => {
    if (gameEnded) return;

    chaserTimer.pause();
    setSelectedAnswer(selectedIndex);
    const isCorrect = selectedIndex === chaserQuestions[chaserQIndex]?.correctAnswerIndex;

    if (isCorrect) {
      setTurnPhase('feedback-correct');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Switch to contestant
      if (contestantQIndex >= contestantQuestions.length) {
        setGameEnded(true);
        onComplete('chaser');
        return;
      }
      setActivePlayer('contestant');
      chaserTimer.pause();
      contestantTimer.start();
      setTurnPhase('answering');
      setSelectedAnswer(null);
    } else {
      // Wrong - chaser stays on turn
      setTurnPhase('feedback-wrong');
      await new Promise(resolve => setTimeout(resolve, 800));

      const nextIdx = chaserQIndex + 1;
      if (nextIdx >= chaserQuestions.length) {
        setGameEnded(true);
        onComplete('contestant');
        return;
      }
      setChaserQIndex(nextIdx);
      chaserTimer.start();

      // Continue AI answering
      setTurnPhase('thinking');
      setSelectedAnswer(null);

      const thinkingTime = getChaserThinkingTime(difficulty);
      await new Promise(resolve => setTimeout(resolve, thinkingTime));

      const chaserIdx = await getChaserAnswer(chaserQuestions[nextIdx]);
      handleChaserAIAnswer(chaserIdx);
    }
  }, [gameEnded, chaserQIndex, chaserQuestions, contestantQIndex, contestantQuestions,
      chaserTimer, contestantTimer, getChaserAnswer, difficulty, onComplete]);

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (turnPhase === 'answering' && e.key >= '1' && e.key <= '4') {
        handleAnswer(parseInt(e.key) - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnPhase, handleAnswer]);

  // Get feedback message
  const getFeedbackMessage = () => {
    if (turnPhase === 'thinking') {
      return activePlayer === 'chaser' ? 'Chaser is thinking...' : '';
    }
    if (turnPhase === 'feedback-correct') {
      return activePlayer === 'contestant' ? '✓ Correct!' : '✓ Chaser Correct!';
    }
    if (turnPhase === 'feedback-wrong') {
      return activePlayer === 'contestant' ? '✗ Wrong - Try Again!' : '✗ Chaser Wrong!';
    }
    return activePlayer === 'contestant' ? 'Your Turn - Answer!' : 'Chaser\'s Turn';
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-950 via-slate-900 to-red-950 flex flex-col p-6">
      {/* Dual Timer Display */}
      <DualTimerDisplay
        contestantTime={contestantTimer.timeRemaining}
        chaserTime={chaserTimer.timeRemaining}
        activePlayer={activePlayer}
      />

      {/* Turn Indicator */}
      <div className="text-center mb-4">
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${
          activePlayer === 'contestant'
            ? 'bg-blue-500/30 text-blue-300'
            : 'bg-red-500/30 text-red-300'
        }`}>
          {getFeedbackMessage()}
        </span>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
        {/* Question */}
        <div className="bg-slate-800/60 p-6 md:p-8 rounded-2xl border-2 border-slate-600 mb-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            {activePlayer === 'contestant' ? 'Your' : 'Chaser\'s'} Question {
              activePlayer === 'contestant' ? contestantQIndex + 1 : chaserQIndex + 1
            }
          </div>
          <p className="text-xl md:text-2xl font-bold text-white leading-relaxed text-center">
            {currentQuestion?.question}
          </p>
        </div>

        {/* Answer Options - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion?.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQuestion.correctAnswerIndex;
            const showResult = turnPhase === 'feedback-correct' || turnPhase === 'feedback-wrong';

            return (
              <button
                key={idx}
                onClick={() => {
                  if (turnPhase === 'answering' && (activePlayer === 'contestant' || !isAIControlled)) {
                    handleAnswer(idx);
                  }
                }}
                disabled={turnPhase !== 'answering' || (activePlayer === 'chaser' && isAIControlled)}
                className={`
                  p-5 rounded-xl text-left font-bold text-lg transition-all duration-150 border-2
                  ${isSelected && !showResult ? (activePlayer === 'contestant' ? 'bg-blue-500 border-blue-400' : 'bg-red-500 border-red-400') + ' text-white' : ''}
                  ${!isSelected && !showResult ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500' : ''}
                  ${showResult && isCorrect ? 'bg-green-600 border-green-400 text-white' : ''}
                  ${showResult && !isCorrect && isSelected ? 'bg-red-800 border-red-600 text-white opacity-70' : ''}
                  ${showResult && !isCorrect && !isSelected ? 'opacity-30' : ''}
                `}
              >
                <span className="text-slate-400 mr-3">{idx + 1}.</span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-slate-500 text-sm mt-4">
          {turnPhase === 'answering' && activePlayer === 'contestant' && 'Press 1-4 to answer'}
          {turnPhase === 'answering' && activePlayer === 'chaser' && !isAIControlled && 'Press 1-4 for chaser answer'}
        </p>
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

export default TimedBattlePhase;
