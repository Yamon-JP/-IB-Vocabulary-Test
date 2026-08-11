const EssExam = {
  initialized: false,
  modulesPatched: false,
  dataLoaded: false,
  caseStudies: [],
  paper1Questions: [],
  paper2SectionAQuestions: [],
  paper2SectionBQuestions: [],
  originals: {},
  stateKey: 'ib_ess_exam_state',

  async init() {
    if (this.initialized) {
      this.applyUI();
      return;
    }
    this.initialized = true;
    this.patchApp();
    this.restoreEssState();

    const ready = await this.waitForExamModules();
    if (!ready) {
      console.warn('ESS exam foundation could not find Paper 1 / Paper 2 modules.');
      return;
    }

    this.patchPaper1();
    this.patchPaper2();
    await this.loadData();
    this.applyUI();
  },

  waitForExamModules(attempt = 0) {
    if (typeof Paper1 !== 'undefined' && typeof Paper2 !== 'undefined') return Promise.resolve(true);
    if (attempt >= 100) return Promise.resolve(false);
    return new Promise(resolve => {
      setTimeout(() => resolve(this.waitForExamModules(attempt + 1)), 50);
    });
  },

  loadJson(source) {
    return fetch(source)
      .then(response => {
        if (!response.ok) throw new Error(`ESS exam data not found: ${source}`);
        return response.json();
      })
      .then(data => Array.isArray(data) ? data : [])
      .catch(error => {
        console.warn(`ESS exam data is not available: ${source}`, error);
        return [];
      });
  },

  async loadData() {
    const [caseStudies, paper1, sectionA, sectionB, sectionBFinalSets] = await Promise.all([
      this.loadJson('data/paper1/ess-case-studies.json'),
      this.loadJson('data/paper1/ess-paper1.json'),
      this.loadJson('data/paper2/ess-section-a.json'),
      this.loadJson('data/paper2/ess-section-b.json'),
      this.loadJson('data/paper2/ess-section-b-sets-7-8.json')
    ]);

    const combinedSectionB = [...sectionB, ...sectionBFinalSets];

    this.caseStudies = caseStudies;
    this.paper1Questions = paper1.filter(question => question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess-paper1');
    this.paper2SectionAQuestions = sectionA
      .filter(question => question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess2a')
      .map(question => this.normalizeEssPaper2Question(question));
    this.paper2SectionBQuestions = combinedSectionB
      .filter(question => question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess2b')
      .map(question => this.normalizeEssPaper2Question(question));

    this.attachData();
    this.dataLoaded = true;
  },

  attachData() {
    if (typeof Paper1 !== 'undefined') {
      Paper1.essPaper1Questions = [...this.paper1Questions];
      Paper1.essCaseStudies = [...this.caseStudies];
    }

    if (typeof Paper2 !== 'undefined') {
      const nonEss = Array.isArray(Paper2.allQuestions)
        ? Paper2.allQuestions.filter(question => question?.subject !== 'ESS HL')
        : [];
      Paper2.allQuestions = [
        ...nonEss,
        ...this.paper2SectionAQuestions,
        ...this.paper2SectionBQuestions
      ];
    }
  },

  normalizeEssPaper2Question(question) {
    const parts = Array.isArray(question?.parts) ? question.parts : [];
    if (!parts.length) return question;

    const marks = Number(question.marks) || parts.reduce((sum, part) => sum + (Number(part?.marks) || 0), 0);
    const markscheme = Array.isArray(question.markscheme) && question.markscheme.length
      ? question.markscheme
      : parts.flatMap(part => Array.isArray(part?.markscheme) ? part.markscheme : []);
    const markschemeJa = Array.isArray(question.markschemeJa) && question.markschemeJa.length
      ? question.markschemeJa
      : parts.flatMap(part => Array.isArray(part?.markschemeJa) ? part.markschemeJa : []);
    const modelAnswer = question.modelAnswer || parts
      .map(part => part?.modelAnswer ? `(${part.label || ''}) ${part.modelAnswer}` : '')
      .filter(Boolean)
      .join('\n\n');
    const modelAnswerJa = question.modelAnswerJa || parts
      .map(part => part?.modelAnswerJa ? `(${part.label || ''}) ${part.modelAnswerJa}` : '')
      .filter(Boolean)
      .join('\n\n');

    return {
      ...question,
      marks,
      commandTerm: question.commandTerm || 'Structured response',
      markscheme,
      markschemeJa,
      modelAnswer,
      modelAnswerJa
    };
  },

  saveEssState() {
    if (typeof Storage === 'undefined' || typeof App === 'undefined') return;
    Storage.save(this.stateKey, {
      practiceType: App.state.practiceType,
      paper2Section: App.state.paper2Section === 'ess2b' ? 'ess2b' : 'ess2a'
    });
  },

  restoreEssState() {
    if (typeof Storage === 'undefined' || typeof App === 'undefined' || App.state.subject !== 'ESS HL') return;
    const saved = Storage.load(this.stateKey) || {};
    App.state.paper1Section = 'esspaper1';
    App.state.paper2Section = saved.paper2Section === 'ess2b' ? 'ess2b' : 'ess2a';
    if (['vocabulary', 'paper1', 'paper2'].includes(saved.practiceType)) {
      App.state.practiceType = saved.practiceType;
    }
    App.saveState();
  },

  patchApp() {
    if (typeof App === 'undefined' || this.originals.appPatched) return;
    this.originals.appPatched = true;
    this.originals.selectSubject = App.selectSubject.bind(App);
    this.originals.updatePracticeHeader = App.updatePracticeHeader.bind(App);

    App.selectSubject = subject => {
      this.originals.selectSubject(subject);
      if (subject !== 'ESS HL') return;
      App.state.paper1Section = 'esspaper1';
      App.state.paper2Section = 'ess2a';
      App.saveState();
      this.saveEssState();
      App.applyPracticeTypeUI();
    };

    App.setPracticeType = type => {
      const allowed = ['vocabulary', 'paper1', 'paper2'];
      if (!allowed.includes(type)) return;
      const paper1Available = ['Biology SL', 'ESS HL'].includes(App.state.subject);
      if (type === 'paper1' && !paper1Available) return;

      App.state.practiceType = type;
      if (type === 'paper1') {
        App.state.paper1Section = App.state.subject === 'ESS HL'
          ? 'esspaper1'
          : (App.state.paper1Section === 'paper1b' ? 'paper1b' : 'paper1a');
      }
      if (type === 'paper2') {
        if (App.state.subject === 'ESS HL') {
          App.state.paper2Section = App.state.paper2Section === 'ess2b' ? 'ess2b' : 'ess2a';
        } else if (App.state.subject === 'Biology SL') {
          App.state.paper2Section = App.state.paper2Section === 'paper2b' ? 'paper2b' : 'paper2a';
        }
      }

      App.applyPracticeTypeUI();
      App.saveState();
      if (App.state.subject === 'ESS HL') this.saveEssState();
    };

    App.setPaper1Section = section => {
      if (App.state.subject === 'ESS HL') {
        App.state.paper1Section = 'esspaper1';
      } else if (App.state.subject === 'Biology SL') {
        App.state.paper1Section = section === 'paper1b' ? 'paper1b' : 'paper1a';
      } else {
        return;
      }
      App.saveState();
      App.applyPracticeTypeUI();
      if (typeof Paper1 !== 'undefined') Paper1.applySectionUI();
    };

    App.setPaper2Section = section => {
      if (App.state.subject === 'ESS HL') {
        App.state.paper2Section = ['paper2b', 'ess2b'].includes(section) ? 'ess2b' : 'ess2a';
        this.saveEssState();
      } else if (App.state.subject === 'Biology SL') {
        App.state.paper2Section = section === 'paper2b' ? 'paper2b' : 'paper2a';
      } else {
        return;
      }
      App.saveState();
      App.applyPracticeTypeUI();
      App.updatePracticeHeader();
    };

    App.applyPracticeTypeUI = () => {
      const vocabularyButton = document.getElementById('type-vocabulary');
      const paper1Button = document.getElementById('type-paper1');
      const paper2Button = document.getElementById('type-paper2');
      const typeGrid = document.querySelector('.practice-type-grid');
      const paper1Control = document.getElementById('paper1-section-control');
      const paper2Control = document.getElementById('paper2-section-control');
      const paper1Available = ['Biology SL', 'ESS HL'].includes(App.state.subject);
      const biologyPaper1 = App.state.subject === 'Biology SL';
      const sectionedPaper2 = ['Biology SL', 'ESS HL'].includes(App.state.subject);

      if (App.state.practiceType === 'paper1' && !paper1Available) App.state.practiceType = 'vocabulary';

      if (paper1Button) {
        paper1Button.hidden = !paper1Available;
        const description = paper1Button.querySelector('small');
        if (description) {
          description.textContent = App.state.subject === 'ESS HL'
            ? 'ESS case-study and resource-booklet analysis'
            : 'Biology multiple-choice and data-based analysis';
        }
      }
      if (typeGrid) typeGrid.classList.toggle('has-paper1', paper1Available);

      if (vocabularyButton) vocabularyButton.classList.toggle('active', App.state.practiceType === 'vocabulary');
      if (paper1Button) paper1Button.classList.toggle('active', App.state.practiceType === 'paper1');
      if (paper2Button) paper2Button.classList.toggle('active', App.state.practiceType === 'paper2');
      if (paper1Control) paper1Control.style.display = App.state.practiceType === 'paper1' && biologyPaper1 ? 'block' : 'none';
      if (paper2Control) paper2Control.style.display = App.state.practiceType === 'paper2' && sectionedPaper2 ? 'block' : 'none';

      const paper2Heading = paper2Control?.querySelector('h3');
      const paper2AButton = document.getElementById('section-paper2a');
      const paper2BButton = document.getElementById('section-paper2b');
      const paper2ATitle = paper2AButton?.querySelector('strong');
      const paper2ADescription = paper2AButton?.querySelector('small');
      const paper2BTitle = paper2BButton?.querySelector('strong');
      const paper2BDescription = paper2BButton?.querySelector('small');

      if (App.state.subject === 'ESS HL') {
        if (paper2Heading) paper2Heading.textContent = 'Paper 2 Section';
        if (paper2ATitle) paper2ATitle.textContent = 'Section A';
        if (paper2ADescription) paper2ADescription.textContent = 'Short-answer, calculation and data-based practice';
        if (paper2BTitle) paper2BTitle.textContent = 'Section B';
        if (paper2BDescription) paper2BDescription.textContent = '20-mark structured essay practice';
        if (paper2AButton) paper2AButton.classList.toggle('active', App.state.paper2Section !== 'ess2b');
        if (paper2BButton) paper2BButton.classList.toggle('active', App.state.paper2Section === 'ess2b');
      } else {
        if (paper2Heading) paper2Heading.textContent = 'Paper 2 Section';
        if (paper2ATitle) paper2ATitle.textContent = 'Paper 2A';
        if (paper2ADescription) paper2ADescription.textContent = 'Data-based and structured short-answer practice';
        if (paper2BTitle) paper2BTitle.textContent = 'Paper 2B';
        if (paper2BDescription) paper2BDescription.textContent = 'Longer written responses and integrated explanations';
        if (paper2AButton) paper2AButton.classList.toggle('active', App.state.paper2Section !== 'paper2b');
        if (paper2BButton) paper2BButton.classList.toggle('active', App.state.paper2Section === 'paper2b');
      }

      const paper2Title = document.getElementById('paper2-section-title');
      if (paper2Title) {
        if (App.state.subject === 'ESS HL') {
          paper2Title.textContent = App.state.paper2Section === 'ess2b'
            ? 'Paper 2 · Section B Practice'
            : 'Paper 2 · Section A Practice';
        } else if (App.state.subject === 'Biology SL') {
          paper2Title.textContent = `${App.state.paper2Section === 'paper2b' ? 'Paper 2B' : 'Paper 2A'} Practice`;
        } else {
          paper2Title.textContent = 'Paper 2 Practice';
        }
      }

      if (typeof Paper1 !== 'undefined') {
        Paper1.applySectionUI();
        if (typeof Paper1.renderLearnedUnitSelector === 'function') Paper1.renderLearnedUnitSelector();
      }
    };

    App.loadPaper2ForSelection = (subject, chapters = []) => {
      if (typeof Paper2 === 'undefined') return 0;
      const learned = new Set(subject === 'Biology SL' && Array.isArray(App.state.biologyLearnedUnits)
        ? App.state.biologyLearnedUnits
        : []);
      const eligible = (Array.isArray(Paper2.allQuestions) ? Paper2.allQuestions : []).filter(question => {
        if (question.subject !== subject) return false;

        if (subject === 'Biology SL') {
          if (question.assessmentTarget !== App.state.paper2Section) return false;
          const requiredUnits = Array.isArray(question.requiredUnits)
            ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
            : [];
          if (!requiredUnits.length) return false;
          if (!requiredUnits.every(unit => learned.has(unit))) return false;
        }

        if (subject === 'ESS HL') {
          if (question.assessmentTarget !== App.state.paper2Section) return false;
          const requiredUnits = Array.isArray(question.requiredUnits)
            ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
            : [];
          if (!requiredUnits.length) return false;
        }

        if (!chapters.length) return true;
        const questionChapters = Array.isArray(question.chapters) ? question.chapters : [];
        const chapter = question.chapter || question.topic;
        return chapters.includes(chapter) || questionChapters.some(value => chapters.includes(value));
      });
      Paper2.setQuestions(eligible);
      return eligible.length;
    };

    App.updatePracticeHeader = () => {
      this.originals.updatePracticeHeader();
      if (App.state.subject !== 'ESS HL') return;

      const subject = document.getElementById('selection-subject-practice');
      if (subject) {
        const scope = App.state.practiceScope === 'selected' && App.state.selectedChapters.length
          ? App.state.selectedChapters.join(', ')
          : 'All Chapters';
        let mode = 'Vocabulary';
        if (App.state.practiceType === 'paper1') mode = 'Paper 1';
        if (App.state.practiceType === 'paper2') {
          mode = App.state.paper2Section === 'ess2b' ? 'Paper 2 Section B' : 'Paper 2 Section A';
        }
        subject.textContent = `ESS HL · ${mode} · ${scope}`;
      }
    };
  },

  patchPaper1() {
    if (typeof Paper1 === 'undefined' || this.originals.paper1Patched) return;
    this.originals.paper1Patched = true;
    this.originals.paper1Init = Paper1.init.bind(Paper1);
    this.originals.paper1NormalizeSection = Paper1.normalizeSection.bind(Paper1);
    this.originals.paper1ApplySectionUI = Paper1.applySectionUI.bind(Paper1);
    this.originals.paper1LoadForSelection = Paper1.loadForSelection.bind(Paper1);
    this.originals.paper1RenderEmptyState = Paper1.renderEmptyState.bind(Paper1);
    this.originals.paper1Render = Paper1.render.bind(Paper1);
    this.originals.paper1SubmitPaper1B = Paper1.submitPaper1B.bind(Paper1);
    this.originals.paper1SavePaper1BAttempt = Paper1.savePaper1BAttempt.bind(Paper1);

    Paper1.essPaper1Questions = [];
    Paper1.essCaseStudies = [];

    Paper1.init = async (...args) => {
      const result = await this.originals.paper1Init(...args);
      this.attachData();
      this.applyUI();
      return result;
    };

    Paper1.normalizeSection = section => {
      if (section === 'esspaper1') return 'esspaper1';
      return this.originals.paper1NormalizeSection(section);
    };

    Paper1.applySectionUI = () => {
      if (typeof App !== 'undefined' && App.state.subject === 'ESS HL') {
        Paper1.section = 'esspaper1';
        const panelA = document.getElementById('paper1a-panel');
        const panelB = document.getElementById('paper1b-panel');
        if (panelA) panelA.style.display = 'none';
        if (panelB) panelB.style.display = 'block';

        const title = document.getElementById('paper1-section-title');
        const score = document.getElementById('paper1-header-score');
        const type = document.getElementById('paper1-question-type');
        if (title) title.textContent = 'ESS Paper 1 · Case Study';
        if (score) score.textContent = 'Resource-booklet analysis';
        if (type) type.textContent = 'Use the case-study resources, data and ESS knowledge.';
        return;
      }
      this.originals.paper1ApplySectionUI();
    };

    Paper1.loadForSelection = (subject, chapters = [], section = 'paper1a', learnedUnits = []) => {
      if (subject !== 'ESS HL') {
        return this.originals.paper1LoadForSelection(subject, chapters, section, learnedUnits);
      }

      Paper1.section = 'esspaper1';
      Paper1.questions = (Array.isArray(Paper1.essPaper1Questions) ? Paper1.essPaper1Questions : []).filter(question => {
        if (question.subject !== 'ESS HL' || question.assessmentTarget !== 'ess-paper1') return false;
        const requiredUnits = Array.isArray(question.requiredUnits)
          ? question.requiredUnits.filter(unit => typeof unit === 'string' && unit.trim())
          : [];
        if (!requiredUnits.length) return false;
        if (!chapters.length) return true;
        const questionChapters = Array.isArray(question.chapters) ? question.chapters : [];
        const chapter = question.chapter || question.topic;
        return chapters.includes(chapter) || questionChapters.some(value => chapters.includes(value));
      });
      Paper1.current = Paper1.pickQuestion();
      Paper1.render();
      return Paper1.questions.length;
    };

    Paper1.renderEmptyState = () => {
      if (typeof App !== 'undefined' && App.state.subject === 'ESS HL') {
        const questionA = document.getElementById('paper1a-question');
        const choices = document.getElementById('paper1a-choices');
        const questionB = document.getElementById('paper1b-question');
        if (questionA) questionA.innerHTML = '';
        if (choices) choices.innerHTML = '';
        if (questionB) questionB.innerHTML = '<p class="muted">No ESS Paper 1 questions are available for this selection yet.</p>';
        return;
      }
      this.originals.paper1RenderEmptyState();
    };

    Paper1.render = () => {
      if (Paper1.section !== 'esspaper1') {
        this.originals.paper1Render();
        return;
      }

      Paper1.selectedChoice = null;
      Paper1.answerLocked = false;
      Paper1.attemptSaved = false;
      Paper1.applySectionUI();

      if (!Paper1.current) {
        Paper1.renderEmptyState();
        const chapter = document.getElementById('paper1-chapter');
        if (chapter) chapter.textContent = '—';
        return;
      }

      const chapter = document.getElementById('paper1-chapter');
      if (chapter) {
        chapter.textContent = Paper1.current.chapter
          || Paper1.current.topic
          || (Array.isArray(Paper1.current.chapters) ? Paper1.current.chapters.join(', ') : '—');
      }
      this.renderEssPaper1Question();
    };

    Paper1.submitPaper1B = () => {
      if (Paper1.section !== 'esspaper1') {
        this.originals.paper1SubmitPaper1B();
        return;
      }
      const savedSection = Paper1.section;
      Paper1.section = 'paper1b';
      this.originals.paper1SubmitPaper1B();
      Paper1.section = savedSection;
    };

    Paper1.savePaper1BAttempt = () => {
      if (Paper1.section !== 'esspaper1') {
        this.originals.paper1SavePaper1BAttempt();
        return;
      }
      this.saveEssPaper1Attempt();
    };
  },

  renderEssPaper1Question() {
    if (typeof Paper1 === 'undefined' || !Paper1.current) return;
    const question = document.getElementById('paper1b-question');
    const marks = document.getElementById('paper1b-marks');
    const command = document.getElementById('paper1b-command');
    const answer = document.getElementById('paper1b-answer');
    const feedback = document.getElementById('paper1b-feedback');
    if (!question) return;

    const caseStudy = this.caseStudies.find(item => item?.id === Paper1.current.caseStudyId) || null;
    const resourceBooklet = this.renderCaseStudy(caseStudy);
    const localStimulus = Paper1.renderStimulus(Paper1.current.stimulus);
    question.innerHTML = `${resourceBooklet}${localStimulus}<div class="paper1-question-text">${Paper1.escapeHtml(Paper1.current.question || '')}</div>`;
    if (marks) marks.textContent = Paper1.current.marks ?? '—';
    if (command) command.textContent = Paper1.current.commandTerm || '—';
    if (answer) answer.value = '';
    if (feedback) feedback.innerHTML = '';
  },

  renderCaseStudy(caseStudy) {
    if (!caseStudy || typeof Paper1 === 'undefined') return '';
    const resources = Array.isArray(caseStudy.resources) ? caseStudy.resources : [];
    const resourceHtml = resources.map(resource => {
      if (resource?.type === 'table' || resource?.type === 'lineGraph') {
        return Paper1.renderStimulus(resource);
      }
      if (resource?.type === 'text') {
        return `
          <section class="paper1-stimulus">
            <span class="paper1-stimulus-label">RESOURCE BOOKLET</span>
            <h3>${Paper1.escapeHtml(resource.title || 'Resource')}</h3>
            <p class="paper1-stimulus-description">${Paper1.escapeHtml(resource.text || resource.description || '')}</p>
          </section>`;
      }
      return '';
    }).join('');

    return `
      <section class="paper1-stimulus">
        <span class="paper1-stimulus-label">ESS PAPER 1 CASE STUDY</span>
        <h3>${Paper1.escapeHtml(caseStudy.title || 'Case Study')}</h3>
        ${caseStudy.summary ? `<p class="paper1-stimulus-description">${Paper1.escapeHtml(caseStudy.summary)}</p>` : ''}
      </section>
      ${resourceHtml}`;
  },

  saveEssPaper1Attempt() {
    if (typeof Paper1 === 'undefined' || !Paper1.current || Paper1.attemptSaved) return;

    const maxMarks = Number(Paper1.current.marks) || 0;
    const markscheme = Array.isArray(Paper1.current.markscheme) ? Paper1.current.markscheme : [];
    const checkedIndexes = new Set(
      [...document.querySelectorAll('#paper1b-feedback input[data-paper1b-mark-point]:checked')]
        .map(input => Number(input.dataset.paper1bMarkPoint))
        .filter(Number.isInteger)
    );
    const criteria = markscheme.map((_, index) => ({
      criterionId: `${Paper1.current.id || 'ess-paper1'}:criterion:${index + 1}`,
      index: index + 1,
      markValue: 1,
      awarded: checkedIndexes.has(index)
    }));
    const rawScore = criteria.reduce((sum, criterion) => sum + (criterion.awarded ? criterion.markValue : 0), 0);
    const score = Math.min(rawScore, maxMarks || rawScore);

    const attempt = {
      attemptId: `${Paper1.current.id || 'ess-paper1'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: Paper1Progress.schemaVersion,
      questionId: Paper1.current.id || null,
      subject: 'ESS HL',
      section: 'esspaper1',
      assessmentTarget: 'ess-paper1',
      caseStudyId: Paper1.current.caseStudyId || null,
      chapter: Paper1.current.chapter || Paper1.current.topic || null,
      unit: Paper1.current.unit || null,
      commandTerm: Paper1.current.commandTerm || null,
      difficulty: Paper1.current.difficulty || null,
      questionType: 'case-study',
      score,
      maxMarks,
      percentage: maxMarks ? Math.round((score / maxMarks) * 100) : 0,
      evaluator: {
        type: 'self-checklist',
        version: 1
      },
      criteria,
      createdAt: new Date().toISOString()
    };

    if (!Paper1Progress.recordAttempt(attempt)) return;
    Paper1.attemptSaved = true;
    document.querySelectorAll('#paper1b-feedback input[data-paper1b-mark-point]').forEach(input => {
      input.disabled = true;
    });
    const saveButton = document.getElementById('paper1b-save-score');
    const status = document.getElementById('paper1b-save-status');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Score Saved';
    }
    if (status) status.textContent = `${score} / ${maxMarks} saved for this attempt.`;
  },

  patchPaper2() {
    if (typeof Paper2 === 'undefined' || this.originals.paper2Patched) return;
    this.originals.paper2Patched = true;
    this.originals.paper2Init = Paper2.init.bind(Paper2);
    this.originals.paper2Render = Paper2.render.bind(Paper2);

    Paper2.init = async (...args) => {
      const result = await this.originals.paper2Init(...args);
      this.attachData();
      this.applyUI();
      return result;
    };

    Paper2.render = () => {
      const current = Paper2.current;
      if (current?.subject !== 'ESS HL' || !Array.isArray(current.parts) || !current.parts.length) {
        this.originals.paper2Render();
        return;
      }

      const question = document.getElementById('paper2-question');
      const marks = document.getElementById('paper2-marks');
      const command = document.getElementById('paper2-command');
      const answer = document.getElementById('paper2-answer');
      const feedback = document.getElementById('paper2-feedback');
      if (!question) return;

      Paper2.attemptSaved = false;
      const stimulus = Paper2.renderStimulus(current.stimulus);
      const introduction = current.question
        ? `<p>${Paper2.escapeHtml(current.question)}</p>`
        : '';
      const parts = current.parts.map((part, index) => {
        const label = part?.label || String.fromCharCode(97 + index);
        const partMarks = Number(part?.marks) || 0;
        return `<p><strong>(${Paper2.escapeHtml(label)})</strong> ${Paper2.escapeHtml(part?.question || '')} <strong>[${partMarks}]</strong></p>`;
      }).join('');

      question.innerHTML = `${stimulus}<div class="paper2-question-text">${introduction}${parts}</div>`;
      if (marks) marks.textContent = current.marks ?? '—';
      if (command) command.textContent = current.commandTerm || 'Structured response';
      if (answer) answer.value = '';
      if (feedback) feedback.innerHTML = '';
    };
  },

  applyUI() {
    if (typeof App !== 'undefined') App.applyPracticeTypeUI();
  }
};

EssExam.init();