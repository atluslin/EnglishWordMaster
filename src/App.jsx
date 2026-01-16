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
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
      accuracy: stats.accuracy,
      withHints: stats.withHints,
      totalHintsUsed: stats.totalHintsUsed,
      timeoutCount: stats.timeoutCount
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

  const history = getHistory();

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 背单词 - 八年级英语</h1>
        <div className="header-actions">
          {currentMode !== MODES.MENU && currentMode !== MODES.RESULTS && (
            <button className="btn-back" onClick={backToMenu}>
              ← 返回主菜单
            </button>
          )}
          <button
            className="btn-history"
            onClick={() => setShowHistoryModal(true)}
            title="学习历史"
          >
            📊 历史{history.length > 0 && <span className="history-badge">{history.length}</span>}
          </button>
        </div>
      </header>
      <main className="App-main">
        {renderContent()}
      </main>
      <footer className="App-footer">
        <p>八年级上册英语词汇学习 | 当前词库: {WORD_LIBRARIES[currentLibrary].length} 个单词</p>
      </footer>

      {showHistoryModal && (
        <HistoryModal
          history={history}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Main Menu Component
 */
const MainMenu = ({ onStartMode, totalWords, libraries, currentLibrary, onLibraryChange }) => {
  const [wordCount, setWordCount] = useState(10);
  const [customCount, setCustomCount] = useState('');
  const [useCustomCount, setUseCustomCount] = useState(false);

  const getEffectiveWordCount = () => {
    if (useCustomCount && customCount) {
      const count = parseInt(customCount, 10);
      if (count > 0 && count <= totalWords) {
        return count;
      }
    }
    return wordCount;
  };

  const handleCustomCountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) <= totalWords)) {
      setCustomCount(value);
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
          <select
            value={useCustomCount ? 'custom' : wordCount}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setUseCustomCount(true);
              } else {
                setUseCustomCount(false);
                setWordCount(Number(e.target.value));
              }
            }}
          >
            <option value={5}>5 个单词</option>
            <option value={10}>10 个单词</option>
            <option value={15}>15 个单词</option>
            <option value={20}>20 个单词</option>
            <option value={30}>30 个单词</option>
            <option value={totalWords}>全部 ({totalWords} 个)</option>
            <option value="custom">自定义...</option>
          </select>
          {useCustomCount && (
            <input
              type="number"
              className="custom-count-input"
              value={customCount}
              onChange={handleCustomCountChange}
              placeholder={`1-${totalWords}`}
              min="1"
              max={totalWords}
            />
          )}
        </div>
      </div>

      <div className="mode-cards">
        <div className="mode-card" onClick={() => onStartMode(MODES.LISTEN_SPELL, getEffectiveWordCount())}>
          <div className="mode-icon">🎧</div>
          <h3>听写拼写</h3>
          <p>听单词发音，然后拼写出来</p>
          <button className="btn btn-primary">开始</button>
        </div>

        <div className="mode-card" onClick={() => onStartMode(MODES.FILL_BLANK, getEffectiveWordCount())}>
          <div className="mode-icon">📝</div>
          <h3>句子填空</h3>
          <p>选择正确的单词填入句子中</p>
          <button className="btn btn-primary">开始</button>
        </div>

        <div className="mode-card" onClick={() => onStartMode(MODES.LETTER_PUZZLE, getEffectiveWordCount())}>
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
    </div>
  );
};

/**
 * History Modal Component
 */
const HistoryModal = ({ history, onClose }) => {
  const handleClearHistory = () => {
    if (window.confirm('确定要清除所有历史记录吗？')) {
      clearHistory();
      onClose();
      window.location.reload();
    }
  };

  // 计算总体统计
  const totalStats = history.reduce((acc, item) => {
    acc.totalQuestions += item.wordCount;
    acc.totalCorrect += item.correct;
    acc.totalIncorrect += item.incorrect;
    acc.totalHints += item.withHints || 0;
    acc.totalTimeouts += item.timeoutCount || 0;
    return acc;
  }, { totalQuestions: 0, totalCorrect: 0, totalIncorrect: 0, totalHints: 0, totalTimeouts: 0 });

  const overallAccuracy = totalStats.totalQuestions > 0
    ? Math.round((totalStats.totalCorrect / totalStats.totalQuestions) * 100)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 学习历史</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {history.length > 0 ? (
          <>
            <div className="history-summary">
              <div className="summary-item">
                <span className="summary-value">{history.length}</span>
                <span className="summary-label">学习次数</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{totalStats.totalQuestions}</span>
                <span className="summary-label">总题数</span>
              </div>
              <div className="summary-item correct">
                <span className="summary-value">{totalStats.totalCorrect}</span>
                <span className="summary-label">正确</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{overallAccuracy}%</span>
                <span className="summary-label">总正确率</span>
              </div>
            </div>

            <div className="history-list-container">
              <div className="history-list">
                {history.map((item) => (
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
                        ✓{item.correct} / ✗{item.incorrect}
                      </span>
                      {item.withHints > 0 && (
                        <span className="history-hints" title={`使用提示 ${item.withHints} 题`}>
                          💡{item.withHints}
                        </span>
                      )}
                      {item.timeoutCount > 0 && (
                        <span className="history-timeout" title={`超时 ${item.timeoutCount} 题`}>
                          ⏱️{item.timeoutCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleClearHistory}>
                清除所有记录
              </button>
            </div>
          </>
        ) : (
          <div className="empty-history">
            <p>暂无学习记录</p>
            <p>开始练习后，记录会显示在这里</p>
          </div>
        )}
      </div>
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
          <div className="stat-label">准确率</div>
          {stats.withHints > 0 && (
            <div className="stat-note">不含提示题</div>
          )}
        </div>
      </div>

      {(stats.withHints > 0 || stats.timeoutCount > 0) && (
        <div className="extra-stats">
          {stats.withHints > 0 && (
            <div className="extra-stat-item hint-stat">
              <span className="extra-stat-icon">💡</span>
              <span className="extra-stat-text">
                使用提示: {stats.withHints} 题 (共 {stats.totalHintsUsed} 次)
              </span>
            </div>
          )}
          {stats.timeoutCount > 0 && (
            <div className="extra-stat-item timeout-stat">
              <span className="extra-stat-icon">⏱️</span>
              <span className="extra-stat-text">
                超时: {stats.timeoutCount} 题
              </span>
            </div>
          )}
        </div>
      )}

      <div className="results-details">
        <h3>详细结果</h3>
        <div className="results-list">
          {results.map((result, index) => (
            <div key={index} className={`result-item ${result.correct ? 'correct' : 'incorrect'} ${result.hintsUsed > 0 ? 'with-hint' : ''} ${result.timeout ? 'with-timeout' : ''}`}>
              <span className="result-icon">{result.correct ? '✓' : '✗'}</span>
              <span className="result-word">{result.word}</span>
              <span className="result-badges">
                {result.hintsUsed > 0 && (
                  <span className="badge badge-hint" title={`使用了 ${result.hintsUsed} 次提示`}>💡{result.hintsUsed}</span>
                )}
                {result.timeout && (
                  <span className="badge badge-timeout" title="超时">⏱️</span>
                )}
              </span>
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

      {stats.accuracy === 100 && stats.withHints === 0 && (
        <div className="celebration">
          <h3>🎉 太棒了！全部正确！</h3>
        </div>
      )}
    </div>
  );
};

export default App;
