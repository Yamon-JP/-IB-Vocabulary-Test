const Flashcard = {
  index: 0,
  showMeaning: false,

  init() {
    this.index = 0;
    this.showMeaning = false;
    this.render();
  },

  current() {
    if (!Vocabulary || !Vocabulary.words.length) return null;
    return Vocabulary.words[this.index];
  },

  toggleMeaning() {
    this.showMeaning = !this.showMeaning;
    this.render();
  },

  next() {
    if (!Vocabulary || !Vocabulary.words.length) return;
    this.index = (this.index + 1) % Vocabulary.words.length;
    this.showMeaning = false;
    this.render();
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
