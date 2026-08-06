const App = {
  state: {
    currentPage: 'home',
    subject: null,
    practiceWord: null,
    user: {
      xp: 0,
      streak: 0
    }
  },

  init() {
    this.loadState();
    console.log('IB Master Trainer Version 1.0 initialized');

    if (typeof Progress !== 'undefined') {
      Progress.load();
    }

    if (typeof Vocabulary !== 'undefined') {
      Vocabulary.load().then(() => {
        if (!this.state.practiceWord && Vocabulary.words.length) {
          this.state.practiceWord = Vocabulary.words[0];
        }

        if (typeof Flashcard !== 'undefined') {
          Flashcard.init();
          Flashcard.setWord(this.state.practiceWord);
        }

        if (typeof Quiz !== 'undefined') {
          Quiz.init();
        }
      });
    }

    if (typeof Pages !== 'undefined') {
      Pages.init();
    }
  },

  getPracticeWord() {
    return this.state.practiceWord;
  },

  setPracticeWord(word) {
    this.state.practiceWord = word;
    this.saveState();
  },

  navigate(page) {
    this.state.currentPage = page;
    this.saveState();
    if (typeof Pages !== 'undefined') {
      Pages.show(page);
    }
  },

  loadState() {
    const saved = Storage.load('ib_master_trainer_state');
    if (saved) {
      this.state = saved;
    }
  },

  saveState() {
    Storage.save('ib_master_trainer_state', this.state);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
