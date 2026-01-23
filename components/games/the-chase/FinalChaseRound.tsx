import React, { useState, useCallback } from 'react';
import { QuizQuestion } from '../../../services/geminiService';
import { useTimer } from '../../../hooks/useTimer';
import { useChaserAI, ChaserDifficulty } from '../../../hooks/useChaserAI';
import Timer from '../shared/Timer';
import ChaserThinking from './ChaserThinking';

// Component-local phase type for internal UI state management
// (distinct from global ChasePhase in types.ts - orchestrator only sees 'final-chase-contestant' or 'final-chase-chaser')
type FinalPhase =
  | 'intro'
  | 'contestant-round'
  | 'transition'
  | 'chaser-round'
  | 'pushback-opportunity'
  | 'complete';

interface FinalChaseRoundProps {
  questions: QuizQuestion[];
  contestantTargetScore: number;  // Score contestant built in their 2-min round (for display)
  chaserDifficulty: ChaserDifficulty;
  isAIControlled: boolean;
  prizeAmount: number;
  onComplete: (outcome: 'win' | 'loss', contestantScore: number, chaserScore: number) => void;
  onExit: () => void;
}

const FinalChaseRound: React.FC<FinalChaseRoundProps> = ({
  questions,
  contestantTargetScore,
  chaserDifficulty,
  isAIControlled,
  prizeAmount,
  onComplete,
  onExit
}) => {
  // Phase management
  const [phase, setPhase] = useState<FinalPhase>('intro');

  // Question tracking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Contestant phase state
  const [contestantScore, setContestantScore] = useState(0);
  const [contestantAnswer, setContestantAnswer] = useState<number | null>(null);
  const [showContestantResult, setShowContestantResult] = useState(false);

  // Chaser phase state
  const [chaserScore, setChaserScore] = useState(0);
  const [chaserAnswer, setChaserAnswer] = useState<number | null>(null);
  const [showChaserResult, setShowChaserResult] = useState(false);
  const [pushbackOpportunityQuestion, setPushbackOpportunityQuestion] = useState<QuizQuestion | null>(null);
  const [pushbacksEarned, setPushbacksEarned] = useState(0);  // Track successful pushbacks

  const currentQuestion = questions[currentQuestionIndex];
  const { getChaserAnswer, isThinking } = useChaserAI({ difficulty: chaserDifficulty });

  // Contestant timer - 2 minutes (120 seconds)
  const contestantTimer = useTimer({
    initialSeconds: 120,
    onComplete: () => {
      // Contestant time expired - transition to chaser round
      setPhase('transition');
    },
    autoStart: false
  });

  // Chaser timer - 2 minutes (120 seconds)
  const chaserTimer = useTimer({
    initialSeconds: 120,
    onComplete: () => {
      // Chaser time expired - contestant wins!
      setPhase('complete');
      onComplete('win', contestantScore, chaserScore);
    },
    autoStart: false
  });

  // Start contestant round
  const startContestantRound = () => {
    setPhase('contestant-round');
    contestantTimer.start();
  };

  // Start chaser round after transition
  const startChaserRound = () => {
    setPhase('chaser-round');
    setCurrentQuestionIndex(0);  // Reset questions for chaser
    setContestantAnswer(null);
    setShowContestantResult(false);
    setChaserAnswer(null);
    setShowChaserResult(false);
    chaserTimer.start();
  };

  // Handle contestant answer during contestant phase
  const handleContestantAnswer = useCallback(async (selectedIndex: number) => {
    if (phase !== 'contestant-round' || !contestantTimer.isRunning) return;

    setContestantAnswer(selectedIndex);
    const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;
    setShowContestantResult(true);

    if (isCorrect) {
      setContestantScore(prev => prev + 1);
    }

    // Brief feedback delay
    await new Promise(r => setTimeout(r, 300));

    // Move to next question
    setShowContestantResult(false);
    setContestantAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Ran out of questions (unlikely but possible)
      contestantTimer.pause();
      setPhase('transition');
    }
  }, [phase, currentQuestion, currentQuestionIndex, questions.length, contestantTimer]);

  // Handle chaser answer during chaser phase
  const handleChaserAnswer = useCallback(async (selectedIndex: number) => {
    if (phase !== 'chaser-round' || !chaserTimer.isRunning) return;

    setChaserAnswer(selectedIndex);
    const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;
    setShowChaserResult(true);

    if (isCorrect) {
      const newChaserScore = chaserScore + 1;
      setChaserScore(newChaserScore);

      // Check if chaser caught up
      const effectiveLeadNeeded = contestantScore + pushbacksEarned;
      if (newChaserScore > effectiveLeadNeeded) {
        // Chaser wins!
        chaserTimer.pause();
        await new Promise(r => setTimeout(r, 1000));
        setPhase('complete');
        onComplete('loss', contestantScore, newChaserScore);
        return;
      }
    } else {
      // Wrong answer - offer pushback opportunity
      chaserTimer.pause();
      await new Promise(r => setTimeout(r, 1000));
      setPushbackOpportunityQuestion(currentQuestion);
      setPhase('pushback-opportunity');
      return;
    }

    // Move to next question
    await new Promise(r => setTimeout(r, 800));
    setShowChaserResult(false);
    setChaserAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    // If out of questions, timer will expire naturally
  }, [phase, currentQuestion, currentQuestionIndex, questions.length, chaserScore, contestantScore, pushbacksEarned, chaserTimer, onComplete]);

  // Trigger AI chaser answer
  const triggerChaserAI = useCallback(async () => {
    if (phase !== 'chaser-round' || !isAIControlled) return;

    const aiAnswer = await getChaserAnswer(currentQuestion);
    await handleChaserAnswer(aiAnswer);
  }, [phase, isAIControlled, currentQuestion, getChaserAnswer, handleChaserAnswer]);

  // Auto-trigger AI when entering chaser phase
  React.useEffect(() => {
    if (phase === 'chaser-round' && isAIControlled && !showChaserResult && chaserAnswer === null) {
      triggerChaserAI();
    }
  }, [phase, isAIControlled, showChaserResult, chaserAnswer, triggerChaserAI]);

  // Handle pushback attempt
  const handlePushbackAnswer = useCallback(async (selectedIndex: number) => {
    if (!pushbackOpportunityQuestion) return;

    const isCorrect = selectedIndex === pushbackOpportunityQuestion.correctAnswerIndex;

    if (isCorrect) {
      // Successful pushback! Increase effective lead
      setPushbacksEarned(prev => prev + 1);
    }

    // Show brief feedback
    await new Promise(r => setTimeout(r, 1000));

    // Resume chaser round
    setPushbackOpportunityQuestion(null);
    setShowChaserResult(false);
    setChaserAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }

    setPhase('chaser-round');
    chaserTimer.start();  // Resume timer
  }, [pushbackOpportunityQuestion, currentQuestionIndex, questions.length, chaserTimer]);

  // Keyboard shortcuts for contestant round (1-4)
  React.useEffect(() => {
    if (phase !== 'contestant-round') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        handleContestantAnswer(parseInt(e.key) - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleContestantAnswer]);

  // Render intro screen
  if (phase === 'intro') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-6xl font-black text-amber-400 uppercase tracking-widest mb-6">
            Final Chase
          </h1>

          <div className="bg-slate-800/60 rounded-2xl p-8 mb-8">
            <p className="text-2xl text-white mb-4">
              You have <span className="font-bold text-amber-400">2 minutes</span> to answer as many questions as you can.
            </p>
            <p className="text-xl text-slate-300 mb-6">
              Then the Chaser gets <span className="font-bold text-red-400">2 minutes</span> to catch your score.
            </p>
            <div className="border-t border-slate-600 pt-4">
              <p className="text-lg text-slate-400">
                <strong className="text-white">Pushback:</strong> When the Chaser answers wrong,
                you can answer correctly to push them back and increase your lead!
              </p>
            </div>
          </div>

          <div className="bg-amber-900/30 border-2 border-amber-500/50 rounded-xl p-6 mb-8">
            <p className="text-slate-300 text-lg mb-2">Prize at stake:</p>
            <p className="text-5xl font-black text-amber-400">
              ${prizeAmount.toLocaleString()}
            </p>
          </div>

          <button
            onClick={startContestantRound}
            className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-2xl rounded-xl transition-colors"
          >
            Start Final Chase
          </button>
        </div>

        <button
          onClick={onExit}
          className="absolute bottom-6 right-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          End Game
        </button>
      </div>
    );
  }

  // Render transition screen
  if (phase === 'transition') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-2xl">
          <h2 className="text-5xl font-black text-white mb-8 uppercase">
            Contestant Complete!
          </h2>

          <div className="bg-green-800/30 border-2 border-green-500/50 rounded-2xl p-8 mb-8">
            <p className="text-slate-300 text-xl mb-2">Your Score:</p>
            <p className="text-7xl font-black text-green-400">
              {contestantScore}
            </p>
            <p className="text-slate-400 mt-2">correct answers</p>
          </div>

          <p className="text-2xl text-white mb-8">
            The Chaser needs to beat <span className="font-bold text-amber-400">{contestantScore}</span> in 2 minutes!
          </p>

          <button
            onClick={startChaserRound}
            className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-2xl rounded-xl transition-colors"
          >
            Start Chaser's Turn
          </button>
        </div>
      </div>
    );
  }

  // Render pushback opportunity screen
  if (phase === 'pushback-opportunity' && pushbackOpportunityQuestion) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 flex flex-col p-6">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-black text-amber-400 uppercase tracking-widest mb-2">
            Pushback Opportunity!
          </h2>
          <p className="text-xl text-white">
            The Chaser got it wrong - answer correctly to push them back!
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
          {/* Question */}
          <div className="bg-slate-800/60 p-8 rounded-2xl border-2 border-amber-500 mb-6">
            <p className="text-2xl md:text-3xl font-bold text-white">
              {pushbackOpportunityQuestion.question}
            </p>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4">
            {pushbackOpportunityQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handlePushbackAnswer(idx)}
                className="p-6 rounded-xl text-left font-bold text-lg
                  bg-amber-700 border-2 border-amber-500 text-white
                  hover:bg-amber-600 hover:scale-[1.02] transition-all"
              >
                <span className="text-amber-300 mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render contestant round
  if (phase === 'contestant-round') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col p-6">
        {/* Header with Timer and Score */}
        <div className="flex justify-between items-center mb-6">
          {/* Timer */}
          <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-slate-600">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Time</div>
            <div className={`text-5xl font-mono font-bold ${
              contestantTimer.timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'
            }`}>
              {contestantTimer.formattedTime}
            </div>
          </div>

          {/* Round Label */}
          <div className="text-center">
            <h2 className="text-3xl font-black text-green-400 uppercase tracking-widest">
              Final Chase - Your Turn
            </h2>
            <p className="text-slate-400 mt-1">Answer as many as you can!</p>
          </div>

          {/* Score */}
          <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-green-500/30">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Your Score</div>
            <div className="text-5xl font-bold text-green-400">
              {contestantScore}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
          {/* Question */}
          <div className="bg-slate-800/60 p-8 rounded-2xl border-2 border-slate-600 mb-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              Question {currentQuestionIndex + 1}
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
              {currentQuestion?.question}
            </p>
          </div>

          {/* Answer Options - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion?.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleContestantAnswer(idx)}
                disabled={!contestantTimer.isRunning || showContestantResult}
                className={`
                  p-6 rounded-xl text-left font-bold text-lg
                  transition-all duration-150 border-2
                  ${showContestantResult
                    ? idx === currentQuestion.correctAnswerIndex
                      ? 'bg-green-600 border-green-400 text-white'
                      : contestantAnswer === idx
                        ? 'bg-red-600 border-red-400 text-white'
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
  }

  // Render chaser round
  if (phase === 'chaser-round') {
    const effectiveTarget = contestantScore + pushbacksEarned;
    const chaserNeeds = effectiveTarget - chaserScore + 1;

    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex flex-col p-6">
        {/* Header with Timer and Scores */}
        <div className="flex justify-between items-center mb-6">
          {/* Timer */}
          <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-slate-600">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Time</div>
            <div className={`text-5xl font-mono font-bold ${
              chaserTimer.timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'
            }`}>
              {chaserTimer.formattedTime}
            </div>
          </div>

          {/* Round Label */}
          <div className="text-center">
            <h2 className="text-3xl font-black text-red-400 uppercase tracking-widest">
              Final Chase - Chaser's Turn
            </h2>
            <p className="text-slate-400 mt-1">
              Needs {chaserNeeds} more to catch you
            </p>
          </div>

          {/* Scores */}
          <div className="flex gap-4">
            <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-green-500/30">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">You</div>
              <div className="text-4xl font-bold text-green-400">
                {contestantScore}
                {pushbacksEarned > 0 && (
                  <span className="text-2xl text-amber-400"> +{pushbacksEarned}</span>
                )}
              </div>
            </div>
            <div className="bg-slate-800/80 rounded-xl px-6 py-4 border-2 border-red-500/30">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Chaser</div>
              <div className="text-4xl font-bold text-red-400">
                {chaserScore}
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
          {/* Question */}
          <div className="bg-slate-800/60 p-8 rounded-2xl border-2 border-slate-600 mb-6">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              Question {currentQuestionIndex + 1}
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
              {currentQuestion?.question}
            </p>
          </div>

          {/* Answer Options - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion?.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !isAIControlled && handleChaserAnswer(idx)}
                disabled={isAIControlled || !chaserTimer.isRunning || showChaserResult}
                className={`
                  p-6 rounded-xl text-left font-bold text-lg
                  transition-all duration-150 border-2
                  ${showChaserResult
                    ? idx === currentQuestion.correctAnswerIndex
                      ? 'bg-green-600 border-green-400 text-white'
                      : chaserAnswer === idx
                        ? 'bg-red-600 border-red-400 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-400'
                    : isAIControlled
                      ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 hover:scale-[1.02]'
                  }
                `}
              >
                <span className="text-slate-400 mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>

          {/* Manual chaser control hint */}
          {!isAIControlled && (
            <p className="text-center text-red-400 mt-4">
              Teacher: Select the chaser's answer
            </p>
          )}
        </div>

        {/* Chaser Thinking Overlay */}
        <ChaserThinking isVisible={isThinking} />

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
  }

  // Should not reach here, but return empty div as fallback
  return <div className="w-full h-full bg-slate-900" />;
};

export default FinalChaseRound;
