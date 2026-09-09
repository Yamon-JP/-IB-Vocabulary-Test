// English B HL Paper 1 Writing practice. Isolated from Biology Paper 1.
(() => {
  const EnglishBPaper1Progress = {
    storageKey: 'ib_english_b_paper1_progress',
    schemaVersion: 1,
    load() {
      const saved = typeof Storage !== 'undefined' ? Storage.load(this.storageKey) : null;
      return { schemaVersion: this.schemaVersion, attempts: Array.isArray(saved?.attempts) ? saved.attempts : [] };
    },
    recordAttempt(attempt) {
      if (!attempt || typeof Storage === 'undefined') return null;
      const data = this.load();
      data.attempts.push(attempt);
      Storage.save(this.storageKey, data);
      return attempt;
    }
  };

  const EnglishBPaper1 = window.EnglishBPaper1 = {
    data: [],
    focusedData: [],
    practiceSets: [],
    currentSetIndex: 0,
    selectedTaskIndex: null,
    selectedTextType: '',
    attemptSaved: false,
    initialized: false,
    appPatched: false,

    async init() {
      this.ensureStyles();
      this.installUI();
      this.patchApp();
      if (this.initialized) return true;
      try {
        const response = await fetch('data/english-b/paper1-writing.json?v=1');
        if (!response.ok) throw new Error('English B Paper 1 data not found');
        const data = await response.json();
        this.data = Array.isArray(data) ? data : [];

        this.focusedData = [];
        const focusUrls = [1, 2, 3, 4, 5].map(
          chapter => `data/english-b/paper1-writing-focus-ch${chapter}.json?v=1`
        );
        const focusResults = await Promise.allSettled(
          focusUrls.map(async url => {
            const focusResponse = await fetch(url);
            if (!focusResponse.ok) throw new Error(`Focused Paper 1 Writing data not found: ${url}`);
            const focusData = await focusResponse.json();
            return Array.isArray(focusData) ? focusData : [];
          })
        );
        this.focusedData = focusResults.flatMap(result =>
          result.status === 'fulfilled' ? result.value : []
        );
        if (focusResults.some(result => result.status === 'rejected')) {
          console.warn('Some English B Chapter-focused Paper 1 Writing data could not be loaded.');
        }

        this.initialized = true;
        return true;
      } catch (error) {
        console.warn('English B Paper 1 Writing data could not be loaded.', error);
        this.data = [];
        this.focusedData = [];
        return false;
      }
    },

    ensureStyles() {
      if (document.getElementById('english-b-paper1-stylesheet')) return;
      const link = document.createElement('link');
      link.id = 'english-b-paper1-stylesheet';
      link.rel = 'stylesheet';
      link.href = 'css/english-b-paper1.css?v=1';
      document.head.appendChild(link);
    },

    ensureChoiceCard() {
      const typeGrid = document.querySelector('.practice-type-grid');
      const paper2Button = document.getElementById('type-paper2');
      if (!typeGrid || !paper2Button || document.getElementById('type-paper1')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'type-paper1';
      button.className = 'practice-type-card';
      button.setAttribute('onclick', "App.setPracticeType('paper1')");
      button.innerHTML = '<span class="practice-type-icon" aria-hidden="true">P1</span><span><strong>Paper 1 Practice</strong><small>Final Exam practice</small></span>';
      typeGrid.insertBefore(button, paper2Button);
    },

    syncChoiceCard() {
      this.ensureChoiceCard();
      const button = document.getElementById('type-paper1');
      if (!button || typeof App === 'undefined') return;
      const text = button.querySelector('span:last-child');
      if (!text) return;
      if (App.state.subject === 'English B HL') {
        text.innerHTML = '<strong>Paper 1 Writing</strong><small>Choose 1 of 3 tasks · 450–600 words</small>';
      } else {
        text.innerHTML = '<strong>Paper 1 Practice</strong><small>Biology multiple-choice and data-based analysis</small>';
      }
    },

    installUI() {
      this.ensureChoiceCard();
      if (document.getElementById('english-b-paper1-practice-panel')) return;
      const achievements = document.getElementById('practice-achievements');
      if (!achievements) return;
      const panel = document.createElement('section');
      panel.id = 'english-b-paper1-practice-panel';
      panel.innerHTML = `
        <div class="engb-p1-shell">
          <div class="engb-p1-header">
            <div>
              <p class="eyebrow">FINAL EXAM TRAINING</p>
              <h3>English B HL · Paper 1 Writing</h3>
              <p class="muted">Complete one task using an appropriate text type.</p>
            </div>
            <div class="engb-p1-badges">
              <span class="engb-p1-badge">450–600 words</span>
              <span class="engb-p1-badge">30 marks</span>
              <span class="engb-p1-badge" id="engb-p1-set-label">Mock Set</span>
            </div>
          </div>
          <div class="engb-p1-instruction">
            <p><strong>Exam practice:</strong> Choose one of the three tasks below, then choose one text type from the three options for that task.</p>
            <p class="muted">There is no automatic mark penalty solely for being outside 450–600 words, but a response that is significantly short or excessively long may not fulfil the task effectively.</p>
          </div>
          <div id="engb-p1-task-grid" class="engb-p1-task-grid"></div>
          <div id="engb-p1-writing-card" class="engb-p1-writing-card">
            <div id="engb-p1-selected"><div class="engb-p1-empty">Select one task above to begin.</div></div>
          </div>
          <section id="engb-p1-feedback" class="engb-p1-feedback"></section>
        </div>`;
      achievements.parentNode.insertBefore(panel, achievements);
    },

    escapeHtml(value) {
      return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    },

    buildPracticeSets(chapters = []) {
      const selected = new Set(Array.isArray(chapters) ? chapters : []);
      if (!selected.size) return this.data.map(set => ({ ...set, tasks: set.tasks.map(task => ({ ...task })) }));
      const baseTasks = this.data.flatMap(set => Array.isArray(set.tasks) ? set.tasks : []);
      const focusedTasks = Array.isArray(this.focusedData) ? this.focusedData : [];
      const tasks = [...baseTasks, ...focusedTasks].filter(task => selected.has(task.chapter));
      const sets = [];
      for (let i = 0; i < tasks.length; i += 3) {
        sets.push({ id: `ENGB-P1-FOCUS-${sets.length + 1}`, title: `Focused Practice ${sets.length + 1}`, focused: true, tasks: tasks.slice(i, i + 3) });
      }
      return sets;
    },

    loadForSelection(chapters = []) {
      this.practiceSets = this.buildPracticeSets(chapters);
      this.currentSetIndex = 0;
      this.selectedTaskIndex = null;
      this.selectedTextType = '';
      this.attemptSaved = false;
      this.render();
      return this.practiceSets.reduce((sum, set) => sum + (Array.isArray(set.tasks) ? set.tasks.length : 0), 0);
    },

    currentSet() { return this.practiceSets[this.currentSetIndex] || null; },
    currentTask() {
      const set = this.currentSet();
      if (!set || this.selectedTaskIndex === null) return null;
      return set.tasks[this.selectedTaskIndex] || null;
    },

    render() {
      this.installUI();
      const set = this.currentSet();
      const grid = document.getElementById('engb-p1-task-grid');
      const selected = document.getElementById('engb-p1-selected');
      const feedback = document.getElementById('engb-p1-feedback');
      const label = document.getElementById('engb-p1-set-label');
      if (!grid || !selected) return;
      if (!set || !Array.isArray(set.tasks) || !set.tasks.length) {
        grid.innerHTML = '';
        selected.innerHTML = '<div class="engb-p1-empty">No English B Paper 1 tasks are available for this selection.</div>';
        if (feedback) feedback.innerHTML = '';
        return;
      }
      if (label) label.textContent = set.title;
      grid.innerHTML = set.tasks.map((task, index) => `
        <button type="button" class="engb-p1-task-card ${this.selectedTaskIndex === index ? 'active' : ''}" onclick="EnglishBPaper1.selectTask(${index})">
          <span class="engb-p1-task-number">Task ${index + 1} · ${this.escapeHtml(task.theme)}</span>
          <strong>${this.escapeHtml(task.chapter)}</strong>
          <p>${this.escapeHtml(task.prompt)}</p>
        </button>`).join('');
      if (this.selectedTaskIndex === null || !set.tasks[this.selectedTaskIndex]) {
        selected.innerHTML = '<div class="engb-p1-empty">Select one task above to begin.</div>';
      } else {
        this.renderSelectedTask();
      }
      if (feedback) feedback.innerHTML = '';
    },

    selectTask(index) {
      const set = this.currentSet();
      if (!set || !set.tasks[index]) return;
      this.selectedTaskIndex = index;
      this.selectedTextType = '';
      this.attemptSaved = false;
      this.render();
      this.renderSelectedTask();
    },

    renderSelectedTask() {
      const task = this.currentTask();
      const selected = document.getElementById('engb-p1-selected');
      if (!task || !selected) return;
      selected.innerHTML = `
        <div class="engb-p1-selected-meta">
          <span class="engb-p1-badge">${this.escapeHtml(task.theme)}</span>
          <span class="engb-p1-badge">${this.escapeHtml(task.chapter)}</span>
        </div>
        <p class="engb-p1-prompt">${this.escapeHtml(task.prompt)}</p>
        <p class="muted"><strong>Before writing:</strong> identify the audience, purpose and appropriate register from the task itself.</p>
        <div class="engb-p1-text-type-title">Choose a text type</div>
        <div class="engb-p1-text-types">
          ${task.textTypes.map(option => `<label><input type="radio" name="engb-p1-text-type" value="${this.escapeHtml(option.name)}" onchange="EnglishBPaper1.selectTextType(this.value)"><span>${this.escapeHtml(option.name)}</span></label>`).join('')}
        </div>
        <div class="engb-p1-answer-head">
          <label for="engb-p1-answer">Your Answer</label>
          <span id="engb-p1-word-count" class="engb-p1-word-count out-range">0 words · target 450–600</span>
        </div>
        <textarea id="engb-p1-answer" class="engb-p1-answer" placeholder="Write your Paper 1 response here..." oninput="EnglishBPaper1.updateWordCount()"></textarea>
        <div class="engb-p1-actions">
          <button type="button" onclick="EnglishBPaper1.submit()">Review & Self-mark</button>
          <button type="button" onclick="EnglishBPaper1.nextSet()">Next Set →</button>
        </div>`;
      const feedback = document.getElementById('engb-p1-feedback');
      if (feedback) feedback.innerHTML = '';
    },

    selectTextType(value) { this.selectedTextType = String(value || ''); },

    countWords(text) {
      const clean = String(text || '').trim();
      if (!clean) return 0;
      return (clean.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || []).length;
    },

    updateWordCount() {
      const answer = document.getElementById('engb-p1-answer');
      const counter = document.getElementById('engb-p1-word-count');
      if (!answer || !counter) return 0;
      const count = this.countWords(answer.value);
      counter.textContent = `${count} words · target 450–600`;
      counter.classList.toggle('in-range', count >= 450 && count <= 600);
      counter.classList.toggle('out-range', count < 450 || count > 600);
      return count;
    },

    criterionOptions(max) {
      return ['<option value="">—</option>'].concat(Array.from({ length: max + 1 }, (_, score) => `<option value="${score}">${score}</option>`)).join('');
    },

    submit() {
      const task = this.currentTask();
      const answer = document.getElementById('engb-p1-answer');
      const feedback = document.getElementById('engb-p1-feedback');
      if (!task || !answer || !feedback) return;
      if (!this.selectedTextType) {
        alert('Choose a text type before reviewing your answer.');
        return;
      }
      if (!answer.value.trim()) {
        alert('Write an answer before opening the self-mark review.');
        return;
      }
      const count = this.countWords(answer.value);
      const selectedOption = task.textTypes.find(option => option.name === this.selectedTextType);
      const suitability = selectedOption?.suitability || 'unknown';
      const suitabilityText = suitability === 'best'
        ? 'Strong choice: this is the most appropriate option for the task.'
        : suitability === 'acceptable'
          ? 'Possible choice: it can work, but the conventions and audience handling must be especially convincing.'
          : 'Less suitable choice: compare your choice with the task purpose and the model rationale before scoring Criterion C.';
      const modelCount = this.countWords(task.modelAnswer);
      feedback.innerHTML = `
        <div class="engb-p1-feedback-card">
          <h4>Task fulfilment check</h4>
          <div class="engb-p1-task-check">${task.requirements.map(item => `<label><input type="checkbox"><span>${this.escapeHtml(item)}</span></label>`).join('')}</div>
          <p class="muted">IB examiner guidance: if one or more required aspects are not covered, Criterion B can be limited to the “generally fulfilled” range; in the official example, covering only one of two required aspects caps B at 6/12.</p>
        </div>
        <div class="engb-p1-feedback-card">
          <h4>Concept check</h4>
          <p><strong>Your text type:</strong> ${this.escapeHtml(this.selectedTextType)} — ${this.escapeHtml(suitabilityText)}</p>
          <p><strong>Most appropriate:</strong> ${this.escapeHtml(task.bestTextType)}</p>
          <p><strong>Audience:</strong> ${this.escapeHtml(task.audience)}</p>
          <p><strong>Purpose:</strong> ${this.escapeHtml(task.purpose)}</p>
          <p><strong>Register:</strong> ${this.escapeHtml(task.register)}</p>
          <p>${this.escapeHtml(task.textTypeRationale)}</p>
        </div>
        <div class="engb-p1-feedback-card">
          <h4>IB-style self-mark · 30 marks</h4>
          <p class="muted">Training paraphrase of the current Paper 1 criteria. This is self-assessment, not an automatic IB examiner score.</p>
          <div class="engb-p1-criteria-grid">
            <div class="engb-p1-criterion"><strong>A · Language /12</strong><p>Appropriate and varied vocabulary and grammatical structures; accuracy supports effective communication.</p><select id="engb-p1-score-a" onchange="EnglishBPaper1.updateSelfMark()">${this.criterionOptions(12)}</select></div>
            <div class="engb-p1-criterion"><strong>B · Message /12</strong><p>Relevant ideas are developed, supported and coherently organized; all required aspects of the task are addressed.</p><select id="engb-p1-score-b" onchange="EnglishBPaper1.updateSelfMark()">${this.criterionOptions(12)}</select></div>
            <div class="engb-p1-criterion"><strong>C · Conceptual understanding /6</strong><p>Text type, register and tone suit the task; conventions of the chosen text type are executed effectively.</p><select id="engb-p1-score-c" onchange="EnglishBPaper1.updateSelfMark()">${this.criterionOptions(6)}</select></div>
          </div>
          <div class="engb-p1-total"><span>Self-mark total</span><strong id="engb-p1-self-total">— / 30</strong></div>
          <div class="engb-p1-actions"><button type="button" id="engb-p1-save" onclick="EnglishBPaper1.saveSelfMark()" ${this.attemptSaved ? 'disabled' : ''}>Save Attempt</button><span id="engb-p1-save-status" class="engb-p1-save-status"></span></div>
        </div>
        <div class="engb-p1-feedback-card">
          <h4>Model Answer · ${modelCount} words</h4>
          <div class="engb-p1-model">${this.escapeHtml(task.modelAnswer)}</div>
          <div class="engb-p1-jp" lang="ja"><strong>日本語解説：</strong>${this.escapeHtml(task.modelAnswerJa)}</div>
        </div>
        <div class="engb-p1-feedback-card">
          <h4>Targeted improvement check</h4>
          <div class="engb-p1-task-check">
            <label><input type="checkbox"><span>Rewrite your weakest paragraph with a clear main point, specific support or example, and an explanation of why it matters.</span></label>
            <label><input type="checkbox"><span>Check that the opening and ending clearly follow the conventions of ${this.escapeHtml(this.selectedTextType)}.</span></label>
            <label><input type="checkbox"><span>Find at least two places where the tone or register could be adjusted more precisely for ${this.escapeHtml(task.audience)}.</span></label>
            <label><input type="checkbox"><span>Upgrade at least three vague or repetitive words with more precise vocabulary linked to ${this.escapeHtml(task.theme)}.</span></label>
            <label><input type="checkbox"><span>Compare every task requirement with your response and add development where an idea is only mentioned rather than explained.</span></label>
          </div>
          <p class="muted">Use this after comparing your response with the model. The goal is to revise your own writing, not copy the model answer.</p>
        </div>
        <div class="engb-p1-feedback-card"><strong>Your word count: ${count}</strong><p>${count >= 450 && count <= 600 ? 'Within the directed HL range.' : 'Outside the directed HL range. Do not apply an automatic penalty; instead check whether relevance, development, effectiveness or coherence suffered.'}</p></div>`;
      feedback.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    updateSelfMark() {
      const ids = ['engb-p1-score-a','engb-p1-score-b','engb-p1-score-c'];
      const values = ids.map(id => document.getElementById(id)?.value ?? '');
      const total = document.getElementById('engb-p1-self-total');
      if (!total) return;
      if (values.some(value => value === '')) {
        total.textContent = '— / 30';
        return;
      }
      total.textContent = `${values.reduce((sum, value) => sum + Number(value), 0)} / 30`;
    },

    saveSelfMark() {
      const task = this.currentTask();
      const answer = document.getElementById('engb-p1-answer');
      const status = document.getElementById('engb-p1-save-status');
      const saveButton = document.getElementById('engb-p1-save');
      if (this.attemptSaved) {
        if (status) status.textContent = 'This attempt is already saved.';
        if (saveButton) saveButton.disabled = true;
        return;
      }
      const a = document.getElementById('engb-p1-score-a')?.value ?? '';
      const b = document.getElementById('engb-p1-score-b')?.value ?? '';
      const c = document.getElementById('engb-p1-score-c')?.value ?? '';
      if (!task || !answer || [a,b,c].some(value => value === '')) {
        if (status) status.textContent = 'Choose scores for A, B and C first.';
        return;
      }
      const attempt = {
        schemaVersion: 1,
        attemptId: `${task.id}-${Date.now()}`,
        questionId: task.id,
        subject: 'English B HL',
        assessmentTarget: 'english-b-paper1-writing',
        chapter: task.chapter,
        theme: task.theme,
        textType: this.selectedTextType,
        wordCount: this.countWords(answer.value),
        scores: { language: Number(a), message: Number(b), conceptualUnderstanding: Number(c) },
        score: Number(a) + Number(b) + Number(c),
        maxMarks: 30,
        createdAt: new Date().toISOString()
      };
      const savedAttempt = EnglishBPaper1Progress.recordAttempt(attempt);
      if (!savedAttempt) {
        if (status) status.textContent = 'Attempt could not be saved.';
        return;
      }
      this.attemptSaved = true;
      if (saveButton) saveButton.disabled = true;
      if (status) status.textContent = `${attempt.score} / 30 saved.`;
    },

    nextSet() {
      if (!this.practiceSets.length) return;
      this.currentSetIndex = (this.currentSetIndex + 1) % this.practiceSets.length;
      this.selectedTaskIndex = null;
      this.selectedTextType = '';
      this.attemptSaved = false;
      this.render();
      document.getElementById('english-b-paper1-practice-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    patchApp() {
      if (this.appPatched || typeof App === 'undefined') return;
      this.appPatched = true;
      const module = this;
      const originalSetPracticeType = App.setPracticeType.bind(App);
      const originalApplyPracticeTypeUI = App.applyPracticeTypeUI.bind(App);
      const originalStartPractice = App.startPractice.bind(App);
      const originalOpenPractice = App.openPractice.bind(App);
      const originalUpdatePracticeHeader = App.updatePracticeHeader.bind(App);

      App.setPracticeType = function(type) {
        if (this.state.subject === 'English B HL' && type === 'paper1') {
          this.state.practiceType = 'paper1';
          this.applyPracticeTypeUI();
          this.saveState();
          return;
        }
        originalSetPracticeType(type);
      };

      App.applyPracticeTypeUI = function() {
        module.ensureChoiceCard();
        if (this.state.subject !== 'English B HL') {
          originalApplyPracticeTypeUI();
          module.syncChoiceCard();
          const englishPanel = document.getElementById('english-b-paper1-practice-panel');
          if (englishPanel) englishPanel.style.display = 'none';
          return;
        }
        const vocabularyButton = document.getElementById('type-vocabulary');
        const paper1Button = document.getElementById('type-paper1');
        const paper2Button = document.getElementById('type-paper2');
        const typeGrid = document.querySelector('.practice-type-grid');
        const paper1Control = document.getElementById('paper1-section-control');
        const paper2Control = document.getElementById('paper2-section-control');
        const learnedControl = document.getElementById('paper1-learned-units-control');
        if (!['vocabulary','paper1','paper2'].includes(this.state.practiceType)) this.state.practiceType = 'vocabulary';
        if (paper1Button) paper1Button.hidden = false;
        if (typeGrid) typeGrid.classList.add('has-paper1');
        if (vocabularyButton) vocabularyButton.classList.toggle('active', this.state.practiceType === 'vocabulary');
        if (paper1Button) paper1Button.classList.toggle('active', this.state.practiceType === 'paper1');
        if (paper2Button) paper2Button.classList.toggle('active', this.state.practiceType === 'paper2');
        if (paper1Control) paper1Control.style.display = 'none';
        if (paper2Control) paper2Control.style.display = 'none';
        if (learnedControl) learnedControl.style.display = 'none';
        module.syncChoiceCard();
      };

      App.startPractice = async function() {
        if (this.state.subject !== 'English B HL' || this.state.practiceType !== 'paper1') return originalStartPractice();
        if (typeof Vocabulary === 'undefined') return;
        const chapters = this.state.practiceScope === 'selected'
          ? [...document.querySelectorAll('#chapter-list input:checked')].map(input => input.value)
          : [];
        if (this.state.practiceScope === 'selected' && !chapters.length) {
          alert('Please select at least one chapter.');
          return;
        }
        this.state.selectedChapters = chapters;
        this.saveState();
        await module.init();
        const count = module.loadForSelection(chapters);
        if (!count) {
          alert('No English B Paper 1 Writing tasks are available for this selection yet.');
          return;
        }
        this.updatePracticeHeader();
        Pages.show('practice');
      };

      App.openPractice = async function() {
        if (this.state.subject !== 'English B HL' || this.state.practiceType !== 'paper1') return originalOpenPractice();
        const chapters = this.state.practiceScope === 'selected' ? [...(this.state.selectedChapters || [])] : [];
        await module.init();
        const count = module.loadForSelection(chapters);
        if (!count) return;
        this.updatePracticeHeader();
        Pages.show('practice');
      };

      App.updatePracticeHeader = function() {
        originalUpdatePracticeHeader();
        if (this.state.subject !== 'English B HL') return;
        const header = document.getElementById('selection-subject-practice');
        const scope = this.state.practiceScope === 'selected' && this.state.selectedChapters.length ? this.state.selectedChapters.join(', ') : 'All Chapters';
        if (header && this.state.practiceType === 'paper1') header.textContent = `English B HL · Paper 1 Writing · ${scope}`;
        const vocabularyPanel = document.getElementById('vocabulary-practice-panel');
        const biologyPaper1Panel = document.getElementById('paper1-practice-panel');
        const paper2Panel = document.getElementById('paper2-practice-panel');
        const englishPanel = document.getElementById('english-b-paper1-practice-panel');
        if (vocabularyPanel) vocabularyPanel.style.display = this.state.practiceType === 'vocabulary' ? 'block' : 'none';
        if (biologyPaper1Panel) biologyPaper1Panel.style.display = 'none';
        if (paper2Panel) paper2Panel.style.display = this.state.practiceType === 'paper2' ? 'block' : 'none';
        if (englishPanel) englishPanel.style.display = this.state.practiceType === 'paper1' ? 'block' : 'none';
        this.applyPracticeTypeUI();
      };

      this.syncChoiceCard();
    }
  };

  const boot = (attempt = 0) => {
    if (typeof App === 'undefined' || typeof Pages === 'undefined') {
      if (attempt < 300) window.setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    EnglishBPaper1.init();
  };
  boot();
})();