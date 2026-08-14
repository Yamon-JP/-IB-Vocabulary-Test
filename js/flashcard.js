const Flashcard = {
  currentWord: null,
  showMeaning: false,
  answerMode: false,
  voiceCache: [],
  voiceListenerInstalled: false,

  init() {
    this.showMeaning = false;
    this.answerMode = false;
    this.refreshVoiceCache();
    this.installVoiceListener();
    this.bindAudioButton();
    this.render();
  },

  current() {
    if (typeof App !== 'undefined' && App.getPracticeWord()) return App.getPracticeWord();
    return this.currentWord;
  },

  setWord(word) {
    if (!word) return;
    this.currentWord = word;
    this.showMeaning = false;
    this.answerMode = false;
    this.render();
  },

  showAnswer(resultHtml) {
    const meaning = document.getElementById('flashcard-meaning');
    if (meaning) meaning.innerHTML = resultHtml;
    this.answerMode = true;
  },

  toggleMeaning() {
    this.showMeaning = !this.showMeaning;
    this.render();
  },

  refreshVoiceCache() {
    if (!('speechSynthesis' in window)) {
      this.voiceCache = [];
      return [];
    }
    this.voiceCache = window.speechSynthesis.getVoices();
    return this.voiceCache;
  },

  installVoiceListener() {
    if (this.voiceListenerInstalled || !('speechSynthesis' in window)) return;
    this.voiceListenerInstalled = true;
    const refresh = () => this.refreshVoiceCache();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', refresh);
    } else {
      const previous = window.speechSynthesis.onvoiceschanged;
      window.speechSynthesis.onvoiceschanged = event => {
        if (typeof previous === 'function') previous.call(window.speechSynthesis, event);
        refresh();
      };
    }
  },

  isJapaneseVoice(voice) {
    const lang = String(voice?.lang || '').toLowerCase().replace('_', '-');
    const name = String(voice?.name || '').toLowerCase();
    return lang.startsWith('ja') || /japanese|日本語|kyoko|otoya/.test(name);
  },

  isUsVoice(voice) {
    if (!voice || this.isJapaneseVoice(voice)) return false;
    const lang = String(voice.lang || '').toLowerCase().replace('_', '-');
    const name = String(voice.name || '').toLowerCase();
    if (lang.startsWith('en-us')) return true;
    return /english\s*\(?(united states|u\.s\.|us)\)?|american english|us english|u\.s\. english/.test(name);
  },

  isEnglishVoice(voice) {
    if (!voice || this.isJapaneseVoice(voice)) return false;
    const lang = String(voice.lang || '').toLowerCase().replace('_', '-');
    const name = String(voice.name || '').toLowerCase();
    return lang.startsWith('en-') || /^english\b/.test(name);
  },

  isUnsafeVoice(voice) {
    const name = String(voice?.name || '').toLowerCase();
    return /expressive|emotion|emotional|journey|multitalker|multi-talker|podcast|storytelling|character|whisper|singing|narrative/.test(name);
  },

  voiceScore(voice) {
    const name = String(voice?.name || '').toLowerCase();
    let score = 0;
    if (voice?.localService === true) score += 100;
    if (name.includes('google us english')) score += 50;
    if (/microsoft (david|zira|mark|aria|jenny|guy|ava|andrew|brian|emma|roger|steffan)/.test(name)) score += 48;
    if (/\b(samantha|alex)\b/.test(name)) score += 46;
    if (name.includes('google')) score += 28;
    if (name.includes('microsoft')) score += 26;
    if (name.includes('apple')) score += 24;
    if (voice?.default) score += 5;
    return score;
  },

  preferredVoice() {
    const voices = this.voiceCache.length ? this.voiceCache : this.refreshVoiceCache();
    const safeUs = voices
      .filter(voice => this.isUsVoice(voice) && !this.isUnsafeVoice(voice))
      .sort((a, b) => this.voiceScore(b) - this.voiceScore(a));
    if (safeUs.length) return safeUs[0];

    const safeEnglish = voices
      .filter(voice => this.isEnglishVoice(voice) && !this.isUnsafeVoice(voice))
      .sort((a, b) => this.voiceScore(b) - this.voiceScore(a));
    return safeEnglish[0] || null;
  },

  speak() {
    const current = this.current();
    if (!current || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(current.word);
    const voice = this.preferredVoice();
    utterance.lang = voice?.lang || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    if (voice) utterance.voice = voice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  },

  bindAudioButton() {
    const button = document.getElementById('flashcard-audio');
    if (!button) return;
    button.onclick = () => this.speak();
  },

  render() {
    const word = document.getElementById('flashcard-word');
    const meaning = document.getElementById('flashcard-meaning');
    const current = this.current();
    if (!current) return;

    const definitionMode = typeof Quiz !== 'undefined' && Quiz.mode === 'definition-word';
    if (word) word.textContent = definitionMode ? current.definition : current.word;

    if (meaning && !this.answerMode) meaning.innerHTML = '';
  }
};

Flashcard.init();
