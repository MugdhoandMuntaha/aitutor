/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * @param quality Rating from 0 to 5 (0: complete blackout, 5: perfect response)
 * @param repetitions Number of consecutive successful recalls
 * @param previousInterval Interval in days from the previous review
 * @param previousEaseFactor Current ease factor (default 2.5)
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number
): {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: Date;
} {
  let nextRepetitions = repetitions;
  let nextInterval = previousInterval;
  let nextEaseFactor = previousEaseFactor;

  if (quality >= 3) {
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(previousInterval * previousEaseFactor);
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    nextInterval = 1;
  }

  // EF calculation: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  nextEaseFactor =
    previousEaseFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor minimum bound is 1.3
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    interval: nextInterval,
    repetitions: nextRepetitions,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    nextReviewDate,
  };
}
