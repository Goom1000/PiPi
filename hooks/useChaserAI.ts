import { useState, useCallback } from 'react';
import { QuizQuestion } from '../services/geminiService';

type ChaserDifficulty = 'easy' | 'medium' | 'hard';

const CHASER_ACCURACY: Record<ChaserDifficulty, number> = {
  easy: 0.60,    // 60% correct
  medium: 0.75,  // 75% correct
  hard: 0.90     // 90% correct
};

interface ChaserAIConfig {
  difficulty: ChaserDifficulty;
  thinkingDelayMs?: number;  // Default 1500ms
}

interface ChaserAIResult {
  getChaserAnswer: (question: QuizQuestion) => Promise<number>;
  isThinking: boolean;
}

export function useChaserAI({
  difficulty,
  thinkingDelayMs = 1500
}: ChaserAIConfig): ChaserAIResult {
  const [isThinking, setIsThinking] = useState(false);

  const getChaserAnswer = useCallback(async (question: QuizQuestion): Promise<number> => {
    // Start thinking phase
    setIsThinking(true);

    // Simulate thinking delay for dramatic effect
    await new Promise(resolve => setTimeout(resolve, thinkingDelayMs));

    setIsThinking(false);

    // Determine if chaser answers correctly based on difficulty
    const accuracy = CHASER_ACCURACY[difficulty];
    const shouldAnswerCorrectly = Math.random() < accuracy;

    if (shouldAnswerCorrectly) {
      return question.correctAnswerIndex;
    } else {
      // Pick a random wrong answer
      const wrongIndices = [0, 1, 2, 3].filter(
        i => i !== question.correctAnswerIndex
      );
      return wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    }
  }, [difficulty, thinkingDelayMs]);

  return { getChaserAnswer, isThinking };
}

// Export accuracy constants for display in UI if needed
export { CHASER_ACCURACY };
export type { ChaserDifficulty };
