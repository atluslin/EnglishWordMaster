/**
 * Utility functions for word processing and game logic
 */

/**
 * Check if the user's answer matches the correct word
 * @param {string} userAnswer - User's input
 * @param {string} correctWord - The correct word
 * @returns {boolean} - True if match
 */
export const checkAnswer = (userAnswer, correctWord) => {
  return userAnswer.trim().toLowerCase() === correctWord.trim().toLowerCase();
};

/**
 * Generate a word with some letters hidden for the letter puzzle mode
 * @param {string} word - The word to process
 * @returns {string} - Word with some letters replaced by underscores
 */
export const generateLetterPuzzle = (word) => {
  if (word.length <= 3) {
    // For short words, hide only 1 letter
    const hiddenIndex = Math.floor(word.length / 2);
    return word.split('').map((char, index) =>
      index === hiddenIndex ? '_' : char
    ).join('');
  } else if (word.length <= 6) {
    // For medium words, hide every other letter starting from index 1
    return word.split('').map((char, index) =>
      index % 2 === 1 ? '_' : char
    ).join('');
  } else {
    // For long words, hide about 40% of letters
    return word.split('').map((char, index) =>
      index % 3 === 1 || index % 5 === 2 ? '_' : char
    ).join('');
  }
};

/**
 * Get a hint for the letter puzzle (show one more letter)
 * @param {string} currentPuzzle - Current puzzle state
 * @param {string} correctWord - The correct word
 * @returns {string} - Puzzle with one more letter revealed
 */
export const getHint = (currentPuzzle, correctWord) => {
  const puzzleArray = currentPuzzle.split('');
  const hiddenIndices = [];

  puzzleArray.forEach((char, index) => {
    if (char === '_') {
      hiddenIndices.push(index);
    }
  });

  if (hiddenIndices.length === 0) {
    return currentPuzzle;
  }

  // Reveal a random hidden letter
  const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
  puzzleArray[randomIndex] = correctWord[randomIndex];

  return puzzleArray.join('');
};

/**
 * Shuffle an array (for creating wrong answer options)
 * @param {Array} array - The array to shuffle
 * @returns {Array} - Shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate wrong options for fill-in-the-blank mode
 * @param {Array} allWords - All available words
 * @param {string} correctWord - The correct word
 * @param {number} count - Number of wrong options to generate
 * @returns {Array} - Array of wrong options
 */
export const generateWrongOptions = (allWords, correctWord, count = 3) => {
  const wrongOptions = allWords
    .filter(w => w.word !== correctWord)
    .map(w => w.word);

  return shuffleArray(wrongOptions).slice(0, count);
};

/**
 * Create a sentence with a blank
 * @param {string} sentence - The original sentence
 * @param {string} word - The word to hide
 * @returns {string} - Sentence with the word replaced by blank
 */
export const createBlankSentence = (sentence, word) => {
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  return sentence.replace(regex, '______');
};

/**
 * Select random words from a list
 * @param {Array} words - Array of word objects
 * @param {number} count - Number of words to select
 * @returns {Array} - Randomly selected words
 */
export const selectRandomWords = (words, count) => {
  return shuffleArray(words).slice(0, count);
};

/**
 * Filter words by unit
 * @param {Array} words - Array of word objects
 * @param {number} unit - Unit number
 * @returns {Array} - Filtered words
 */
export const filterWordsByUnit = (words, unit) => {
  return words.filter(w => w.unit === unit);
};

/**
 * Calculate learning statistics
 * @param {Array} results - Array of {word, correct, hintsUsed, timeout} objects
 * @returns {Object} - Statistics object
 */
export const calculateStats = (results) => {
  const total = results.length;

  // 使用了提示的题目数量
  const withHints = results.filter(r => r.hintsUsed && r.hintsUsed > 0).length;

  // 超时的题目数量
  const timeoutCount = results.filter(r => r.timeout).length;

  // 总提示使用次数
  const totalHintsUsed = results.reduce((sum, r) => sum + (r.hintsUsed || 0), 0);

  // 不使用提示且正确的题目数量（用于计算准确率）
  const correctWithoutHints = results.filter(r => r.correct && (!r.hintsUsed || r.hintsUsed === 0)).length;

  // 所有正确的题目数量（包括使用提示的）
  const allCorrect = results.filter(r => r.correct).length;

  // 没有使用提示的题目数量（用于计算准确率的基数）
  const withoutHints = results.filter(r => !r.hintsUsed || r.hintsUsed === 0).length;

  // 准确率只计算没有使用提示的题目
  const accuracy = withoutHints > 0 ? Math.round((correctWithoutHints / withoutHints) * 100) : 0;

  return {
    total,
    correct: allCorrect,
    incorrect: total - allCorrect,
    accuracy,
    withHints,
    withoutHints,
    correctWithoutHints,
    totalHintsUsed,
    timeoutCount
  };
};
