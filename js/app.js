const App = {
  state: {
    currentPage: 'home',
    subject: null,
    practiceType: 'vocabulary',
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
        this.applyPracticeTypeUI();
        if (typeof Quiz !== 'undefined') Quiz.init();
        if (typeof Paper2 !== 'undefined') Paper2.init();
        this.updatePracticeHeader();
      });
    }

    if (typeof Pages !== 'undefined') Pages.init();
  },

  renderSubjectCards() {
    const container = document.getElementById('subject-list');
    if (!container || typeof Vocabulary === 'undefined') return;

    const subjects = ['English B HL', 'Biology SL', 'ESS HL'];
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
    this.state.practiceType = 'vocabulary';
    this.state.practiceScope = 'all';
    this.state.selectedChapters = [];
    this.state.practiceWord = null;
    this.saveState();
    this.renderChapterSelector();
    this.applyPracticeTypeUI();
    Pages.show('selection');
  },

  openPractice() {
    if (!this.state.subject) {
      Pages.show('home');
      return;
    }

    this.renderChapterSelector();
    this.updatePracticeHeader();

    // Always rebuild the practice question set from the selected subject.
    // This prevents a previous subject's question from appearing here.
    if (this.state.practiceType === 'vocabulary' && typeof Vocabulary !== 'undefined') {
      const words = Vocabulary.filter(
        this.state.subject,
        this.state.practiceScope === 'selected' ? this.state.selectedChapters : []
      );

      if (words.length) {
        const currentIsValid = this.state.practiceWord && words.some(word => word.id === this.state.practiceWord.id);
        if (!currentIsValid) {
          this.state.practiceWord = words[0];
          this.saveState();
        }
        if (typeof Quiz !== 'undefined') {
          Quiz.questions = words;
          Quiz.current = this.state.practiceWord;
          Quiz.render();
        }
        if (typeof Flashcard !== 'undefined') Flashcard.setWord(this.state.practiceWord);
      }
    }

    Pages.show('practice');
  },

  backToSelection() {
    if (!this.state.subject) {
      Pages.show('home');
      return;
    }
    this.renderChapterSelector();
    this.applyPracticeTypeUI();
    Pages.show('selection');
  },

  setPracticeType(type) {
    this.state.practiceType = type;
    this.applyPracticeTypeUI();
    this.saveState();
  },

  applyPracticeTypeUI() {
    const vocabularyButton = document.getElementById('type-vocabulary');
    const paper2Button = document.getElementById('type-paper2');
    if (vocabularyButton) vocabularyButton.classList.toggle('active', this.state.practiceType === 'vocabulary');
    if (paper2Button) paper2Button.classList.toggle('active', this.state.practiceType === 'paper2');
  },

  renderChapterSelector() {
    const title = document.getElementById('selection-subject');
    const list = document.getElementById('chapter-list');
    if (!title || !list || !this.state.subject || typeof Vocabulary === 'undefined') return;

    title.textContent = this.state.subject;
    const chapters = Vocabulary.chapters(this.state.subject);

    if (!chapters.length) {
      list.innerHTML = '<p class="muted">No chapter data is available yet.</p>';
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

    this.state.selectedChapters = chapters;
    this.saveState();

    if (this.state.practiceType === 'paper2') {
      if (typeof Paper2 !== 'undefined') Paper2.loadForSelection(this.state.subject, chapters);
      this.updatePracticeHeader();
      Pages.show('practice');
      return;
    }

    const words = Vocabulary.filter(this.state.subject, chapters);
    if (!words.length) {
      alert('No vocabulary is available for this selection yet.');
      return;
    }

    this.state.practiceWord = words[Math.floor(Math.random() * words.length)];
    this.saveState();

    if (typeof Quiz !== 'undefined') {
      Quiz.questions = words;
      Quiz.current = this.state.practiceWord;
      Quiz.render();
    }
    if (typeof Flashcard !== 'undefined') Flashcard.setWord(this.state.practiceWord);

    this.updatePracticeHeader();
    Pages.show('practice');
  },

  updatePracticeHeader() {
    const subject = document.getElementById('selection-subject-practice');
    if (subject) {
      const scope = this.state.practiceScope === 'selected' && this.state.selectedChapters.length
        ? this.state.selectedChapters.join(', ')
        : 'All Chapters';
      subject.textContent = `${this.state.subject || ''} · ${this.state.practiceType === 'paper2' ? 'Paper 2' : 'Vocabulary'} · ${scope}`;
    }

    const vocabularyPanel = document.getElementById('vocabulary-practice-panel');
    const paper2Panel = document.getElementById('paper2-practice-panel');
    if (vocabularyPanel) vocabularyPanel.style.display = this.state.practiceType === 'vocabulary' ? 'block' : 'none';
    if (paper2Panel) paper2Panel.style.display = this.state.practiceType === 'paper2' ? 'block' : 'none';
  },

  applySavedSelection() {
    if (!this.state.subject) return;
    const words = Vocabulary.filter(this.state.subject, this.state.selectedChapters || []);
    if (words.length) {
      this.state.practiceWord = this.state.practiceWord && words.some(word => word.id === this.state.practiceWord.id)
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
    if (page === 'practice') this.updatePracticeHeader();
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
