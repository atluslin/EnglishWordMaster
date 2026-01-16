/**
 * LocalStorage helper for managing learning history
 */

const HISTORY_KEY = 'vocabulary_learning_history';

/**
 * Get learning history from localStorage
 * @returns {Array} - Array of history items
 */
export const getHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading history:', error);
    return [];
  }
};

/**
 * Save a learning session to history
 * @param {Object} session - Session data
 */
export const saveToHistory = (session) => {
  try {
    const history = getHistory();
    const newSession = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...session
    };

    // Add new session at the beginning
    history.unshift(newSession);

    // 保存所有历史记录（不再限制数量）
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
};

/**
 * Clear all history
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};

/**
 * Format date for display
 * @param {string} isoString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatDate = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
