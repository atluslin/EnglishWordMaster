import React, { useState, useEffect, useRef } from 'react';
import useSpeech from '../hooks/useSpeech';
import { checkAnswer } from '../utils/wordHelpers';

const TIMEOUT_SECONDS = 30;

/**
 * ListenSpell Component - Mode 1: Listen to word and type the spelling
 */
const ListenSpell = ({ words: initialWords, onComplete }) => {
  const [words, setWords] = useState(initialWords.map(w => ({ ...w, retryCount: 0 })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [results, setResults] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const timerRef = useRef(null);
  const { speak, isSpeaking, isSupported } = useSpeech();

  const currentWord = words[currentIndex];

  // Timer effect
  useEffect(() => {
    if (!showAnswer && currentWord) {
      setElapsedTime(0);
      setIsTimeout(false);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= TIMEOUT_SECONDS) {
            setIsTimeout(true);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, showAnswer]);

  useEffect(() => {
    // Auto-play when a new word is shown
    if (currentWord && !showAnswer) {
      handlePlaySound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handlePlaySound = () => {
    if (currentWord) {
      speak(currentWord.word, 'en-US', 0.7);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const correct = checkAnswer(userInput, currentWord.word);
    setIsCorrect(correct);
    setShowAnswer(true);

    // Record result
    setResults([...results, {
      word: currentWord.word,
      correct: correct,
      userAnswer: userInput,
      timeout: isTimeout,
      hintsUsed: 0
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
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setResults([...results, {
      word: currentWord.word,
      correct: false,
      userAnswer: userInput || '(skipped)',
      timeout: isTimeout,
      hintsUsed: 0
    }]);
    handleNext();
  };

  if (!isSupported) {
    return (
      <div className="error-message">
        <p>抱歉，您的浏览器不支持语音功能。</p>
        <p>请使用Chrome、Edge或Safari浏览器。</p>
      </div>
    );
  }

  if (!currentWord) {
    return <div className="loading">加载中...</div>;
  }

  const progress = Math.round(((currentIndex + 1) / words.length) * 100);

  return (
    <div className="listen-spell-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        <span className="progress-text">{currentIndex + 1} / {words.length}</span>
      </div>

      <div className="game-content">
        <h2>听音拼写</h2>
        <p className="instruction">听单词发音，然后拼写出来</p>

        <div className="audio-controls">
          <button
            className="btn btn-primary btn-large"
            onClick={handlePlaySound}
            disabled={isSpeaking}
          >
            {isSpeaking ? '播放中...' : '🔊 播放发音'}
          </button>
        </div>

        {!showAnswer && (
          <div className={`timer-display ${isTimeout ? 'timeout' : ''}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">{elapsedTime}秒</span>
            {isTimeout && <span className="timeout-warning">超时警告！请加快速度</span>}
          </div>
        )}

        {!showAnswer ? (
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="在此输入单词"
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

export default ListenSpell;
