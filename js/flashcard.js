const Flashcard = {
  currentIndex: 0,
  showMeaning: false,

  init() {
    this.currentIndex = 0;
    this.showMeaning = false;
    this.render();
    this.bindAudioButton();
  },

  current() {
    if (!Vocabulary || !Vocabulary.words.length) return null;
    return Vocabulary.words[this.currentIndex];
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

    if (word) {
      word.textContent = current.word;
    }

    if (meaning) {
      meaning.textContent = this.showMeaning ? current.meaning : '';
    }
  }
};
