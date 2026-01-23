# Phase 24: Beat the Chaser - Research

**Researched:** 2026-01-24
**Domain:** Dual independent countdown timer game with turn-based mechanics and time accumulation
**Confidence:** HIGH

## Summary

Phase 24 implements "Beat the Chaser" - a spin-off game format featuring dual independent countdown timers racing against each other. Unlike The Chase (Phase 23) which uses position-based gameplay on a 7-step board, Beat the Chaser is purely time-based: contestant and chaser each have their own countdown timer, and whoever's timer expires first loses.

The game has two distinct phases: (1) Cash Builder where contestants accumulate time on their clock (5 seconds per correct answer), and (2) Timed Battle where contestant and chaser alternate answering the same questions with only the active player's timer counting down. The unique catch-up mechanic allows contestants to add time to their clock by answering correctly during the chaser's turn.

Based on the TV show format research, the core mechanic is elegant: "Only one clock runs at any given moment. The side in control must answer a question correctly to stop their clock and turn control over to the opposing side." This creates natural tension as correct answers protect your time while wrong answers bleed it away. The difficulty scaling (Easy=80%, Medium=100%, Hard=120% of contestant time) ensures fair but challenging gameplay.

The existing architecture from Phase 23 provides most infrastructure needed: useTimer hook for countdown timers, AI accuracy patterns (50-95% based on difficulty), BroadcastChannel sync for teacher-student communication, and game state management patterns. The main technical challenges are: (1) managing two independent timers with conditional running, (2) implementing turn-based mechanics where both players answer the same question sequentially, (3) time bonus feedback with floating "+5s" animations, and (4) instant loss detection when either timer hits zero.

**Primary recommendation:** Reuse and extend Phase 23's patterns - useTimer hook with external control for conditional running, phase-based state machine (cash-builder → timed-battle → game-over), AI opponent from The Chase with adjusted accuracy ranges, and CSS keyframe animations for time bonus feedback. Zero new dependencies needed.

## Standard Stack

Per Phase 20 and v3.0 decisions: **zero new runtime dependencies**.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI rendering | Already in project |
| TypeScript | 5.8.2 | Type system | Already in project |
| Tailwind CSS | CDN | Styling | Already configured |
| Native BroadcastChannel | Built-in | Teacher-student sync | Already used in useBroadcastSync hook |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useTimer hook | Custom | Countdown timers | Cash Builder 60s, dual battle timers (reuse from Phase 23) |
| useState | React built-in | Phase management | Simple linear phase flow: cash-builder → timed-battle → game-over |
| setInterval | Native JS | Timer ticks | 1-second countdown intervals |
| CSS Keyframes | Native | Floating animations | "+5s" time bonus feedback |
| Math.random() | Native JS | AI accuracy simulation | Weighted random for chaser answers (50-95% accuracy) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useState phase | useReducer FSM | useReducer overkill for 3-phase linear flow; useState clearer |
| setInterval | requestAnimationFrame | RAF better for visual animations, but setInterval standard for 1-second ticks |
| CSS animations | Framer Motion | Adds ~40kb dependency; CSS keyframes adequate for fade-up text |
| Custom timer logic | react-timer-hook | Adds dependency; existing useTimer hook already built and tested |

**Installation:**
```bash
# No new dependencies needed - everything uses existing hooks and native APIs
```

## Architecture Patterns

### Recommended Project Structure
```
components/
  games/
    BeatTheChaserGame.tsx           # Main game orchestrator (teacher view)
    beat-the-chaser/
      CashBuilderPhase.tsx          # Time accumulation phase (5s per correct)
      TimedBattlePhase.tsx          # Dual timer battle with turn switching
      DualTimerDisplay.tsx          # Side-by-side countdown timers
      TimeBonusEffect.tsx           # Floating "+5s" animation component
      GameResult.tsx                # Win/loss outcome screen
    shared/
      GameSplash.tsx                # Already exists
hooks/
  useTimer.ts                       # Already exists from Phase 23
  useChaserAI.ts                    # Already exists, adjust accuracy ranges
types.ts                            # BeatTheChaserState already defined
services/
  aiProvider.ts                     # Already has generateGameQuestions
```

