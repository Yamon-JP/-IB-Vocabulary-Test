const App = {
  state: {
    currentPage: 'home',
    subject: null,
    practiceScope: 'all',
    selectedChapters: [],
    practiceWord: null,
    user: { xp: 0, streak: 0 }
  },

  init() {
    this.loadState();
    console.log('IB Master Trainer Version 1.0 initialized');

    if (typeof Progress !== 'undefined') Progress.load();

    if (typeof Vocabulary !== 'undefined') {
      Vocabulary.load().then(() => {
        this.renderSubjectCards();
        this.renderChapterSelector();
        this.applySavedSelection();
      });
    }

    if (typeof Pages !== 'undefined') Pages.init();
  },

  renderSubjectCards() {
    const container = document.getElementById('subject-list');
    if (!container || typeof Vocabulary === 'undefined') return;

    const subjects = ['English B HL', 'Biology SL', 'ESS HL', 'Math AI SL'];
    const available = Vocabulary.subjects();

    container.innerHTML = subjects.map(subject => {
      const hasData = available.includes(subject);
      return `<button class="subject-card ${hasData ? '' : 'subject-card-disabled'}"
        ${hasData ? `onclick="App.selectSubject('${subject}')"` : 'disabled'}>
        <strong>${subject}</strong>
        <small>${hasData ? 'Practice' : 'Data coming soon'}</small>
      </button>`;
    }).join('');
  },

  selectSubject(subject) {
    this.state.subject = subject;
    this.state.practiceScope = 'all';
    this.state.selectedChapters = [];
    this.state.practiceWord = null;
    this.saveState();
    this.renderChapterSelector();
    Pages.show('selection');
  },

  renderChapterSelector() {
    const title = document.getElementById('selection-subject');
    const list = document.getElementById('chapter-list');
    if (!title || !list || !this.state.subject || typeof Vocabulary === 'undefined') return;

    title.textContent = this.state.subject;
    const chapters = Vocabulary.chapters(this.state.subject);

    if (!chapters.length) {
      list.innerHTML = '<p class="muted">No vocabulary data is available yet.</p>';
      return;
    }

    list.innerHTML = chapters.map((chapter, index) => `
      <label class="chapter-option">
        <input type="checkbox" value="${chapter.replace(/"/g, '&quot;')}" data-chapter-index="${index}">
        <span>${chapter}</span>
      </label>`).join('');
  },

  setPracticeScope(scope) {
    this.state.practiceScope = scope;
    const chapterBox = document.getElementById('chapter-options');
    if (chapterBox) chapterBox.style.display = scope === 'selected' ? 'block' : 'none';
  },

  startPractice() {
    if (!this.state.subject || typeof Vocabulary === 'undefined') return;

    const chapters = this.state.practiceScope === 'selected'
      ? [...document.querySelectorAll('#chapter-list input:checked')].map(input => input.value)
      : [];

    if (this.state.practiceScope === 'selected' && !chapters.length) {
      alert('Please select at least one chapter.');
      return;
    }

    const words = Vocabulary.filter(this.state.subject, chapters);
    if (!words.length) {
      alert('No vocabulary is available for this selection yet.');
      return;
    }

    this.state.selectedChapters = chapters;
    this.state.practiceWord = words[Math.floor(Math.random() * words.length)];
    this.saveState();

    if (typeof Quiz !== 'undefined') {
      Quiz.questions = words;
      Quiz.current = this.state.practiceWord;
      Quiz.render();
    }
    if (typeof Flashcard !== 'undefined') Flashcard.setWord(this.state.practiceWord);

    Pages.show('practice');
  },

  applySavedSelection() {
    if (!this.state.subject) return;
    const words = Vocabulary.filter(this.state.subject, this.state.selectedChapters || []);
    if (words.length) {
      this.state.practiceWord = this.state.practiceWord && words.includes(this.state.practiceWord)
        ? this.state.practiceWord
        : words[0];
      if (typeof Quiz !== 'undefined') Quiz.questions = words;
      if (typeof Flashcard !== 'undefined') Flashcard.setWord(this.state.practiceWord);
    }
  },

  getPracticeWord() {
    return this.state.practiceWord;
  },

  setPracticeWord(word) {
    if (!word) return;
    this.state.practiceWord = word;
    this.saveState();
    if (typeof Flashcard !== 'undefined' && Flashcard.currentWord !== word) Flashcard.setWord(word);
    if (typeof Quiz !== 'undefined') Quiz.current = word;
  },

  navigate(page) {
    this.state.currentPage = page;
    this.saveState();
    if (typeof Pages !== 'undefined') Pages.show(page);
  },

  loadState() {
    const saved = Storage.load('ib_master_trainer_state');
    if (saved) this.state = { ...this.state, ...saved };
  },

  saveState() {
    Storage.save('ib_master_trainer_state', this.state);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
