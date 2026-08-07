const Flashcard = {
  currentWord: null,
  showMeaning: false,

  init() {
    this.currentWord = null;
    this.showMeaning = false;
    this.render();
    this.bindAudioButton();
  },

  current() {
    if (typeof App !== 'undefined' && App.getPracticeWord()) {
      return App.getPracticeWord();
    }
    return this.currentWord;
  },

  setWord(word) {
    if (!word) return;

    this.currentWord = word;
    this.showMeaning = false;
    this.render();
  },

  toggleMeaning() {
    this.showMeaning = !this.showMeaning;
    this.render();
  },

  speak() {
    const current = this.current();
    if (!current || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(current.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice =>
      voice.lang === 'en-US' || voice.lang.startsWith('en-US')
    ) || voices.find(voice =>
      voice.lang.startsWith('en')
    );

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

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

    if (word) word.textContent = current.word;

    if (meaning) {
      if (this.showMeaning) {
        meaning.innerHTML = `Definition<br>${current.definition || ''}<br><br>Japanese<br>${current.japanese || 'Not available'}`;
      } else {
        meaning.innerHTML = '';
      }
    }
  }
};