### Pattern 1: Dual Independent Timers with Conditional Running
**What:** Two separate useTimer instances where only one runs at a time based on active player
**When to use:** Timed battle phase where contestant and chaser take turns
**Example:**
```typescript
// Source: Existing useTimer hook from Phase 23
// Extended pattern for conditional timer control

interface TimedBattleState {
  contestantTime: number;      // Accumulated from Cash Builder
  chaserTime: number;          // Calculated from difficulty (80%, 100%, 120%)
  activePlayer: 'contestant' | 'chaser';
  phase: 'contestant-turn' | 'chaser-turn' | 'complete';
}

function TimedBattlePhase() {
  const [battleState, setBattleState] = useState<TimedBattleState>({
    contestantTime: 60,  // From Cash Builder
    chaserTime: 60,      // From difficulty calculation
    activePlayer: 'contestant',
    phase: 'contestant-turn'
  });

  // Contestant timer - only runs during contestant's turn
  const contestantTimer = useTimer({
    initialSeconds: battleState.contestantTime,
    autoStart: false,  // Manual control
    onComplete: () => {
      // Contestant timer expired = chaser wins
      setBattleState(prev => ({ ...prev, phase: 'complete' }));
      onGameComplete('loss');
    },
    onTick: (remaining) => {
      if (remaining <= 10) {
        // Urgency styling (red pulse)
      }
    }
  });

  // Chaser timer - only runs during chaser's turn
  const chaserTimer = useTimer({
    initialSeconds: battleState.chaserTime,
    autoStart: false,  // Manual control
    onComplete: () => {
      // Chaser timer expired = contestant wins
      setBattleState(prev => ({ ...prev, phase: 'complete' }));
      onGameComplete('win');
    },
    onTick: (remaining) => {
      if (remaining <= 10) {
        // Urgency styling (red pulse)
      }
    }
  });

  // Start appropriate timer based on active player
  useEffect(() => {
    if (battleState.activePlayer === 'contestant' && !contestantTimer.isRunning) {
      contestantTimer.start();
      chaserTimer.pause();
    } else if (battleState.activePlayer === 'chaser' && !chaserTimer.isRunning) {
      chaserTimer.start();
      contestantTimer.pause();
    }
  }, [battleState.activePlayer]);

  // Handle contestant answer
  const handleContestantAnswer = async (selectedIndex: number) => {
    contestantTimer.pause();  // Stop contestant clock

    const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      // Correct: switch to chaser's turn
      setBattleState(prev => ({
        ...prev,
        activePlayer: 'chaser',
        phase: 'chaser-turn'
      }));
      await showAnswerFeedback('correct');
    } else {
      // Wrong: still switch to chaser (no time penalty, just lose turn)
      setBattleState(prev => ({
        ...prev,
        activePlayer: 'chaser',
        phase: 'chaser-turn'
      }));
      await showAnswerFeedback('incorrect');
    }
  };

  // Handle chaser answer
  const handleChaserAnswer = async (selectedIndex: number) => {
    chaserTimer.pause();  // Stop chaser clock

    const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      // Chaser correct: switch back to contestant
      setBattleState(prev => ({
        ...prev,
        activePlayer: 'contestant',
        phase: 'contestant-turn'
      }));
      await showAnswerFeedback('correct');
    } else {
      // Chaser wrong: contestant gets catch-up bonus (+5s)
      const newContestantTime = contestantTimer.timeRemaining + 5;
      contestantTimer.reset(newContestantTime);

      // Show time bonus animation
      await showTimeBonusEffect('+5s');

      // Switch back to contestant
      setBattleState(prev => ({
        ...prev,
        activePlayer: 'contestant',
        phase: 'contestant-turn'
      }));
    }

    // Move to next question
    await new Promise(resolve => setTimeout(resolve, 1500));
    nextQuestion();
  };

  return (
    <div>
      <DualTimerDisplay
        contestantTime={contestantTimer.timeRemaining}
        chaserTime={chaserTimer.timeRemaining}
        activePlayer={battleState.activePlayer}
      />
      {/* Question display and answer handling */}
    </div>
  );
}
```

