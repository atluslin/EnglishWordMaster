import React, { useState, useEffect } from 'react';
import useSpeech from '../hooks/useSpeech';
import { generateLetterPuzzle, getHint, checkAnswer } from '../utils/wordHelpers';

/**
 * LetterPuzzle Component - Mode 3: Fill in the missing letters
 */
const LetterPuzzle = ({ words: initialWords, onComplete }) => {
  const [words, setWords] = useState(initialWords.map(w => ({ ...w, retryCount: 0 })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [puzzle, setPuzzle] = useState('');
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [results, setResults] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const { speak } = useSpeech();

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      const puzzleWord = generateLetterPuzzle(currentWord.word);
      setPuzzle(puzzleWord);
      setHintsUsed(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handlePlaySound = () => {
    if (currentWord) {
      speak(currentWord.word, 'en-US', 0.7);
    }
  };

  const handleHint = () => {
    const newPuzzle = getHint(puzzle, currentWord.word);
    setPuzzle(newPuzzle);
    setHintsUsed(hintsUsed + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);
    setShowAnswer(true);

    // Record result
    setResults([...results, {
      word: currentWord.word,
      correct: correct,
      userAnswer: userInput,
      hintsUsed: hintsUsed
    }]);
  };

  const handleNext = () => {
    // If answer was wrong and hasn't been retried yet, insert it again later
    if (!isCorrect && currentWord.retryCount === 0) {
      const insertPosition = Math.min(currentIndex + 3, words.length);
      const updatedWords = [...words];
      updatedWords.splice(insertPosition, 0, { ...currentWord, retryCount: 1 });
      setWords(updatedWords);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setShowAnswer(false);
      setIsCorrect(null);
    } else {
      // All words completed
      if (onComplete) {
        onComplete(results);
      }
    }
  };

  const handleSkip = () => {
    setResults([...results, {
      word: currentWord.word,
      correct: false,
      userAnswer: userInput || '(skipped)',
      hintsUsed: hintsUsed
    }]);
    handleNext();
  };

  if (!currentWord) {
    return <div className="loading">加载中...</div>;
  }

  const progress = Math.round(((currentIndex + 1) / words.length) * 100);
  const hasMoreHints = puzzle.includes('_');

  return (
    <div className="letter-puzzle-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">{currentIndex + 1} / {words.length}</span>
      </div>

      <div className="game-content">
        <h2>字母填空</h2>
        <p className="instruction">根据提示填写完整的单词</p>

        <div className="puzzle-display">
          <h3 className="puzzle-word">{puzzle}</h3>
          <p className="meaning-hint">中文提示: {currentWord.meaning}</p>
          <p className="phonetic-hint">音标: {currentWord.phonetic}</p>
        </div>

        <div className="hint-controls">
          <button
            className="btn btn-hint"
            onClick={handlePlaySound}
          >
            🔊 听发音
          </button>
          <button
            className="btn btn-hint"
            onClick={handleHint}
            disabled={!hasMoreHints || showAnswer}
          >
            💡 提示 ({hintsUsed} 次)
          </button>
        </div>

        {!showAnswer ? (
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入完整的单词"
              className="word-input"
              autoFocus
              autoComplete="off"
            />
            <div className="button-group">
              <button type="submit" className="btn btn-success" disabled={!userInput.trim()}>
                提交
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSkip}>
                跳过
              </button>
            </div>
          </form>
        ) : (
          <div className="answer-section">
            <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <div className="result-correct">
                  <h3>✓ 正确！</h3>
                  {hintsUsed > 0 && <p>使用了 {hintsUsed} 次提示</p>}
                </div>
              ) : (
                <div className="result-incorrect">
                  <h3>✗ 错误</h3>
                  <p>你的答案: <strong>{userInput}</strong></p>
                </div>
              )}
            </div>

            <div className="word-details">
              <h3 className="word">{currentWord.word}</h3>
              <p className="phonetic">{currentWord.phonetic}</p>
              <p className="meaning">中文: {currentWord.meaning}</p>
              <p className="example">例句: {currentWord.exampleSentence}</p>
            </div>

            <button className="btn btn-primary" onClick={handleNext}>
              {currentIndex < words.length - 1 ? '下一个' : '完成'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LetterPuzzle;
