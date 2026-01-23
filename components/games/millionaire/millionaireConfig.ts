export interface MoneyTreeConfig {
  questionCount: 3 | 5 | 10;
  prizes: number[];
  safeHavens: number[]; // Question indices (0-based)
}

export const MONEY_TREE_CONFIGS: Record<3 | 5 | 10, MoneyTreeConfig> = {
  3: {
    questionCount: 3,
    prizes: [500, 2000, 10000],
    safeHavens: [2], // Question 3 is safe haven
  },
  5: {
    questionCount: 5,
    prizes: [200, 500, 1000, 5000, 25000],
    safeHavens: [2, 4], // Questions 3 and 5 are safe havens
  },
  10: {
    questionCount: 10,
    prizes: [100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000],
    safeHavens: [4, 9], // Questions 5 and 10 are safe havens
  },
};

export const getSafeHavenAmount = (
  currentQuestionIndex: number,
  config: MoneyTreeConfig
): number => {
  const passedSafeHavens = config.safeHavens.filter(sh => sh < currentQuestionIndex);
  if (passedSafeHavens.length === 0) return 0;
  const lastSafeHaven = Math.max(...passedSafeHavens);
  return config.prizes[lastSafeHaven];
};
