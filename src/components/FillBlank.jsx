import React, { useState, useEffect } from 'react';
import { createBlankSentence, generateWrongOptions, shuffleArray, checkAnswer } from '../utils/wordHelpers';

/**
 * FillBlank Component - Mode 2: Fill in the blank in a sentence
 */
const FillBlank = ({ words: initialWords, onComplete }) => {
  const [words, setWords] = useState(initialWords.map(w => ({ ...w, retryCount: 0 })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [results, setResults] = useState([]);
  const [options, setOptions] = useState([]);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      // Generate options: correct word + 3 wrong options
      const wrongOpts = generateWrongOptions(words, currentWord.word, 3);
      const allOptions = shuffleArray([currentWord.word, ...wrongOpts]);
      setOptions(allOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, words]);

  const handleSelectOption = (option) => {
    if (showAnswer) return; // Prevent changing after submission
    setSelectedAnswer(option);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const correct = checkAnswer(selectedAnswer, currentWord.word);
    setIsCorrect(correct);
    setShowAnswer(true);

    // Record result
    setResults([...results, {
      word: currentWord.word,
      correct: correct,
      userAnswer: selectedAnswer
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
      setSelectedAnswer('');
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
      userAnswer: '(skipped)'
    }]);
    handleNext();
  };

  if (!currentWord) {
    return <div className="loading">加载中...</div>;
  }

  const blankSentence = createBlankSentence(currentWord.exampleSentence, currentWord.word);
  const progress = Math.round(((currentIndex + 1) / words.length) * 100);

  return (
    <div className="fill-blank-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">{currentIndex + 1} / {words.length}</span>
      </div>

      <div className="game-content">
        <h2>句子填空</h2>
        <p className="instruction">选择正确的单词填入句子中</p>

        <div className="sentence-display">
          <p className="sentence">{blankSentence}</p>
        </div>

        {!showAnswer ? (
          <div className="options-section">
            <div className="options-grid">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="button-group">
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={!selectedAnswer}
              >
                提交
              </button>
              <button className="btn btn-secondary" onClick={handleSkip}>
                跳过
              </button>
            </div>
          </div>
        ) : (
          <div className="answer-section">
            <div className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <div className="result-correct">
                  <h3>✓ 正确！</h3>
                </div>
              ) : (
                <div className="result-incorrect">
                  <h3>✗ 错误</h3>
                  <p>你的答案: <strong>{selectedAnswer}</strong></p>
                  <p>正确答案: <strong>{currentWord.word}</strong></p>
                </div>
              )}
            </div>

            <div className="word-details">
              <h3 className="word">{currentWord.word}</h3>
              <p className="phonetic">{currentWord.phonetic}</p>
              <p className="meaning">中文: {currentWord.meaning}</p>
              <p className="example">完整句子: {currentWord.exampleSentence}</p>
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

export default FillBlank;
