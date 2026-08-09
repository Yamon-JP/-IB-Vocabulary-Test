const App = {
  state: {
    currentPage: 'home',
    subject: null,
    practiceType: 'vocabulary',
    paper1Section: 'paper1a',
    paper2Section: 'paper2a',
    practiceScope: 'all',
    selectedChapters: [],
    biologyLearnedUnits: [],
    biologyTheme: 'A',
    practiceWord: null,
    user: { xp: 0, streak: 0 }
  },

  init() {
    this.loadState();
    console.log('IB Master Trainer Version 1.0 initialized');

    if (typeof Progress !== 'undefined') Progress.load();

    const paper1Ready = this.ensurePaper1Module();

    if (typeof Vocabulary !== 'undefined') {
      Vocabulary.load().then(async () => {
        this.renderSubjectCards();
        this.renderChapterSelector();
        this.applySavedSelection();

        if (typeof Paper2 !== 'undefined') await Paper2.init();
        await paper1Ready;
        if (typeof Paper1 !== 'undefined') await Paper1.init();

        this.applyPracticeTypeUI();
        this.applyPracticeScopeUI();
        if (typeof Quiz !== 'undefined') Quiz.init();
        this.updatePracticeHeader();
      });
    }

    if (typeof Pages !== 'undefined') Pages.init();
  },

  ensurePaper1Module() {
    if (typeof Paper1 !== 'undefined') return Promise.resolve(true);

    return new Promise(resolve => {
      const existing = document.getElementById('paper1-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'paper1-script';
      script.src = 'js/paper1.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Paper 1 practice module could not be loaded.');
        resolve(false);
      };
      document.body.appendChild(script);
    });
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
    this.state.paper1Section = 'paper1a';
    this.state.paper2Section = 'paper2a';
    this.state.practiceScope = 'all';
    this.state.selectedChapters = [];
    this.state.biologyTheme = 'A';
    this.state.practiceWord = null;
    this.saveState();
    this.renderChapterSelector();
    this.applyPracticeTypeUI();
    this.applyPracticeScopeUI();
    Pages.show('selection');
  },

  async openPractice() {
    if (!this.state.subject) {
      Pages.show('home');
      return;
    }

    this.renderChapterSelector();
    this.updatePracticeHeader();

    const chapters = this.state.practiceScope === 'selected'
      ? [...(this.state.selectedChapters || [])]
      : [];

    if (this.state.practiceType === 'paper1') {
      await this.ensurePaper1Module();
      if (typeof Paper1 !== 'undefined') {
        await Paper1.init();
        const learnedUnits = this.state.subject === 'Biology SL'
          ? [...(this.state.biologyLearnedUnits || [])]
          : [];
        Paper1.loadForSelection(this.state.subject, chapters, this.state.paper1Section, learnedUnits);
      }
    } else if (this.state.practiceType === 'paper2') {
      this.loadPaper2ForSelection(this.state.subject, chapters);
    } else if (this.state.practiceType === 'vocabulary' && typeof Vocabulary !== 'undefined') {
      // Always rebuild the practice question set from the selected subject.
      // This prevents a previous subject's question from appearing here.
      const words = Vocabulary.filter(this.state.subject, chapters);

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

    this.updatePracticeHeader();
    Pages.show('practice');
  },

  backToSelection() {
    if (!this.state.subject) {
      Pages.show('home');
      return;
    }
    this.renderChapterSelector();
    this.applyPracticeTypeUI();
    this.applyPracticeScopeUI();
    Pages.show('selection');
  },

  setPracticeType(type) {
    const allowed = ['vocabulary', 'paper1', 'paper2'];
    if (!allowed.includes(type)) return;
    if (type === 'paper1' && this.state.subject !== 'Biology SL') return;

    this.state.practiceType = type;
    if (type === 'paper1') {
      this.state.paper1Section = this.state.paper1Section === 'paper1b' ? 'paper1b' : 'paper1a';
    }
    if (type === 'paper2' && this.state.subject === 'Biology SL') {
      this.state.paper2Section = this.state.paper2Section === 'paper2b' ? 'paper2b' : 'paper2a';
    }
    this.applyPracticeTypeUI();
    this.saveState();
  },

  setPaper1Section(section) {
    if (this.state.subject !== 'Biology SL') return;
    this.state.paper1Section = section === 'paper1b' ? 'paper1b' : 'paper1a';
    this.saveState();
    this.applyPracticeTypeUI();
    if (typeof Paper1 !== 'undefined') Paper1.applySectionUI();
  },

  setPaper2Section(section) {
    if (this.state.subject !== 'Biology SL') return;
    this.state.paper2Section = section === 'paper2b' ? 'paper2b' : 'paper2a';
    this.saveState();
    this.applyPracticeTypeUI();
    this.updatePracticeHeader();
  },

  applyPracticeTypeUI() {
    const vocabularyButton = document.getElementById('type-vocabulary');
    const paper1Button = document.getElementById('type-paper1');
    const paper2Button = document.getElementById('type-paper2');
    const typeGrid = document.querySelector('.practice-type-grid');
    const paper1Control = document.getElementById('paper1-section-control');
    const paper2Control = document.getElementById('paper2-section-control');
    const paper1Available = this.state.subject === 'Biology SL';
    const biologyPaper2 = this.state.subject === 'Biology SL';

    if (this.state.practiceType === 'paper1' && !paper1Available) {
      this.state.practiceType = 'vocabulary';
    }

    if (paper1Button) paper1Button.hidden = !paper1Available;
    if (typeGrid) typeGrid.classList.toggle('has-paper1', paper1Available);

    if (vocabularyButton) vocabularyButton.classList.toggle('active', this.state.practiceType === 'vocabulary');
    if (paper1Button) paper1Button.classList.toggle('active', this.state.practiceType === 'paper1');
    if (paper2Button) paper2Button.classList.toggle('active', this.state.practiceType === 'paper2');
    if (paper1Control) paper1Control.style.display = this.state.practiceType === 'paper1' && paper1Available ? 'block' : 'none';
    if (paper2Control) paper2Control.style.display = this.state.practiceType === 'paper2' && biologyPaper2 ? 'block' : 'none';

    const paper2AButton = document.getElementById('section-paper2a');
    const paper2BButton = document.getElementById('section-paper2b');
    if (paper2AButton) paper2AButton.classList.toggle('active', this.state.paper2Section !== 'paper2b');
    if (paper2BButton) paper2BButton.classList.toggle('active', this.state.paper2Section === 'paper2b');

    const paper2Title = document.getElementById('paper2-section-title');
    if (paper2Title) {
      paper2Title.textContent = this.state.subject === 'Biology SL'
        ? `${this.state.paper2Section === 'paper2b' ? 'Paper 2B' : 'Paper 2A'} Practice`
        : 'Paper 2 Practice';
    }

    if (typeof Paper1 !== 'undefined') {
      Paper1.applySectionUI();
      if (typeof Paper1.renderLearnedUnitSelector === 'function') Paper1.renderLearnedUnitSelector();
    }
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

    if (this.state.subject === 'Biology SL') {
      const themeNames = {
        A: 'Unity and diversity',
        B: 'Form and function',
        C: 'Interaction and interdependence',
        D: 'Continuity and change'
      };
      const themes = ['A', 'B', 'C', 'D'].filter(theme =>
        chapters.some(chapter => chapter.startsWith(theme))
      );

      if (!themes.includes(this.state.biologyTheme)) {
        this.state.biologyTheme = themes[0] || 'A';
      }

      const activeTheme = this.state.biologyTheme;
      const selected = new Set(this.state.selectedChapters || []);
      const visibleChapters = chapters.filter(chapter => chapter.startsWith(activeTheme));

      list.innerHTML = `
        <div class="trophy-subject-tabs biology-theme-tabs" role="tablist" aria-label="Biology themes">
          ${themes.map(theme => `
            <button type="button"
              class="trophy-subject-tab biology-theme-tab ${theme === activeTheme ? 'active' : ''}"
              role="tab"
              aria-selected="${theme === activeTheme}"
              onclick="App.selectBiologyTheme('${theme}')">
              Theme ${theme}
            </button>
          `).join('')}
        </div>
        <p class="muted"><strong>Theme ${activeTheme}: ${themeNames[activeTheme] || ''}</strong></p>
        <div class="biology-chapter-list">
          ${visibleChapters.map((chapter, index) => `
            <label class="chapter-option">
              <input type="checkbox"
                value="${chapter.replace(/"/g, '&quot;')}"
                data-chapter-index="${index}"
                ${selected.has(chapter) ? 'checked' : ''}
                onchange="App.toggleChapterSelection(this.value, this.checked)">
              <span>${chapter}</span>
            </label>
          `).join('')}
        </div>`;
      return;
    }

    const selected = new Set(this.state.selectedChapters || []);
    list.innerHTML = chapters.map((chapter, index) => {
      const chapterData = this.state.subject === 'ESS HL'
        ? Vocabulary.allWords.find(word => word.subject === this.state.subject && (word.chapter || word.topic) === chapter)
        : null;
      const displayChapter = chapterData?.chapterTitle
        ? `${chapter}: ${chapterData.chapterTitle}`
        : chapter;

      return `
        <label class="chapter-option">
          <input type="checkbox"
            value="${chapter.replace(/"/g, '&quot;')}"
            data-chapter-index="${index}"
            ${selected.has(chapter) ? 'checked' : ''}
            onchange="App.toggleChapterSelection(this.value, this.checked)">
          <span>${displayChapter}</span>
        </label>`;
    }).join('');
  },

  selectBiologyTheme(theme) {
    if (this.state.subject !== 'Biology SL') return;
    this.state.biologyTheme = theme;
    this.saveState();
    this.renderChapterSelector();
  },

  toggleChapterSelection(chapter, checked) {
    if (!chapter) return;
    const selected = new Set(this.state.selectedChapters || []);
    if (checked) selected.add(chapter);
    else selected.delete(chapter);
    this.state.selectedChapters = [...selected];
    this.saveState();
  },

  toggleBiologyLearnedUnit(unit, checked) {
    if (this.state.subject !== 'Biology SL' || !unit) return;
    const learned = new Set(Array.isArray(this.state.biologyLearnedUnits) ? this.state.biologyLearnedUnits : []);
    if (checked) learned.add(unit);
    else learned.delete(unit);
    this.state.biologyLearnedUnits = [...learned].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    this.saveState();
  },

  toggleBiologyLearnedTheme(theme, checked) {
    if (this.state.subject !== 'Biology SL' || !theme || typeof Paper1 === 'undefined') return;
    const themeUnits = typeof Paper1.getAvailableUnits === 'function'
      ? Paper1.getAvailableUnits().filter(unit => unit.startsWith(theme))
      : [];
    if (!themeUnits.length) return;

    const learned = new Set(Array.isArray(this.state.biologyLearnedUnits) ? this.state.biologyLearnedUnits : []);
    themeUnits.forEach(unit => {
      if (checked) learned.add(unit);
      else learned.delete(unit);
    });
    this.state.biologyLearnedUnits = [...learned].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    this.saveState();

    if (typeof Paper1.syncLearnedUnitThemeCheckboxes === 'function') Paper1.syncLearnedUnitThemeCheckboxes(theme);
    if (typeof Paper1.updateLearnedUnitThemeCount === 'function') Paper1.updateLearnedUnitThemeCount(theme);
  },

  setPracticeScope(scope) {
    this.state.practiceScope = scope === 'selected' ? 'selected' : 'all';
    this.applyPracticeScopeUI();
    this.saveState();
  },

  applyPracticeScopeUI() {
    const scope = this.state.practiceScope === 'selected' ? 'selected' : 'all';
    this.state.practiceScope = scope;

    document.querySelectorAll('input[name="practice-scope"]').forEach(input => {
      input.checked = input.value === scope;
    });

    const chapterBox = document.getElementById('chapter-options');
    if (chapterBox) chapterBox.style.display = scope === 'selected' ? 'block' : 'none';
  },

  loadPaper2ForSelection(subject, chapters = []) {
    if (typeof Paper2 === 'undefined') return 0;
    const learned = new Set(subject === 'Biology SL' && Array.isArray(this.state.biologyLearnedUnits)
      ? this.state.biologyLearnedUnits
      : []);
    const eligible = (Array.isArray(Paper2.allQuestions) ? Paper2.allQuestions : []).filter(question => {
      if (question.subject !== subject) return false;

      if (subject === 'Biology SL') {
        if (question.assessmentTarget !== this.state.paper2Section) return false;
        const requiredUnits = Array.isArray(question.requiredUnits)
          ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
          : [];
        if (!requiredUnits.length) return false;
        if (!requiredUnits.every(unit => learned.has(unit))) return false;
      }

      if (!chapters.length) return true;
      const chapter = question.chapter || question.topic;
      return chapters.includes(chapter);
    });
    Paper2.setQuestions(eligible);
    return eligible.length;
  },

  async startPractice() {
    if (!this.state.subject || typeof Vocabulary === 'undefined') return;

    const chapters = this.state.practiceScope === 'selected'
      ? (this.state.subject === 'Biology SL'
          ? [...(this.state.selectedChapters || [])]
          : [...document.querySelectorAll('#chapter-list input:checked')].map(input => input.value))
      : [];

    if (this.state.practiceScope === 'selected' && !chapters.length) {
      alert('Please select at least one chapter.');
      return;
    }

    this.state.selectedChapters = chapters;
    this.saveState();

    if (this.state.practiceType === 'paper1') {
      await this.ensurePaper1Module();
      if (typeof Paper1 === 'undefined') {
        alert('Paper 1 Practice could not be loaded.');
        return;
      }
      await Paper1.init();
      const learnedUnits = Array.isArray(this.state.biologyLearnedUnits)
        ? [...this.state.biologyLearnedUnits]
        : [];
      if (this.state.subject === 'Biology SL' && !learnedUnits.length) {
        alert('Please select at least one learned unit before starting Paper 1 Practice.');
        return;
      }
      const count = Paper1.loadForSelection(this.state.subject, chapters, this.state.paper1Section, learnedUnits);
      if (!count) {
        alert('No Paper 1 questions are available for the selected chapters and learned units yet.');
        return;
      }
      this.updatePracticeHeader();
      Pages.show('practice');
      return;
    }

    if (this.state.practiceType === 'paper2') {
      const learnedUnits = Array.isArray(this.state.biologyLearnedUnits)
        ? [...this.state.biologyLearnedUnits]
        : [];
      if (this.state.subject === 'Biology SL' && !learnedUnits.length) {
        alert('Please select at least one learned unit before starting Paper 2 Practice.');
        return;
      }
      const count = this.loadPaper2ForSelection(this.state.subject, chapters);
      if (!count) {
        const selectedPaper2 = this.state.paper2Section === 'paper2b' ? 'Paper 2B' : 'Paper 2A';
        alert(this.state.subject === 'Biology SL'
          ? `No ${selectedPaper2} questions are available for the selected chapters and learned units yet.`
          : 'No Paper 2 questions are available for this selection yet.');
        return;
      }
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
      Quiz.questionIndex = 1;
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
      let mode = 'Vocabulary';
      if (this.state.practiceType === 'paper2') {
        mode = this.state.subject === 'Biology SL'
          ? (this.state.paper2Section === 'paper2b' ? 'Paper 2B' : 'Paper 2A')
          : 'Paper 2';
      }
      if (this.state.practiceType === 'paper1') mode = this.state.paper1Section === 'paper1b' ? 'Paper 1B' : 'Paper 1A';
      subject.textContent = `${this.state.subject || ''} · ${mode} · ${scope}`;
    }

    const vocabularyPanel = document.getElementById('vocabulary-practice-panel');
    const paper1Panel = document.getElementById('paper1-practice-panel');
    const paper2Panel = document.getElementById('paper2-practice-panel');
    if (vocabularyPanel) vocabularyPanel.style.display = this.state.practiceType === 'vocabulary' ? 'block' : 'none';
    if (paper1Panel) paper1Panel.style.display = this.state.practiceType === 'paper1' ? 'block' : 'none';
    if (paper2Panel) paper2Panel.style.display = this.state.practiceType === 'paper2' ? 'block' : 'none';
    if (typeof Paper1 !== 'undefined') Paper1.applySectionUI();
    this.applyPracticeTypeUI();
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
    this.state.paper1Section = this.state.paper1Section === 'paper1b' ? 'paper1b' : 'paper1a';
    this.state.paper2Section = this.state.paper2Section === 'paper2b' ? 'paper2b' : 'paper2a';
    if (!Array.isArray(this.state.biologyLearnedUnits)) this.state.biologyLearnedUnits = [];
  },

  saveState() {
    Storage.save('ib_master_trainer_state', this.state);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