### Pattern 2: Time Accumulation in Cash Builder
**What:** Fixed 5-second increments per correct answer during rapid-fire round
**When to use:** Cash Builder phase to determine contestant's starting time
**Example:**
```typescript
// Source: Phase 23 Cash Builder pattern, adapted for time accumulation

interface CashBuilderPhaseProps {
  questions: QuizQuestion[];
  onComplete: (accumulatedTime: number) => void;
}

function CashBuilderPhase({ questions, onComplete }: CashBuilderPhaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);  // Time bank in seconds
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean[]>([]);

  // No timer needed - question count determines Cash Builder length
  // TV show format: typically 5 questions with 5s per correct

  const handleAnswer = (selectedIndex: number) => {
    const current = questions[currentIndex];
    const isCorrect = selectedIndex === current.correctAnswerIndex;

    if (isCorrect) {
      // Add 5 seconds to time bank
      setAccumulatedTime(prev => prev + 5);
      setAnsweredCorrectly(prev => [...prev, true]);
    } else {
      setAnsweredCorrectly(prev => [...prev, false]);
    }

    // Brief feedback, then next question
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Cash Builder complete
        onComplete(accumulatedTime);
      }
    }, 800);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 p-8">
      {/* Time Bank Display */}
      <div className="text-center mb-8">
        <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">
          Time Bank
        </div>
        <div className="text-6xl font-black text-green-400">
          {accumulatedTime}s
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {answeredCorrectly.filter(Boolean).length} correct × 5s
        </div>
      </div>

      {/* Question Display */}
      <QuestionDisplay
        question={questions[currentIndex]}
        onAnswer={handleAnswer}
      />

      {/* Progress Indicator */}
      <div className="flex gap-2 justify-center mt-8">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < currentIndex
                ? answeredCorrectly[i]
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentIndex
                ? 'bg-blue-500 ring-2 ring-blue-300'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

### Pattern 3: Floating Time Bonus Animation
**What:** CSS keyframe animation for "+5s" text that fades up and out
**When to use:** When contestant earns time bonus during chaser's turn
**Example:**
```typescript
// Source: CSS keyframe fade-up pattern from web research
// https://www.tutorialspoint.com/css/css_animation_fade_in_up.htm

interface TimeBonusEffectProps {
  show: boolean;
  amount: string;  // "+5s"
  onComplete: () => void;
}

function TimeBonusEffect({ show, amount, onComplete }: TimeBonusEffectProps) {
  useEffect(() => {
    if (show) {
      // Animation duration: 1500ms
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="absolute top-1/4 left-1/4 pointer-events-none z-50">
      <div className="animate-float-up text-6xl font-black text-green-400 drop-shadow-lg">
        {amount}
      </div>
    </div>
  );
}

// Tailwind config - add custom animation
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'float-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(0px) scale(0.8)'
          },
          '20%': {
            opacity: '1',
            transform: 'translateY(-20px) scale(1.2)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-100px) scale(1)'
          }
        }
      },
      animation: {
        'float-up': 'float-up 1.5s ease-out forwards'
      }
    }
  }
}
```

### Pattern 4: Difficulty-Based Timer Allocation
**What:** Calculate chaser's starting time as percentage of contestant's accumulated time
**When to use:** Transition from Cash Builder to Timed Battle
**Example:**
```typescript
// Source: Beat the Chaser TV show format + Phase 24 CONTEXT.md decisions
// https://en.wikipedia.org/wiki/Beat_the_Chasers

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  timeRatio: number;      // Chaser time as % of contestant time
  aiAccuracyRange: [number, number];  // Min/max accuracy percentage
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    timeRatio: 0.80,        // Chaser gets 80% of contestant's time
    aiAccuracyRange: [0.50, 0.60]  // 50-60% accuracy
  },
  medium: {
    timeRatio: 1.00,        // Equal time
    aiAccuracyRange: [0.70, 0.80]  // 70-80% accuracy
  },
  hard: {
    timeRatio: 1.20,        // Chaser gets 120% (extra time)
    aiAccuracyRange: [0.85, 0.95]  // 85-95% accuracy
  }
};

function calculateChaserTime(contestantTime: number, difficulty: Difficulty): number {
  const config = DIFFICULTY_CONFIG[difficulty];
  return Math.floor(contestantTime * config.timeRatio);
}

function getChaserAccuracy(difficulty: Difficulty): number {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [min, max] = config.aiAccuracyRange;
  // Random accuracy within range
  return min + Math.random() * (max - min);
}

// Usage in game setup
const contestantTime = 60;  // From Cash Builder
const difficulty = 'medium';
const chaserTime = calculateChaserTime(contestantTime, difficulty);  // 60s
const chaserAccuracy = getChaserAccuracy(difficulty);  // 70-80%

