const EssCourseCoverage = {
  installed: false,
  retryTimer: null,
  originalApplyPracticeTypeUI: null,
  originalPaper1LoadForSelection: null,
  originalLoadPaper2ForSelection: null,

  start(attempt = 0) {
    if (this.installed) return;

    const ready = (
      typeof App !== 'undefined'
      && typeof CourseCoverage !== 'undefined'
      && CourseCoverage.installed
      && typeof EssExam !== 'undefined'
      && EssExam.originals?.appPatched
      && EssExam.originals?.paper1Patched
      && typeof Paper1 !== 'undefined'
      && typeof Paper2 !== 'undefined'
    );

    if (!ready) {
      if (attempt >= 120) {
        console.warn('ESS Course Coverage could not initialize. Existing ESS practice remains available.');
        return;
      }
      this.retryTimer = setTimeout(() => this.start(attempt + 1), 50);
      return;
    }

    this.install();
  },

  install() {
    if (this.installed) return;
    this.installed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);

    this.registerProvider();
    this.patchPracticeTypeUI();
    this.patchPaper1Coverage();
    this.patchPaper2Coverage();
    CourseCoverage.render();
  },

  inferGroup(unit, fallback = '') {
    const value = String(unit || '').trim();
    const topic = value.match(/^(\d+)(?:\.|\b)/);
    if (topic) return `Topic ${topic[1]}`;
    if (/^HL\./i.test(value)) return 'HL Lenses';
    return String(fallback || 'Other');
  },

  collectCoverageItems() {
    const items = new Map();

    const add = (unit, chapter = '') => {
      const id = String(unit || '').trim();
      if (!id || items.has(id)) return;
      const group = this.inferGroup(id, chapter);
      items.set(id, {
        id,
        label: id,
        group,
        groupLabel: group
      });
    };

    if (typeof Vocabulary !== 'undefined' && Array.isArray(Vocabulary.allWords)) {
      Vocabulary.allWords
        .filter(word => word?.subject === 'ESS HL')
        .forEach(word => add(word.unit, word.chapter || word.topic));
    }

    const examQuestions = [];
    if (Array.isArray(Paper1?.essPaper1Questions)) examQuestions.push(...Paper1.essPaper1Questions);
    if (Array.isArray(Paper2?.allQuestions)) {
      examQuestions.push(...Paper2.allQuestions.filter(question => question?.subject === 'ESS HL'));
    }

    examQuestions.forEach(question => {
      const requiredUnits = Array.isArray(question?.requiredUnits) ? question.requiredUnits : [];
      requiredUnits.forEach(unit => add(unit, question.chapter || question.topic));
    });

    const groupRank = group => {
      const topic = String(group).match(/^Topic\s+(\d+)$/i);
      if (topic) return Number(topic[1]);
      if (group === 'HL Lenses') return 100;
      return 200;
    };

    return [...items.values()].sort((a, b) => {
      const groupDifference = groupRank(a.group) - groupRank(b.group);
      if (groupDifference) return groupDifference;
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });
  },

  registerProvider() {
    CourseCoverage.registerProvider('ESS HL', {
      itemNoun: 'units',
      visible: state => state?.subject === 'ESS HL' && ['paper1', 'paper2'].includes(state?.practiceType),
      getItems: () => this.collectCoverageItems()
    });

    if (!CourseCoverage.hasSubject('ESS HL')) {
      CourseCoverage.setSelected('ESS HL', [], { syncLegacy: false });
    }
  },

  getSelected(subject) {
    if (typeof App?.getCourseCoverageItems === 'function') {
      return App.getCourseCoverageItems(subject);
    }
    return CourseCoverage.getSelected(subject);
  },

  patchPracticeTypeUI() {
    if (App.__essCourseCoverageUI) return;
    this.originalApplyPracticeTypeUI = App.applyPracticeTypeUI;

    App.applyPracticeTypeUI = function(...args) {
      const result = EssCourseCoverage.originalApplyPracticeTypeUI.apply(this, args);
      CourseCoverage.render();
      return result;
    };

    App.__essCourseCoverageUI = true;
  },

  patchPaper1Coverage() {
    if (Paper1.__essCourseCoverage) return;
    this.originalPaper1LoadForSelection = Paper1.loadForSelection;

    Paper1.loadForSelection = function(subject, chapters = [], section = 'paper1a', learnedUnits = []) {
      const result = EssCourseCoverage.originalPaper1LoadForSelection.call(
        this,
        subject,
        chapters,
        section,
        learnedUnits
      );

      if (subject !== 'ESS HL') return result;

      const selected = new Set(
        Array.isArray(learnedUnits) && learnedUnits.length
          ? learnedUnits
          : EssCourseCoverage.getSelected(subject)
      );

      this.questions = (Array.isArray(this.questions) ? this.questions : []).filter(question => {
        const requiredUnits = Array.isArray(question?.requiredUnits)
          ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
          : [];
        return requiredUnits.length > 0 && requiredUnits.every(unit => selected.has(unit));
      });

      this.current = this.pickQuestion();
      this.render();
      return this.questions.length;
    };

    Paper1.__essCourseCoverage = true;
  },

  patchPaper2Coverage() {
    if (App.__essCourseCoveragePaper2) return;
    this.originalLoadPaper2ForSelection = App.loadPaper2ForSelection.bind(App);

    App.loadPaper2ForSelection = (subject, chapters = []) => {
      const result = this.originalLoadPaper2ForSelection(subject, chapters);
      if (!['Biology SL', 'ESS HL'].includes(subject) || typeof Paper2 === 'undefined') return result;

      const selected = new Set(this.getSelected(subject));
      const eligible = (Array.isArray(Paper2.questions) ? Paper2.questions : []).filter(question => {
        const requiredUnits = Array.isArray(question?.requiredUnits)
          ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
          : [];
        return requiredUnits.length > 0 && requiredUnits.every(unit => selected.has(unit));
      });

      Paper2.setQuestions(eligible);
      return eligible.length;
    };

    App.__essCourseCoveragePaper2 = true;
  }
};

EssCourseCoverage.start();
