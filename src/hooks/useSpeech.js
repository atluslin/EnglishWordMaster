import { useState, useCallback, useEffect, useRef } from 'react';

// 在线词典音频源配置
const AUDIO_SOURCES = {
  // 有道词典 - 美式发音
  youdao_us: (word) => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`,
  // 有道词典 - 英式发音
  youdao_uk: (word) => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`,
};

/**
 * Custom hook for hybrid text-to-speech functionality
 * Priority: Online dictionary audio > Web Speech API
 */
const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [audioSource, setAudioSource] = useState('hybrid'); // 'hybrid', 'dictionary', 'webspeech'
  const audioRef = useRef(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
    // Create audio element for dictionary audio
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => setIsSpeaking(false));
    audioRef.current.addEventListener('error', () => setIsSpeaking(false));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Stop any ongoing speech
   */
  const stop = useCallback(() => {
    // Stop dictionary audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Stop Web Speech API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  /**
   * Play audio from online dictionary
   */
  const playDictionaryAudio = useCallback((word, accent = 'us') => {
    return new Promise((resolve, reject) => {
      if (!audioRef.current) {
        reject(new Error('Audio element not initialized'));
        return;
      }

      const sourceKey = accent === 'uk' ? 'youdao_uk' : 'youdao_us';
      const audioUrl = AUDIO_SOURCES[sourceKey](word);

      // Set up event handlers before setting src
      const handleCanPlay = () => {
        setIsSpeaking(true);
        audioRef.current.play()
          .then(() => resolve())
          .catch((err) => reject(err));
      };

      const handleError = () => {
        reject(new Error('Failed to load dictionary audio'));
      };

      audioRef.current.oncanplaythrough = handleCanPlay;
      audioRef.current.onerror = handleError;
      audioRef.current.src = audioUrl;

      // Set a timeout for loading
      const timeoutId = setTimeout(() => {
        reject(new Error('Dictionary audio load timeout'));
      }, 3000);

      audioRef.current.oncanplaythrough = () => {
        clearTimeout(timeoutId);
        handleCanPlay();
      };

      audioRef.current.load();
    });
  }, []);

  /**
   * Fallback to Web Speech API
   */
  const speakWithWebSpeech = useCallback((text, lang = 'en-US', rate = 0.8) => {
    if (!isSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a better English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferredVoice = englishVoices.find(v =>
      v.name.includes('Google') ||
      v.name.includes('Microsoft') ||
      v.name.includes('Samantha') ||
      v.name.includes('Daniel')
    ) || englishVoices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  /**
   * Main speak function - hybrid approach
   * @param {string} text - The word/text to speak
   * @param {string} lang - Language code (default: 'en-US')
   * @param {number} rate - Speech rate for Web Speech API fallback
   */
  const speak = useCallback(async (text, lang = 'en-US', rate = 0.8) => {
    // Stop any ongoing audio
    stop();

    // For single English words, try dictionary audio first
    const isSingleWord = /^[a-zA-Z]+$/.test(text.trim());

    if (audioSource !== 'webspeech' && isSingleWord) {
      try {
        await playDictionaryAudio(text.trim());
        return; // Success with dictionary audio
      } catch (error) {
        console.log('Dictionary audio failed, falling back to Web Speech API:', error.message);
      }
    }

    // Fallback to Web Speech API
    if (audioSource !== 'dictionary') {
      speakWithWebSpeech(text, lang, rate);
    }
  }, [audioSource, playDictionaryAudio, speakWithWebSpeech, stop]);

  /**
   * Pause the current speech
   */
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    } else if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused && audioRef.current.src) {
      audioRef.current.play();
    } else if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    audioSource,
    setAudioSource // 允许用户切换音频源
  };
};

export default useSpeech;