console.log(`Contestant: ${contestantTime}s | Chaser: ${chaserTime}s | AI: ${(chaserAccuracy * 100).toFixed(0)}%`);
// Output: "Contestant: 60s | Chaser: 60s | AI: 75%"
```

### Pattern 5: Turn-Based Question Flow (Both Answer Same Question)
**What:** Contestant answers first, then chaser answers the same question sequentially
**When to use:** Timed Battle phase for every question
**Example:**
```typescript
// Source: Beat the Chaser TV show rules - both sides answer same question
// Phase 24 CONTEXT.md: "Both players answer the same question — contestant first, then chaser"

type TurnPhase = 'contestant-answering' | 'contestant-feedback' | 'chaser-thinking' | 'chaser-feedback';

interface QuestionTurnState {
  turnPhase: TurnPhase;
  contestantAnswer: number | null;
  chaserAnswer: number | null;
  isContestantCorrect: boolean | null;
  isChaserCorrect: boolean | null;
}

function QuestionTurn({ question, onTurnComplete }: QuestionTurnProps) {
  const [turnState, setTurnState] = useState<QuestionTurnState>({
    turnPhase: 'contestant-answering',
    contestantAnswer: null,
    chaserAnswer: null,
    isContestantCorrect: null,
    isChaserCorrect: null
  });

  const { getChaserAnswer, isThinking } = useChaserAI({ difficulty: 'medium' });

  // Step 1: Contestant answers
  const handleContestantAnswer = async (selectedIndex: number) => {
    const isCorrect = selectedIndex === question.correctAnswerIndex;

    setTurnState(prev => ({
      ...prev,
      turnPhase: 'contestant-feedback',
      contestantAnswer: selectedIndex,
      isContestantCorrect: isCorrect
    }));

    // Brief feedback (800ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Move to chaser's turn
    setTurnState(prev => ({ ...prev, turnPhase: 'chaser-thinking' }));

    // Step 2: Chaser thinks and answers (1500ms delay)
    const chaserIndex = await getChaserAnswer(question);
    const chaserCorrect = chaserIndex === question.correctAnswerIndex;

    setTurnState(prev => ({
      ...prev,
      turnPhase: 'chaser-feedback',
      chaserAnswer: chaserIndex,
      isChaserCorrect: chaserCorrect
    }));

    // Show chaser result (1500ms)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Turn complete - pass results to parent
    onTurnComplete({
      contestantCorrect: isCorrect,
      chaserCorrect
    });
  };

  // Render based on turn phase
  switch (turnState.turnPhase) {
    case 'contestant-answering':
      return (
        <QuestionDisplay
          question={question}
          onAnswer={handleContestantAnswer}
          playerLabel="Your Turn"
        />
      );

    case 'contestant-feedback':
      return (
        <AnswerFeedback
          isCorrect={turnState.isContestantCorrect!}
          correctAnswer={question.options[question.correctAnswerIndex]}
        />
      );

    case 'chaser-thinking':
      return (
        <ChaserThinking message="Chaser is thinking..." />
      );

    case 'chaser-feedback':
      return (
        <AnswerFeedback
          isCorrect={turnState.isChaserCorrect!}
          correctAnswer={question.options[question.correctAnswerIndex]}
          playerLabel="Chaser"
        />
      );
  }
}
```

### Anti-Patterns to Avoid

**Anti-pattern 1: Both timers running simultaneously**
- Don't let both timers count down at the same time
- DO pause the inactive player's timer and only run the active player's timer

**Anti-pattern 2: Time penalty for wrong answers**
- Don't subtract time from the clock for incorrect answers
- DO simply switch turns (wrong answer only means you lose control)

**Anti-pattern 3: Separate questions for contestant and chaser**
- Don't show different questions to each player
- DO show the same question to both players sequentially (contestant first, then chaser)

**Anti-pattern 4: Time bonus on contestant's turn**
- Don't give time bonus when contestant answers correctly during their own turn
- DO only give time bonus when contestant answers correctly during chaser's turn (catch-up mechanic)

**Anti-pattern 5: Grace period when timer hits zero**
- Don't allow answers after timer expires
- DO immediately trigger loss condition when either timer reaches 0

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown timer logic | Custom timer state management | useTimer hook from Phase 23 | Already built, tested, supports pause/resume |
| AI opponent behavior | Custom weighted randomness | useChaserAI from Phase 23 | Already implements accuracy-based answering |
| Floating text animation | JavaScript position updates | CSS @keyframes with translateY | GPU-accelerated, smoother, less code |
| Phase state management | Complex FSM library | useState for linear flow | Only 3 phases, sequential, useState sufficient |
| Timer synchronization | Custom interval coordination | Pause/start methods on useTimer | Built-in control, prevents race conditions |

**Key insight:** Beat the Chaser appears complex with dual timers and turn-based mechanics, but it's actually simpler than The Chase (Phase 23). No game board positioning, no voting system, no multi-phase complexity. Just two independent timers with conditional running controlled by turn state. Reuse existing hooks and patterns.

## Common Pitfalls

### Pitfall 1: Both Timers Running When Turn Switches
**What goes wrong:** Timer doesn't pause when switching turns, causing both timers to run briefly
**Why it happens:** Async turn switching without explicit pause before state change
**How to avoid:** Always pause active timer before switching turn state, then start next timer
**Warning signs:** Timers desync, both show countdown, faster than expected time loss

```typescript
// BAD - no explicit pause
const switchToChaser = () => {
  setActivePlayer('chaser');  // Timer still running
  chaserTimer.start();  // Now both running briefly
};

