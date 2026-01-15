import React, { useState } from 'react';
import ListenSpell from './components/ListenSpell';
import FillBlank from './components/FillBlank';
import LetterPuzzle from './components/LetterPuzzle';
import k8Words from './data/k8-s1.json';
import libraries from './data/libraries.json';
import { selectRandomWords, calculateStats } from './utils/wordHelpers';
import { saveToHistory, getHistory, formatDate, clearHistory } from './utils/storageHelper';
import './App.css';

// Word libraries map
const WORD_LIBRARIES = {
  'k8': k8Words
};

const MODES = {
  MENU: 'menu',
  LISTEN_SPELL: 'listen-spell',
  FILL_BLANK: 'fill-blank',
  LETTER_PUZZLE: 'letter-puzzle',
  RESULTS: 'results'
};

const MODE_NAMES = {
  [MODES.LISTEN_SPELL]: '听写拼写',
  [MODES.FILL_BLANK]: '句子填空',
  [MODES.LETTER_PUZZLE]: '字母填空'
};

function App() {
  const [currentMode, setCurrentMode] = useState(MODES.MENU);
  const [currentModeName, setCurrentModeName] = useState('');
  const [currentLibrary, setCurrentLibrary] = useState('k8');
  const [selectedWords, setSelectedWords] = useState([]);
  const [results, setResults] = useState([]);

  const startMode = (mode, count) => {
    const wordsData = WORD_LIBRARIES[currentLibrary];
    const words = selectRandomWords(wordsData, count);
    setSelectedWords(words);
    setCurrentMode(mode);
    setCurrentModeName(MODE_NAMES[mode]);
    setResults([]);
  };

  const handleComplete = (gameResults) => {
    setResults(gameResults);
    setCurrentMode(MODES.RESULTS);

    // Save to history
    const stats = calculateStats(gameResults);
    saveToHistory({
      mode: currentModeName,
      wordCount: gameResults.length,
      correct: stats.correct,
      incorrect: stats.incorrect,
      accuracy: stats.accuracy
    });
  };

  const backToMenu = () => {
    setCurrentMode(MODES.MENU);
    setResults([]);
  };

  const renderContent = () => {
    const currentWordsData = WORD_LIBRARIES[currentLibrary];

    switch (currentMode) {
      case MODES.MENU:
        return (
          <MainMenu
            onStartMode={startMode}
            totalWords={currentWordsData.length}
            libraries={libraries}
            currentLibrary={currentLibrary}
            onLibraryChange={setCurrentLibrary}
          />
        );

      case MODES.LISTEN_SPELL:
        return <ListenSpell words={selectedWords} onComplete={handleComplete} />;

      case MODES.FILL_BLANK:
        return <FillBlank words={selectedWords} onComplete={handleComplete} />;

      case MODES.LETTER_PUZZLE:
        return <LetterPuzzle words={selectedWords} onComplete={handleComplete} />;

      case MODES.RESULTS:
        return <Results results={results} onBackToMenu={backToMenu} />;

      default:
        return (
          <MainMenu
            onStartMode={startMode}
            totalWords={currentWordsData.length}
            libraries={libraries}
            currentLibrary={currentLibrary}
            onLibraryChange={setCurrentLibrary}
          />
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 背单词 - 八年级英语</h1>
        {currentMode !== MODES.MENU && currentMode !== MODES.RESULTS && (
          <button className="btn-back" onClick={backToMenu}>
            ← 返回主菜单
          </button>
        )}
      </header>
      <main className="App-main">
        {renderContent()}
      </main>
      <footer className="App-footer">
        <p>八年级上册英语词汇学习 | 当前词库: {WORD_LIBRARIES[currentLibrary].length} 个单词</p>
      </footer>
    </div>
  );
}

/**
 * Main Menu Component
 */
const MainMenu = ({ onStartMode, totalWords, libraries, currentLibrary, onLibraryChange }) => {
  const [wordCount, setWordCount] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const history = getHistory();

  const handleClearHistory = () => {
    if (window.confirm('确定要清除所有历史记录吗？')) {
      clearHistory();
      setShowHistory(false);
      window.location.reload();
    }
  };

  return (
    <div className="main-menu">
      <h2>选择学习模式</h2>

      <div className="selector-container">
        <div className="library-selector">
          <label>📚 单词库:</label>
          <select value={currentLibrary} onChange={(e) => onLibraryChange(e.target.value)}>
            {libraries.map(lib => (
              <option key={lib.id} value={lib.id}>
                {lib.name} ({lib.description})
              </option>
            ))}
          </select>
        </div>

        <div className="word-count-selector">
          <label>🔢 数量:</label>
          <select value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}>
            <option value={5}>5 个单词</option>
            <option value={10}>10 个单词</option>
            <option value={15}>15 个单词</option>
            <option value={totalWords}>全部 ({totalWords} 个)</option>
          </select>
        </div>
      </div>

      <div className="mode-cards">
        <div className="mode-card" onClick={() => onStartMode(MODES.LISTEN_SPELL, wordCount)}>
          <div className="mode-icon">🎧</div>
          <h3>听写拼写</h3>
          <p>听单词发音，然后拼写出来</p>
          <button className="btn btn-primary">开始</button>
        </div>

        <div className="mode-card" onClick={() => onStartMode(MODES.FILL_BLANK, wordCount)}>
          <div className="mode-icon">📝</div>
          <h3>句子填空</h3>
          <p>选择正确的单词填入句子中</p>
          <button className="btn btn-primary">开始</button>
        </div>

        <div className="mode-card" onClick={() => onStartMode(MODES.LETTER_PUZZLE, wordCount)}>
          <div className="mode-icon">🧩</div>
          <h3>字母填空</h3>
          <p>根据提示填写完整的单词</p>
          <button className="btn btn-primary">开始</button>
        </div>
      </div>

      <div className="info-section">
        <h3>使用说明</h3>
        <ul>
          <li><strong>听写拼写:</strong> 练习听力和拼写能力，适合记忆单词拼写</li>
          <li><strong>句子填空:</strong> 通过语境理解单词用法，提高阅读理解能力</li>
          <li><strong>字母填空:</strong> 根据提示猜测单词，增强词汇记忆</li>
        </ul>
      </div>

      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3>📊 学习历史 ({history.length})</h3>
            <div className="history-actions">
              <button
                className="btn-text"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? '隐藏' : '显示'}
              </button>
              <button
                className="btn-text btn-danger"
                onClick={handleClearHistory}
              >
                清除
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="history-list">
              {history.slice(0, 10).map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-info">
                    <span className="history-mode">{item.mode}</span>
                    <span className="history-time">{formatDate(item.timestamp)}</span>
                  </div>
                  <div className="history-stats">
                    <span className="history-count">{item.wordCount}题</span>
                    <span className={`history-accuracy ${item.accuracy >= 80 ? 'good' : item.accuracy >= 60 ? 'medium' : 'poor'}`}>
                      {item.accuracy}%
                    </span>
                    <span className="history-result">
                      ✓ {item.correct} / ✗ {item.incorrect}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Results Component
 */
const Results = ({ results, onBackToMenu }) => {
  const stats = calculateStats(results);

  return (
    <div className="results-container">
      <h2>学习成果</h2>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总题数</div>
        </div>
        <div className="stat-card correct">
          <div className="stat-value">{stats.correct}</div>
          <div className="stat-label">正确</div>
        </div>
        <div className="stat-card incorrect">
          <div className="stat-value">{stats.incorrect}</div>
          <div className="stat-label">错误</div>
        </div>
        <div className="stat-card accuracy">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">正确率</div>
        </div>
      </div>

      <div className="results-details">
        <h3>详细结果</h3>
        <div className="results-list">
          {results.map((result, index) => (
            <div key={index} className={`result-item ${result.correct ? 'correct' : 'incorrect'}`}>
              <span className="result-icon">{result.correct ? '✓' : '✗'}</span>
              <span className="result-word">{result.word}</span>
              {!result.correct && (
                <span className="result-answer">你的答案: {result.userAnswer}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="results-actions">
        <button className="btn btn-primary btn-large" onClick={onBackToMenu}>
          返回主菜单
        </button>
      </div>

      {stats.accuracy === 100 && (
        <div className="celebration">
          <h3>🎉 太棒了！全部正确！</h3>
        </div>
      )}
    </div>
  );
};

export default App;
