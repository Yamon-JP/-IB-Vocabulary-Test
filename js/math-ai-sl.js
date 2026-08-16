// Math AI SL practice foundation. Additive only; existing subject modules remain untouched.
(() => {
  const MathAISL = window.MathAISL = {
    subject: 'Math AI SL',
    installed: false,
    dataLoaded: false,
    retryTimer: null,
    originals: {},

    topics: [
      { id: 'Topic 1: Number and algebra', label: 'Topic 1: Number and algebra' },
      { id: 'Topic 2: Functions', label: 'Topic 2: Functions' },
      { id: 'Topic 3: Geometry and trigonometry', label: 'Topic 3: Geometry and trigonometry' },
      { id: 'Topic 4: Statistics and probability', label: 'Topic 4: Statistics and probability' },
      { id: 'Topic 5: Calculus', label: 'Topic 5: Calculus' }
    ],

    skills: [
      { id: '1.1 Scientific notation, approximation and error', group: 'Topic 1: Number and algebra' },
      { id: '1.2 Sequences and series', group: 'Topic 1: Number and algebra' },
      { id: '1.3 Financial mathematics', group: 'Topic 1: Number and algebra' },
      { id: '2.1 Linear and piecewise models', group: 'Topic 2: Functions' },
      { id: '2.2 Quadratic models', group: 'Topic 2: Functions' },
      { id: '2.3 Exponential models', group: 'Topic 2: Functions' },
      { id: '3.1 Measurement and 3D geometry', group: 'Topic 3: Geometry and trigonometry' },
      { id: '3.2 Trigonometry and bearings', group: 'Topic 3: Geometry and trigonometry' },
      { id: '3.3 Voronoi diagrams', group: 'Topic 3: Geometry and trigonometry' },
      { id: '4.1 Descriptive statistics', group: 'Topic 4: Statistics and probability' },
      { id: '4.2 Correlation and regression', group: 'Topic 4: Statistics and probability' },
      { id: '4.3 Probability and distributions', group: 'Topic 4: Statistics and probability' },
      { id: '5.1 Rates of change and derivatives', group: 'Topic 5: Calculus' },
      { id: '5.2 Optimization', group: 'Topic 5: Calculus' },
      { id: '5.3 Area and integration', group: 'Topic 5: Calculus' }
    ],

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Math AI SL data could not be loaded.', error);
        return [];
      }
    },

    mergeUnique(existing = [], additions = []) {
      const merged = Array.isArray(existing) ? [...existing] : [];
      const ids = new Set(merged.map(item => item?.id).filter(Boolean));
      (Array.isArray(additions) ? additions : []).forEach(item => {
        if (!item?.id || ids.has(item.id)) return;
        ids.add(item.id);
        merged.push(item);
      });
      return merged;
    },

    async loadData() {
      if (this.dataLoaded) return true;
      const [paper1, paper2] = await Promise.all([
        this.fetchArray('data/math-ai-sl-paper1.json?v=1'),
        this.fetchArray('data/math-ai-sl-paper2.json?v=1')
      ]);
      if (!paper1.length || !paper2.length) return false;

      Paper1.paper1bQuestions = this.mergeUnique(
        Paper1.paper1bQuestions,
        paper1.filter(q => q?.subject === this.subject && q?.assessmentTarget === 'math-paper1')
      );
      Paper2.allQuestions = this.mergeUnique(
        Paper2.allQuestions,
        paper2.filter(q => q?.subject === this.subject && q?.assessmentTarget === 'math-paper2')
      );
      this.dataLoaded = true;
      return true;
    },

    start(attempt = 0) {
      if (this.installed) return;
      const ready = (
        typeof App !== 'undefined'
        && typeof CourseCoverage !== 'undefined'
        && CourseCoverage.installed
        && typeof Paper1 !== 'undefined'
        && Paper1.initialized
        && typeof Paper2 !== 'undefined'
        && Array.isArray(Paper2.allQuestions)
        && Paper2.allQuestions.length > 0
      );

      if (!ready) {
        if (attempt >= 400) {
          console.warn('Math AI SL module could not initialize. Existing subjects remain available.');
          return;
        }
        this.retryTimer = setTimeout(() => this.start(attempt + 1), 50);
        return;
      }

      this.loadData().then(loaded => {
        if (!loaded) {
          if (attempt < 400) this.retryTimer = setTimeout(() => this.start(attempt + 1), 100);
          return;
        }
        this.install();
      });
    },

    install() {
      if (this.installed) return;
      this.installed = true;
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.registerCoverage();
      this.patchSubjectCards();
      this.patchChapterSelector();
      this.patchSubjectSelection();
      this.patchPracticeType();
      this.patchPaper1();
      this.patchPaper2();
      this.patchPracticeStart();
      this.patchPracticeHeader();
      App.renderSubjectCards();
      App.renderChapterSelector();
      App.applyPracticeTypeUI();
      CourseCoverage.render();
    },

    registerCoverage() {
      CourseCoverage.registerProvider(this.subject, {
        itemNoun: 'skills',
        visible: state => state?.subject === this.subject && ['paper1', 'paper2'].includes(state?.practiceType),
        getItems: () => this.skills.map(skill => ({
          id: skill.id,
          label: skill.id,
          group: skill.group,
          groupLabel: skill.group
        }))
      });
      if (!CourseCoverage.hasSubject(this.subject)) {
        CourseCoverage.setSelected(this.subject, [], { syncLegacy: false });
      }
    },

    patchSubjectCards() {
      if (App.__mathAISLSubjectCards) return;
      this.originals.renderSubjectCards = App.renderSubjectCards;
      App.renderSubjectCards = function(...args) {
        const result = MathAISL.originals.renderSubjectCards.apply(this, args);
        const container = document.getElementById('subject-list');
        if (container && !document.getElementById('subject-math-ai-sl')) {
          const button = document.createElement('button');
          button.id = 'subject-math-ai-sl';
          button.className = 'subject-card';
          button.type = 'button';
          button.onclick = () => App.selectSubject(MathAISL.subject);
          button.innerHTML = '<strong>Math AI SL</strong><small>Paper 1 / Paper 2 Practice</small>';
          container.appendChild(button);
        }
        return result;
      };
      App.__mathAISLSubjectCards = true;
    },

    patchChapterSelector() {
      if (App.__mathAISLChapterSelector) return;
      this.originals.renderChapterSelector = App.renderChapterSelector;
      App.renderChapterSelector = function(...args) {
        if (this.state.subject !== MathAISL.subject) {
          return MathAISL.originals.renderChapterSelector.apply(this, args);
        }
        const title = document.getElementById('selection-subject');
        const list = document.getElementById('chapter-list');
        if (!title || !list) return;
        title.textContent = MathAISL.subject;
        const selected = new Set(this.state.selectedChapters || []);
        list.innerHTML = MathAISL.topics.map((topic, index) => `
          <label class="chapter-option">
            <input type="checkbox"
              value="${topic.id}"
              data-chapter-index="${index}"
              ${selected.has(topic.id) ? 'checked' : ''}
              onchange="App.toggleChapterSelection(this.value, this.checked)">
            <span>${topic.label}</span>
          </label>`).join('');
      };
      App.__mathAISLChapterSelector = true;
    },

    patchSubjectSelection() {
      if (App.__mathAISLSubjectSelection) return;
      this.originals.selectSubject = App.selectSubject;
      App.selectSubject = function(subject) {
        const result = MathAISL.originals.selectSubject.call(this, subject);
        if (subject !== MathAISL.subject) return result;
        this.state.practiceType = 'paper1';
        this.state.paper1Section = 'paper1b';
        this.state.paper2Section = 'math-paper2';
        this.state.practiceScope = 'all';
        this.state.selectedChapters = [];
        this.state.practiceWord = null;
        this.saveState();
        this.renderChapterSelector();
        this.applyPracticeTypeUI();
        this.applyPracticeScopeUI();
        CourseCoverage.render();
        return result;
      };
      App.__mathAISLSubjectSelection = true;
    },

    patchPracticeType() {
      if (App.__mathAISLPracticeType) return;
      this.originals.setPracticeType = App.setPracticeType;
      this.originals.applyPracticeTypeUI = App.applyPracticeTypeUI;

      App.setPracticeType = function(type) {
        if (this.state.subject !== MathAISL.subject) {
          return MathAISL.originals.setPracticeType.call(this, type);
        }
        if (!['paper1', 'paper2'].includes(type)) return;
        this.state.practiceType = type;
        this.state.paper1Section = 'paper1b';
        this.state.paper2Section = 'math-paper2';
        this.saveState();
        this.applyPracticeTypeUI();
      };

      App.applyPracticeTypeUI = function(...args) {
        if (this.state.subject !== MathAISL.subject) {
          return MathAISL.originals.applyPracticeTypeUI.apply(this, args);
        }
        this.state.practiceType = this.state.practiceType === 'paper2' ? 'paper2' : 'paper1';
        this.state.paper1Section = 'paper1b';
        this.state.paper2Section = 'math-paper2';

        const vocabularyButton = document.getElementById('type-vocabulary');
        const paper1Button = document.getElementById('type-paper1');
        const paper2Button = document.getElementById('type-paper2');
        const typeGrid = document.querySelector('.practice-type-grid');
        const paper1Control = document.getElementById('paper1-section-control');
        const paper2Control = document.getElementById('paper2-section-control');

        if (vocabularyButton) vocabularyButton.hidden = true;
        if (paper1Button) {
          paper1Button.hidden = false;
          paper1Button.classList.toggle('active', this.state.practiceType === 'paper1');
          const description = paper1Button.querySelector('small');
          if (description) description.textContent = 'Short-response questions with calculator technology';
        }
        if (paper2Button) {
          paper2Button.hidden = false;
          paper2Button.classList.toggle('active', this.state.practiceType === 'paper2');
          const description = paper2Button.querySelector('small');
          if (description) description.textContent = 'Extended-response modeling and interpretation';
        }
        if (typeGrid) typeGrid.classList.add('has-paper1');
        if (paper1Control) paper1Control.style.display = 'none';
        if (paper2Control) paper2Control.style.display = 'none';

        if (typeof Paper1 !== 'undefined') Paper1.applySectionUI();
        CourseCoverage.render();
      };
      App.__mathAISLPracticeType = true;
    },

    patchPaper1() {
      if (Paper1.__mathAISLPatched) return;
      this.originals.paper1ApplySectionUI = Paper1.applySectionUI;
      this.originals.paper1LoadForSelection = Paper1.loadForSelection;

      Paper1.applySectionUI = function(...args) {
        const result = MathAISL.originals.paper1ApplySectionUI.apply(this, args);
        if (typeof App === 'undefined' || App.state.subject !== MathAISL.subject) return result;
        this.section = 'paper1b';
        const panelA = document.getElementById('paper1a-panel');
        const panelB = document.getElementById('paper1b-panel');
        const control = document.getElementById('paper1-section-control');
        const title = document.getElementById('paper1-section-title');
        const score = document.getElementById('paper1-header-score');
        const type = document.getElementById('paper1-question-type');
        if (panelA) panelA.style.display = 'none';
        if (panelB) panelB.style.display = 'block';
        if (control) control.style.display = 'none';
        if (title) title.textContent = 'Math AI SL · Paper 1';
        if (score) score.textContent = 'Short-response practice';
        if (type) type.textContent = 'Show mathematical working and use technology where appropriate.';
        return result;
      };

      Paper1.loadForSelection = function(subject, chapters = [], section = 'paper1b', learnedUnits = []) {
        if (subject !== MathAISL.subject) {
          return MathAISL.originals.paper1LoadForSelection.call(this, subject, chapters, section, learnedUnits);
        }
        this.section = 'paper1b';
        const selected = new Set(Array.isArray(learnedUnits) && learnedUnits.length
          ? learnedUnits
          : CourseCoverage.getSelected(MathAISL.subject));
        this.questions = this.paper1bQuestions.filter(question => {
          if (question?.subject !== MathAISL.subject || question?.assessmentTarget !== 'math-paper1') return false;
          const required = Array.isArray(question.requiredUnits)
            ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
            : [];
          if (!required.length || !required.every(unit => selected.has(unit))) return false;
          if (!chapters.length) return true;
          const chapter = question.chapter || question.topic;
          return chapters.includes(chapter);
        });
        this.current = this.pickQuestion();
        this.render();
        return this.questions.length;
      };
      Paper1.__mathAISLPatched = true;
    },

    patchPaper2() {
      if (App.__mathAISLPaper2) return;
      this.originals.loadPaper2ForSelection = App.loadPaper2ForSelection.bind(App);
      App.loadPaper2ForSelection = (subject, chapters = []) => {
        if (subject !== MathAISL.subject) {
          return MathAISL.originals.loadPaper2ForSelection(subject, chapters);
        }
        const selected = new Set(CourseCoverage.getSelected(MathAISL.subject));
        const eligible = (Array.isArray(Paper2.allQuestions) ? Paper2.allQuestions : []).filter(question => {
          if (question?.subject !== MathAISL.subject || question?.assessmentTarget !== 'math-paper2') return false;
          const required = Array.isArray(question.requiredUnits)
            ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
            : [];
          if (!required.length || !required.every(unit => selected.has(unit))) return false;
          if (!chapters.length) return true;
          const chapter = question.chapter || question.topic;
          return chapters.includes(chapter);
        });
        Paper2.setQuestions(eligible);
        return eligible.length;
      };
      App.__mathAISLPaper2 = true;
    },

    async startMathPractice() {
      const chapters = App.state.practiceScope === 'selected'
        ? [...(App.state.selectedChapters || [])]
        : [];
      if (App.state.practiceScope === 'selected' && !chapters.length) {
        alert('Please select at least one Math topic.');
        return;
      }
      const learned = CourseCoverage.getSelected(this.subject);
      if (!learned.length) {
        alert('Please select at least one learned Math skill before starting practice.');
        Pages.show('selection');
        return;
      }

      App.state.selectedChapters = chapters;
      App.state.paper1Section = 'paper1b';
      App.state.paper2Section = 'math-paper2';
      App.saveState();

      let count = 0;
      if (App.state.practiceType === 'paper2') {
        count = App.loadPaper2ForSelection(this.subject, chapters);
      } else {
        await App.ensurePaper1Module();
        await Paper1.init();
        count = Paper1.loadForSelection(this.subject, chapters, 'paper1b', learned);
      }

      if (!count) {
        alert('No Math questions are available for the selected topics and learned skills yet.');
        Pages.show('selection');
        return;
      }
      App.updatePracticeHeader();
      Pages.show('practice');
    },

    patchPracticeStart() {
      if (App.__mathAISLPracticeStart) return;
      this.originals.startPractice = App.startPractice;
      this.originals.openPractice = App.openPractice;

      App.startPractice = async function(...args) {
        if (this.state.subject === MathAISL.subject) return MathAISL.startMathPractice();
        return MathAISL.originals.startPractice.apply(this, args);
      };
      App.openPractice = async function(...args) {
        if (this.state.subject === MathAISL.subject) return MathAISL.startMathPractice();
        return MathAISL.originals.openPractice.apply(this, args);
      };
      App.__mathAISLPracticeStart = true;
    },

    patchPracticeHeader() {
      if (App.__mathAISLPracticeHeader) return;
      this.originals.updatePracticeHeader = App.updatePracticeHeader;
      App.updatePracticeHeader = function(...args) {
        const result = MathAISL.originals.updatePracticeHeader.apply(this, args);
        if (this.state.subject !== MathAISL.subject) return result;
        const subject = document.getElementById('selection-subject-practice');
        const scope = this.state.practiceScope === 'selected' && this.state.selectedChapters.length
          ? this.state.selectedChapters.join(', ')
          : 'All Topics';
        const mode = this.state.practiceType === 'paper2' ? 'Paper 2' : 'Paper 1';
        if (subject) subject.textContent = `${MathAISL.subject} · ${mode} · ${scope}`;
        const paper2Title = document.getElementById('paper2-section-title');
        if (paper2Title && this.state.practiceType === 'paper2') paper2Title.textContent = 'Math AI SL · Paper 2';
        return result;
      };
      App.__mathAISLPracticeHeader = true;
    }
  };

  MathAISL.start();
})();