// GOOD - pause before switch
const switchToChaser = () => {
  contestantTimer.pause();  // ✓ Stop current
  setActivePlayer('chaser');
  chaserTimer.start();  // ✓ Then start next
};
```

### Pitfall 2: Time Bonus Mutation Without Reset
**What goes wrong:** Adding time bonus doesn't trigger timer update, continues counting down
**Why it happens:** Modifying timer state without using reset method
**How to avoid:** Use timer.reset(newTime) method to update remaining time
**Warning signs:** Time bonus shows visually but doesn't actually add time, timer continues from old value

```typescript
// BAD - direct state mutation
const addTimeBonus = () => {
  contestantTimer.timeRemaining += 5;  // Doesn't work - not reactive
};

// GOOD - use reset method
const addTimeBonus = () => {
  const newTime = contestantTimer.timeRemaining + 5;
  contestantTimer.reset(newTime);  // ✓ Updates timer properly
  // Timer stays paused if it was paused, maintains running state if running
};
```

### Pitfall 3: Instant Loss Not Detected (Timer Hits 0 During Pause)
**What goes wrong:** Timer reaches 0 while paused, loss condition never triggers
**Why it happens:** Only checking onComplete callback, which doesn't fire for paused timers
**How to avoid:** Check timer value explicitly before resuming, handle zero case immediately
**Warning signs:** Game freezes at 0s, no winner declared, UI stuck

```typescript
// BAD - assume timer will fire onComplete
const resumeTimer = () => {
  contestantTimer.start();  // If timeRemaining is 0, nothing happens
};

// GOOD - check before resuming
const resumeTimer = () => {
  if (contestantTimer.timeRemaining <= 0) {
    // Instant loss
    onGameComplete('loss');
    return;
  }
  contestantTimer.start();
};
```

### Pitfall 4: Chaser Time Calculation Integer Overflow
**What goes wrong:** Difficulty ratio produces fractional seconds (e.g., 0.8 × 65 = 52.0), inconsistent rounding
**Why it happens:** Not using Math.floor() or Math.round() on time calculations
**How to avoid:** Always use Math.floor() for time calculations to prevent fractional seconds
**Warning signs:** Timer shows decimal seconds in UI, timer displays inconsistent values

```typescript
// BAD - fractional seconds
const chaserTime = contestantTime * 0.8;  // 65 * 0.8 = 52.0 (might display as 52.00000001)

// GOOD - integer seconds
const chaserTime = Math.floor(contestantTime * 0.8);  // ✓ Always whole seconds
```

### Pitfall 5: Animation Blocking Turn Progression
**What goes wrong:** "+5s" time bonus animation blocks next question, game feels sluggish
**Why it happens:** Awaiting animation completion before continuing game flow
**How to avoid:** Fire animation non-blocking, don't await completion
**Warning signs:** 1.5 second delay after every time bonus, players complain game is slow

```typescript
// BAD - blocking animation
const addTimeBonus = async () => {
  setShowBonus(true);
  await new Promise(resolve => setTimeout(resolve, 1500));  // Blocks
  setShowBonus(false);
  nextQuestion();  // Delayed by animation
};

// GOOD - non-blocking animation
const addTimeBonus = () => {
  // Fire and forget - animation manages itself
  setShowBonus(true);

  // Continue immediately
  nextQuestion();  // ✓ No delay
};

