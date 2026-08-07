const Flashcard = {
  currentWord: null,
  showMeaning: false,
  answerMode: false,

  init() {
    this.currentWord = null;
    this.showMeaning = false;
    this.answerMode = false;
    this.render();
    this.bindAudioButton();
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

  speak() {
    const current = this.current();
    if (!current || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(current.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
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

    if (meaning && !this.answerMode) {
      meaning.innerHTML = '';
    }
  }
};
