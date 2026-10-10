import crypto from 'crypto';

/**
 * Generates an unbiased random integer in the range [0, maxExclusive)
 * using Node.js crypto module to eliminate modulo bias.
 */
export const getSecureRandomIndex = (maxExclusive) => {
  if (maxExclusive <= 0) {
    throw new Error('maxExclusive must be greater than 0');
  }
  return crypto.randomInt(0, maxExclusive);
};

/**
 * Selects an unbiased single item from an array with replacement.
 */
export const pickRandomItem = (items) => {
  if (!items || items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  const index = getSecureRandomIndex(items.length);
  return items[index];
};

/**
 * Fisher-Yates (Knuth) Shuffle algorithm using cryptographic randomness
 * Guarantees all permutations are equally probable.
 */
export const shuffleArray = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