// Animation component handles its own lifecycle
function TimeBonusEffect({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return show ? <div className="animate-float-up">+5s</div> : null;
}
```

### Pitfall 6: Cash Builder Time Cap Not Enforced
**What goes wrong:** Contestant accumulates excessive time (100+ seconds), makes game too easy
**Why it happens:** No maximum time limit on Cash Builder accumulation
**How to avoid:** Enforce reasonable cap (e.g., 60 seconds) or limit question count
**Warning signs:** Games always won by contestant, no tension, chaser has no chance

```typescript
// BAD - unlimited accumulation
const handleCorrectAnswer = () => {
  setAccumulatedTime(prev => prev + 5);  // No limit
};

// GOOD - enforce maximum
const MAX_TIME = 60;  // Phase 24 CONTEXT.md: Claude's discretion

const handleCorrectAnswer = () => {
  setAccumulatedTime(prev => Math.min(prev + 5, MAX_TIME));  // ✓ Capped at 60s
};

// ALTERNATIVE - limit question count
const CASH_BUILDER_QUESTIONS = 10;  // Max 50s if all correct (10 × 5s)
```

## Code Examples

Verified patterns from research and existing codebase:

### Example 1: BeatTheChaserState Type Definition
```typescript
// Source: types.ts (already defined in codebase)
// Extended with phase-specific fields

type BeatTheChaserPhase = 'cash-builder' | 'timed-battle' | 'game-over';

interface BeatTheChaserState extends BaseGameState {
  gameType: 'beat-the-chaser';
  phase: BeatTheChaserPhase;

  // Cash Builder state
  cashBuilderQuestionsAnswered: number;
  cashBuilderCorrectAnswers: number;
  accumulatedTime: number;  // Seconds earned (5s per correct)

  // Timed Battle state
  contestantTime: number;   // Countdown timer in seconds
  chaserTime: number;       // Countdown timer in seconds
  activePlayer: 'contestant' | 'chaser';

  // Difficulty configuration
  chaserDifficulty: 'easy' | 'medium' | 'hard';
  isAIControlled: boolean;

  // Current question state
  currentQuestionIndex: number;
  contestantAnswer: number | null;
  chaserAnswer: number | null;
  showingTimeBonusEffect: boolean;

  // Outcome
  winner: 'contestant' | 'chaser' | null;
}
```

### Example 2: Dual Timer Display Component
```typescript
// Source: Phase 24 CONTEXT.md visual specifications
// "Dual timers side by side — contestant on left, chaser on right"
// "Active player's timer glows/pulses, inactive timer is dimmed"
// "Urgency styling: red pulse when under 10 seconds"

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

  const getTimerClasses = (
    time: number,
    isActive: boolean
  ) => {
    const base = "flex-1 p-8 rounded-3xl transition-all duration-300";
    const urgent = isUrgent(time) ? "bg-red-600 animate-pulse" : "";
    const active = isActive ? "ring-4 ring-yellow-400 scale-105" : "opacity-60";

    return `${base} ${urgent || 'bg-slate-700'} ${active}`;
  };

  return (
    <div className="flex gap-6 w-full max-w-4xl mx-auto mb-8">
      {/* Contestant Timer */}
      <div className={getTimerClasses(contestantTime, activePlayer === 'contestant')}>
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider text-slate-300 mb-2">
            Contestant
          </div>
          <div className="text-7xl font-black text-white">
            {formatTime(contestantTime)}
          </div>
          {activePlayer === 'contestant' && (
            <div className="mt-2 text-sm font-bold text-yellow-400 animate-bounce">
              YOUR TURN
            </div>
          )}
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center">
        <div className="text-4xl font-black text-slate-500">VS</div>
      </div>

      {/* Chaser Timer */}
      <div className={getTimerClasses(chaserTime, activePlayer === 'chaser')}>
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider text-slate-300 mb-2">
            Chaser
          </div>
          <div className="text-7xl font-black text-white">
            {formatTime(chaserTime)}
          </div>
          {activePlayer === 'chaser' && (
            <div className="mt-2 text-sm font-bold text-red-400 animate-bounce">
              CHASER'S TURN
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Example 3: Complete Timed Battle Flow
```typescript
// Source: Beat the Chaser TV show format + Phase 24 CONTEXT.md decisions
// Demonstrates complete turn cycle: contestant answers → chaser answers → next question

interface TimedBattlePhaseProps {
  contestantStartTime: number;
  chaserStartTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  onComplete: (winner: 'contestant' | 'chaser') => void;
}

function TimedBattlePhase({
  contestantStartTime,
  chaserStartTime,
  difficulty,
  questions,
  onComplete
}: TimedBattlePhaseProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activePlayer, setActivePlayer] = useState<'contestant' | 'chaser'>('contestant');
  const [showTimeBonus, setShowTimeBonus] = useState(false);

  // Dual independent timers
  const contestantTimer = useTimer({
    initialSeconds: contestantStartTime,
    autoStart: false,
    onComplete: () => onComplete('chaser')  // Contestant timer expired = loss
  });

  const chaserTimer = useTimer({
    initialSeconds: chaserStartTime,
    autoStart: false,
    onComplete: () => onComplete('contestant')  // Chaser timer expired = win
  });

  const { getChaserAnswer, isThinking } = useChaserAI({ difficulty });

  // Start contestant's timer on mount
  useEffect(() => {
    contestantTimer.start();
  }, []);

  // Control timers based on active player
  useEffect(() => {
    if (activePlayer === 'contestant') {
      contestantTimer.start();
      chaserTimer.pause();
    } else {
      chaserTimer.start();
      contestantTimer.pause();
    }
  }, [activePlayer]);

  const currentQuestion = questions[currentQuestionIndex];

  // Complete turn cycle
  const handleAnswer = async (selectedIndex: number) => {
    if (activePlayer === 'contestant') {
      // Step 1: Contestant answers
      contestantTimer.pause();
      const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

      await showFeedback(isCorrect ? 'correct' : 'incorrect', 800);

      // Switch to chaser regardless of answer
      setActivePlayer('chaser');

      // Step 2: Chaser's turn
      await new Promise(resolve => setTimeout(resolve, 500));
      const chaserIndex = await getChaserAnswer(currentQuestion);
      const chaserCorrect = chaserIndex === currentQuestion.correctAnswerIndex;

      chaserTimer.pause();
      await showFeedback(chaserCorrect ? 'correct' : 'incorrect', 800);

      // Step 3: Time bonus if chaser wrong
      if (!chaserCorrect) {
        const newTime = contestantTimer.timeRemaining + 5;
        contestantTimer.reset(newTime);
        setShowTimeBonus(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setShowTimeBonus(false);
      }

      // Step 4: Next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setActivePlayer('contestant');  // Reset to contestant's turn
      } else {
        // Out of questions - compare timers
        const winner = contestantTimer.timeRemaining > chaserTimer.timeRemaining
          ? 'contestant'
          : 'chaser';
        onComplete(winner);
      }
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 p-8">
      <DualTimerDisplay
        contestantTime={contestantTimer.timeRemaining}
        chaserTime={chaserTimer.timeRemaining}
        activePlayer={activePlayer}
      />

      {showTimeBonus && <TimeBonusEffect show={true} amount="+5s" />}

      {isThinking ? (
        <ChaserThinking />
      ) : (
        <QuestionDisplay
          question={currentQuestion}
          onAnswer={handleAnswer}
          disabled={activePlayer === 'chaser'}  // Disable during chaser's turn
        />
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single timer with pause logic | Dual independent timers | Beat the Chaser format (2020) | Clearer separation, simpler logic, no shared state |
| Complex time tracking with Date.now() | setInterval with 1-second ticks | 2024-2025 | Simpler code, adequate precision for game show format |
| JavaScript animations for floating text | CSS @keyframes with translateY | 2025-2026 | GPU-accelerated, smoother, no JS performance cost |
| Separate questions per player | Same question for both players | Beat the Chaser rules | Fairer gameplay, easier to implement, less content needed |
| Global state management (Redux) | Local useState for phase flow | React 19 patterns | Simpler for linear 3-phase flow, less boilerplate |

**Deprecated/outdated:**
- **Shared timer state:** Old approach tried to manage one timer with complex pause logic; dual timers are clearer
- **Time penalties for wrong answers:** TV show doesn't penalize time for incorrect answers, only loses turn
- **requestAnimationFrame for timers:** Overkill for 1-second tick intervals; setInterval is standard and sufficient
- **Synchronized answer reveals:** TV show is sequential (contestant first, then chaser), not simultaneous

## Open Questions

Things that couldn't be fully resolved:

1. **Maximum time cap on contestant's clock**
   - What we know: Cash Builder gives 5s per correct answer, no explicit cap in TV show format
   - What's unclear: Should there be a maximum (e.g., 60s, 90s) to prevent runaway accumulation?
   - Recommendation: Phase 24 CONTEXT.md marks as "Claude's Discretion" - implement 60s cap for balanced gameplay (12 correct answers max)

2. **Cash Builder question count**
   - What we know: TV show typically uses 5 questions in Cash Builder
   - What's unclear: Should classroom version use 5, 10, or variable count?
   - Recommendation: CONTEXT.md suggests 10-12 questions - use 10 questions (max 50s if all correct, reasonable game length)

3. **Chaser AI thinking delay**
   - What we know: Phase 23 uses 1500ms default thinking delay for drama
   - What's unclear: Should Beat the Chaser use same delay, or shorter for faster pace?
   - Recommendation: Use 1000ms (1 second) - faster pace matches timer-based tension, still provides "thinking" feedback

4. **Exact animation timings**
   - What we know: Time bonus needs "+5s" floating animation
   - What's unclear: Duration (1000ms vs 1500ms), easing curve (ease-out vs ease-in-out)
   - Recommendation: Use 1200ms with ease-out - quick enough to not block gameplay, long enough to be satisfying

5. **Out of questions scenario**
   - What we know: Both timers still running, questions exhausted
   - What's unclear: Compare remaining time? Continue with new questions? Declare winner based on current time?
   - Recommendation: Generate sufficient questions (20+) to ensure one timer expires first; fallback: compare remaining time if questions exhausted

## Sources

### Primary (HIGH confidence)
- [Beat the Chasers - Wikipedia](https://en.wikipedia.org/wiki/Beat_the_Chasers) - Official TV show format and rules
- [Beat the Chasers - Game Shows Wiki](https://gameshows.fandom.com/wiki/The_Chase) - Detailed game mechanics
- Existing codebase: useTimer hook (`hooks/useTimer.ts`), TheChaseGame patterns, BeatTheChaserState type definition
- Phase 24 CONTEXT.md - User decisions on timer mechanics, turn flow, difficulty scaling

### Secondary (MEDIUM confidence)
- [React useReducer vs useState - react.wiki](https://react.wiki/hooks/use-reducer-vs-use-state/) - State management patterns
- [CSS Fade In Up Effect - TutorialsPoint](https://www.tutorialspoint.com/css/css_animation_fade_in_up.htm) - Keyframe animation patterns
- [An Interactive Guide to CSS Keyframe Animations - Josh W. Comeau](https://www.joshwcomeau.com/animation/keyframe-animations/) - Animation best practices
- [CSS Floating Animation - GeeksforGeeks](https://www.geeksforgeeks.org/css/css-floating-animation/) - Floating text effects (July 2025)
- [Timekeeping in Games - Wikipedia](https://en.wikipedia.org/wiki/Turns,_rounds_and_time-keeping_systems_in_games) - Turn-based timer mechanics

### Tertiary (LOW confidence)
- [Best React countdown timer libraries - Croct Blog](https://blog.croct.com/post/best-react-countdown-timer-libraries) - Timer library comparison
- [React Animation Libraries 2026 - Syncfusion](https://www.syncfusion.com/blogs/post/top-react-animation-libraries) - Animation library overview
- [requestAnimationFrame vs setTimeout - OpenReplay](https://blog.openreplay.com/requestanimationframe-settimeout-use/) - Timer implementation comparison
- [State Management in 2026 - Nucamp](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - General state management trends

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero new dependencies, reuses Phase 23 infrastructure (useTimer, useChaserAI, BroadcastChannel)
- Architecture: HIGH - Simpler than Phase 23 (3 phases vs 4, no board, no voting), patterns verified in codebase
- Game mechanics: HIGH - TV show format well-documented, CONTEXT.md provides specific implementation decisions
- Timer implementation: HIGH - Existing useTimer hook with pause/resume already built and tested in Phase 23
- Dual timer control: HIGH - Pattern straightforward (conditional start/pause based on activePlayer state)
- AI opponent: HIGH - Reuse Phase 23 useChaserAI, adjust accuracy ranges per CONTEXT.md (50-95% vs 60-90%)
- CSS animations: MEDIUM - Standard keyframe patterns, but specific timing/easing needs testing
- Turn flow: HIGH - Sequential answering (contestant → chaser) simpler than simultaneous reveal

**Research date:** 2026-01-24
**Valid until:** 30 days (stable technologies, React patterns established, TV show format unchanged)
