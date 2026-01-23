export type BeatTheChaserDifficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  chaserTime: number;               // Chaser's starting time in seconds
  aiAccuracyRange: [number, number]; // Min/max accuracy percentage
  label: string;                    // Display label
  chaserLabel: string;              // How to describe the chaser
  description: string;              // Help text for students
}

// Fixed contestant starting time
export const CONTESTANT_START_TIME = 45;  // 45 seconds for all difficulties

export const BEAT_THE_CHASER_DIFFICULTY: Record<BeatTheChaserDifficulty, DifficultyConfig> = {
  easy: {
    chaserTime: 55,                   // Dim chaser demands more time
    aiAccuracyRange: [0.50, 0.60],    // 50-60% accuracy - makes lots of mistakes
    label: 'Easy',
    chaserLabel: 'The Dim Chaser',
    description: 'Not very bright - needs 55 seconds and makes lots of mistakes'
  },
  medium: {
    chaserTime: 45,                   // Average chaser takes equal time
    aiAccuracyRange: [0.70, 0.80],    // 70-80% accuracy
    label: 'Medium',
    chaserLabel: 'The Average Chaser',
    description: 'Fairly clever - takes 45 seconds with decent accuracy'
  },
  hard: {
    chaserTime: 35,                   // Genius chaser is confident, takes less time
    aiAccuracyRange: [0.85, 0.95],    // 85-95% accuracy - rarely wrong
    label: 'Hard',
    chaserLabel: 'The Genius Chaser',
    description: 'Super smart - only needs 35 seconds and rarely wrong'
  }
};

// Game constants
export const TIME_BONUS_AMOUNT = 5;           // Seconds added when chaser gets wrong answer

// Chaser thinking time by difficulty (in ms)
// Dim chaser thinks slowly, genius thinks fast
export const CHASER_THINKING_TIME: Record<BeatTheChaserDifficulty, { min: number; max: number }> = {
  easy: { min: 4000, max: 7000 },    // 4-7 seconds - slow thinker
  medium: { min: 3000, max: 5000 },  // 3-5 seconds - moderate
  hard: { min: 2000, max: 4000 }     // 2-4 seconds - quick thinker
};

// Helper to get random thinking time for given difficulty
export function getChaserThinkingTime(difficulty: BeatTheChaserDifficulty): number {
  const { min, max } = CHASER_THINKING_TIME[difficulty];
  return min + Math.random() * (max - min);
}

// Helper function to get random AI accuracy within range
export function getChaserAccuracy(difficulty: BeatTheChaserDifficulty): number {
  const config = BEAT_THE_CHASER_DIFFICULTY[difficulty];
  const [min, max] = config.aiAccuracyRange;
  return min + Math.random() * (max - min);
}
