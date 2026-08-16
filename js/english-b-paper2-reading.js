// English B HL Paper 2 Reading practice. Isolated from the existing science Paper 2 module.
(() => {
  const ProgressStore = {
    storageKey: 'ib_english_b_paper2_reading_progress',
    schemaVersion: 1,
    load() {
      const saved = typeof Storage !== 'undefined' ? Storage.load(this.storageKey) : null;
      return { schemaVersion: this.schemaVersion, attempts: Array.isArray(saved?.attempts) ? saved.attempts : [] };
    },
    record(attempt) {
      if (!attempt || typeof Storage === 'undefined') return null;
      const data = this.load();
      data.attempts.push(attempt);
      Storage.save(this.storageKey, data);
      return attempt;
    }
  };

  const EnglishBPaper2Reading = window.EnglishBPaper2Reading = {
    data: [],
    focusedData: [],
    practiceSets: [],
    currentSetIndex: 0,
    initialized: false,
    appPatched: false,
    reviewed: false,
    attemptSaved: false,
    autoScore: 0,
    autoMax: 0,

    async init() {
      this.ensureStyles();
      this.installUI();
      this.patchApp();
      if (this.initialized) return true;
      try {
        const response = await fetch('data/english-b/paper2-reading.json?v=1');
        if (!response.ok) throw new Error('English B Paper 2 Reading data not found');
        const data = await response.json();
        const baseData = Array.isArray(data) ? data : [];
        let extraData = [];
        try {
          const extraResponse = await fetch('data/english-b/paper2-reading-extra.json?v=1');
          if (extraResponse.ok) {
            const extra = await extraResponse.json();
            extraData = Array.isArray(extra) ? extra : [];
          } else {
            console.warn('English B Paper 2 Reading extra mock data not found.');
          }
        } catch (extraError) {
          console.warn('English B Paper 2 Reading extra mock data could not be loaded.', extraError);
        }
        this.data = [...baseData, ...extraData];

        this.focusedData = [];
        const focusUrls = [1, 2, 3, 4, 5].map(
          chapter => `data/english-b/paper2-reading-focus-ch${chapter}.json?v=1`
        );
        const focusResults = await Promise.allSettled(
          focusUrls.map(async url => {
            const focusResponse = await fetch(url);
            if (!focusResponse.ok) throw new Error(`Focused Reading data not found: ${url}`);
            const focusData = await focusResponse.json();
            return Array.isArray(focusData) ? focusData : [];
          })
        );
        this.focusedData = focusResults.flatMap(result =>
          result.status === 'fulfilled' ? result.value : []
        );
        if (focusResults.some(result => result.status === 'rejected')) {
          console.warn('Some English B Chapter-focused Reading data could not be loaded.');
        }

        this.initialized = true;
        return true;
      } catch (error) {
        console.warn('English B Paper 2 Reading data could not be loaded.', error);
        this.data = [];
        this.focusedData = [];
        return false;
      }
    },

    ensureStyles() {
      if (document.getElementById('english-b-paper2-reading-stylesheet')) return;
      const link = document.createElement('link');
      link.id = 'english-b-paper2-reading-stylesheet';
      link.rel = 'stylesheet';
      link.href = 'css/english-b-paper2-reading.css?v=1';
      document.head.appendChild(link);
    },

    installUI() {
      if (document.getElementById('english-b-paper2-reading-panel')) return;
      const achievements = document.getElementById('practice-achievements');
      if (!achievements) return;
      const panel = document.createElement('section');
      panel.id = 'english-b-paper2-reading-panel';
      panel.innerHTML = `
        <div class="engb-r-shell">
          <div class="engb-r-header">
            <div>
              <p class="eyebrow">FINAL EXAM TRAINING</p>
              <h3>English B HL · Paper 2 Reading</h3>
              <p class="muted">Read three texts and answer the comprehension questions.</p>
            </div>
            <div class="engb-r-badges">
              <span class="engb-r-badge" id="engb-r-set-label">Reading Mock</span>
              <span class="engb-r-badge" id="engb-r-total-marks">40 marks</span>
            </div>
          </div>
          <div class="engb-r-instruction">
            <p><strong>Hybrid marking:</strong> objective items are checked automatically. Short answers and written justifications use markscheme self-checks so valid paraphrases are not rejected by a rigid keyword matcher.</p>
            <p class="muted">Questions and texts remain in English. Japanese support appears only after review.</p>
          </div>
          <div id="engb-r-content"></div>
          <div class="engb-r-actions">
            <button type="button" onclick="EnglishBPaper2Reading.submit()">Check Answers</button>
            <button type="button" onclick="EnglishBPaper2Reading.nextSet()">Next Set →</button>
          </div>
          <div id="engb-r-score-area"></div>
        </div>`;
      achievements.parentNode.insertBefore(panel, achievements);
    },

    escapeHtml(value) {
      return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    },

    normalize(value) {
      return String(value ?? '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ');
    },

    buildPracticeSets(chapters = []) {
      const selected = new Set(Array.isArray(chapters) ? chapters : []);
      if (!selected.size) return this.data.map(set => ({ ...set, texts: set.texts.map(text => ({ ...text, questions: text.questions.map(question => ({ ...question })) })) }));
      const baseTexts = this.data.flatMap(set => Array.isArray(set.texts) ? set.texts : []);
      const focusedTexts = Array.isArray(this.focusedData) ? this.focusedData : [];
      const texts = [...baseTexts, ...focusedTexts].filter(text => selected.has(text.chapter));
      const sets = [];
      for (let i = 0; i < texts.length; i += 3) {
        const chunk = texts.slice(i, i + 3).map(text => ({ ...text, questions: text.questions.map(question => ({ ...question })) }));
        sets.push({
          id: `ENGB-R-FOCUS-${sets.length + 1}`,
          title: `Focused Reading ${sets.length + 1}`,
          focused: true,
          texts: chunk,
          totalMarks: chunk.reduce((sum, text) => sum + Number(text.marks || 0), 0)
        });
      }
      return sets;
    },

    loadForSelection(chapters = []) {
      this.practiceSets = this.buildPracticeSets(chapters);
      this.currentSetIndex = 0;
      this.reviewed = false;
      this.attemptSaved = false;
      this.autoScore = 0;
      this.autoMax = 0;
      this.render();
      return this.practiceSets.length;
    },

    currentSet() { return this.practiceSets[this.currentSetIndex] || null; },

    render() {
      this.installUI();
      const set = this.currentSet();
      const content = document.getElementById('engb-r-content');
      const label = document.getElementById('engb-r-set-label');
      const marks = document.getElementById('engb-r-total-marks');
      const scoreArea = document.getElementById('engb-r-score-area');
      if (!content) return;
      if (!set || !Array.isArray(set.texts) || !set.texts.length) {
        content.innerHTML = '<div class="engb-r-empty">No English B Paper 2 Reading texts are available for this selection.</div>';
        if (scoreArea) scoreArea.innerHTML = '';
        return;
      }
      if (label) label.textContent = set.title;
      if (marks) marks.textContent = `${set.totalMarks} marks`;
      this.reviewed = false;
      this.attemptSaved = false;
      this.autoScore = 0;
      this.autoMax = 0;
      content.innerHTML = set.texts.map((text, textIndex) => this.renderText(text, textIndex)).join('');
      if (scoreArea) scoreArea.innerHTML = '';
    },

    renderText(text, textIndex) {
      const paragraphs = (Array.isArray(text.paragraphs) ? text.paragraphs : []).map((paragraph, index) => `
        <p class="engb-r-paragraph"><span class="engb-r-pno">[${index + 1}]</span><span>${this.escapeHtml(paragraph)}</span></p>`).join('');
      const questions = (Array.isArray(text.questions) ? text.questions : []).map((question, questionIndex) => this.renderQuestion(question, textIndex, questionIndex)).join('');
      return `
        <section class="engb-r-text">
          <div class="engb-r-text-head">
            <div><span class="engb-r-badge">Text ${String.fromCharCode(65 + textIndex)} · ${this.escapeHtml(text.theme)}</span><h4>${this.escapeHtml(text.title)}</h4><small class="muted">${this.escapeHtml(text.sourceType || '')}</small></div>
            <strong>${Number(text.marks || 0)} marks</strong>
          </div>
          <div class="engb-r-passage">${paragraphs}</div>
          <div class="engb-r-questions">${questions}</div>
        </section>`;
    },

    renderQuestion(question, textIndex, questionIndex) {
      const key = `${textIndex}-${questionIndex}`;
      let answer = '';
      if (question.type === 'mcq' || question.type === 'reference') {
        answer = `<div class="engb-r-options">${(question.options || []).map((option, optionIndex) => `<label><input type="radio" name="engb-r-${key}" value="${optionIndex}"><span>${this.escapeHtml(option)}</span></label>`).join('')}</div>`;
      } else if (question.type === 'truefalse_justify') {
        answer = `<div class="engb-r-options"><label><input type="radio" name="engb-r-${key}-tf" value="true"><span>True</span></label><label><input type="radio" name="engb-r-${key}-tf" value="false"><span>False</span></label></div><textarea id="engb-r-${key}-text" class="engb-r-input engb-r-textarea" placeholder="Copy or paraphrase the supporting evidence from the text."></textarea>`;
      } else if (question.type === 'short') {
        answer = `<textarea id="engb-r-${key}-text" class="engb-r-input engb-r-textarea" placeholder="Write a concise answer in English."></textarea>`;
      } else {
        answer = `<input id="engb-r-${key}-text" class="engb-r-input" type="text" placeholder="Answer in English">`;
      }
      return `
        <article class="engb-r-question" id="engb-r-q-${key}">
          <div class="engb-r-qhead"><strong>${questionIndex + 1}. ${this.escapeHtml(question.prompt)}</strong><span class="engb-r-marks">${question.marks} mark${Number(question.marks) === 1 ? '' : 's'}</span></div>
          ${answer}
          <div id="engb-r-feedback-${key}"></div>
        </article>`;
    },

    getTextAnswer(key) {
      return document.getElementById(`engb-r-${key}-text`)?.value || '';
    },

    getRadioValue(name) {
      return document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
    },

    isAccepted(answer, accepted = []) {
      const normalized = this.normalize(answer);
      return (accepted || []).some(item => this.normalize(item) === normalized);
    },

    submit() {
      const set = this.currentSet();
      if (!set) return;
      this.autoScore = 0;
      this.autoMax = 0;
      this.reviewed = true;
      this.attemptSaved = false;

      set.texts.forEach((text, textIndex) => {
        (text.questions || []).forEach((question, questionIndex) => {
          const key = `${textIndex}-${questionIndex}`;
          const feedback = document.getElementById(`engb-r-feedback-${key}`);
          if (!feedback) return;
          let html = '';
          let correct = null;
          let autoAwarded = 0;
          let selfPoints = [];

          if (question.type === 'mcq' || question.type === 'reference') {
            const value = this.getRadioValue(`engb-r-${key}`);
            correct = value !== '' && Number(value) === Number(question.correctIndex);
            autoAwarded = correct ? Number(question.marks || 1) : 0;
            this.autoMax += Number(question.marks || 1);
            const correctText = question.options?.[question.correctIndex] || '';
            html += `<p><strong>${correct ? 'Correct' : 'Answer'}:</strong> ${this.escapeHtml(correctText)}</p>`;
          } else if (question.type === 'completion' || question.type === 'find') {
            const value = this.getTextAnswer(key);
            correct = this.isAccepted(value, question.answers);
            autoAwarded = correct ? Number(question.marks || 1) : 0;
            this.autoMax += Number(question.marks || 1);
            html += `<p><strong>${correct ? 'Correct' : 'Answer'}:</strong> ${this.escapeHtml((question.answers || [])[0] || '')}</p>`;
          } else if (question.type === 'truefalse_justify') {
            const value = this.getRadioValue(`engb-r-${key}-tf`);
            const selected = value === 'true' ? true : value === 'false' ? false : null;
            correct = selected !== null && selected === Boolean(question.correct);
            autoAwarded = correct ? 1 : 0;
            this.autoMax += 1;
            html += `<p><strong>True / False:</strong> ${question.correct ? 'True' : 'False'} ${correct ? '✓' : ''}</p>`;
            selfPoints = [{ text: question.justification, points: Math.max(0, Number(question.marks || 2) - 1) }];
          } else if (question.type === 'short') {
            selfPoints = (question.markscheme || []).map(point => ({ text: point, points: 1 }));
          }

          this.autoScore += autoAwarded;
          if (selfPoints.length) {
            html += `<div class="engb-r-self-points"><strong>Markscheme self-check</strong>${selfPoints.map((point, index) => `<label><input type="checkbox" data-engb-r-self-point data-points="${point.points}" onchange="EnglishBPaper2Reading.updateScore()"><span>${this.escapeHtml(point.text)} <small>(${point.points} mark${point.points === 1 ? '' : 's'})</small></span></label>`).join('')}</div>`;
          }
          if (question.paragraph) html += `<p><strong>Evidence:</strong> paragraph ${question.paragraph}</p>`;
          if (question.explanationJa) html += `<p class="engb-r-feedback-ja" lang="ja"><strong>日本語解説：</strong>${this.escapeHtml(question.explanationJa)}</p>`;
          feedback.className = `engb-r-feedback ${correct === true ? 'correct' : correct === false ? 'incorrect' : ''}`;
          feedback.innerHTML = html;
        });
      });
      this.renderScoreArea();
      document.getElementById('engb-r-score-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    selfScore() {
      return [...document.querySelectorAll('#english-b-paper2-reading-panel input[data-engb-r-self-point]:checked')]
        .reduce((sum, input) => sum + Number(input.dataset.points || 0), 0);
    },

    updateScore() {
      const set = this.currentSet();
      const score = this.autoScore + this.selfScore();
      const total = Number(set?.totalMarks || 0);
      const value = document.getElementById('engb-r-score-value');
      if (value) value.textContent = `${score} / ${total}`;
    },

    renderScoreArea() {
      const set = this.currentSet();
      const area = document.getElementById('engb-r-score-area');
      if (!set || !area) return;
      const selfMax = Math.max(0, Number(set.totalMarks || 0) - this.autoMax);
      area.innerHTML = `
        <div class="engb-r-scorebar">
          <div><span>Current score</span><strong id="engb-r-score-value">${this.autoScore + this.selfScore()} / ${set.totalMarks}</strong></div>
          <small class="muted">Auto-marked: ${this.autoScore}/${this.autoMax} · Self-check available: ${selfMax} marks</small>
        </div>
        <div class="engb-r-actions">
          <button type="button" onclick="EnglishBPaper2Reading.saveAttempt()">Save Attempt</button>
          <span id="engb-r-save-status" class="engb-r-save-status"></span>
        </div>`;
    },

    saveAttempt() {
      const set = this.currentSet();
      const status = document.getElementById('engb-r-save-status');
      if (!set || !this.reviewed) {
        if (status) status.textContent = 'Check Answers first.';
        return;
      }
      if (this.attemptSaved) {
        if (status) status.textContent = 'This attempt is already saved.';
        return;
      }
      const score = this.autoScore + this.selfScore();
      const maxMarks = Number(set.totalMarks || 0);
      const attempt = {
        schemaVersion: 1,
        attemptId: `${set.id}-${Date.now()}`,
        setId: set.id,
        subject: 'English B HL',
        assessmentTarget: 'english-b-paper2-reading',
        chapters: (set.texts || []).map(text => text.chapter),
        score,
        maxMarks,
        percentage: maxMarks ? Math.round((score / maxMarks) * 100) : 0,
        autoScore: this.autoScore,
        selfScore: this.selfScore(),
        createdAt: new Date().toISOString()
      };
      ProgressStore.record(attempt);
      this.attemptSaved = true;
      if (status) status.textContent = `${score} / ${maxMarks} saved.`;
    },

    nextSet() {
      if (!this.practiceSets.length) return;
      this.currentSetIndex = (this.currentSetIndex + 1) % this.practiceSets.length;
      this.render();
      document.getElementById('english-b-paper2-reading-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    syncPaper2Card() {
      if (typeof App === 'undefined') return;
      const button = document.getElementById('type-paper2');
      const text = button?.querySelector('span:last-child');
      if (!text) return;
      if (App.state.subject === 'English B HL') {
        text.innerHTML = '<strong>Paper 2 Reading</strong><small>3 written texts · 40-mark comprehension</small>';
      } else {
        text.innerHTML = '<strong>Paper 2 Practice</strong><small>IB-style written answers and markscheme review</small>';
      }
    },

    patchApp() {
      if (this.appPatched || typeof App === 'undefined') return;
      this.appPatched = true;
      const module = this;
      const originalApplyPracticeTypeUI = App.applyPracticeTypeUI.bind(App);
      const originalStartPractice = App.startPractice.bind(App);
      const originalOpenPractice = App.openPractice.bind(App);
      const originalUpdatePracticeHeader = App.updatePracticeHeader.bind(App);

      App.applyPracticeTypeUI = function() {
        originalApplyPracticeTypeUI();
        module.syncPaper2Card();
      };

      App.startPractice = async function() {
        if (this.state.subject !== 'English B HL' || this.state.practiceType !== 'paper2') return originalStartPractice();
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
          alert('No English B Paper 2 Reading texts are available for this selection yet.');
          return;
        }
        this.updatePracticeHeader();
        Pages.show('practice');
      };

      App.openPractice = async function() {
        if (this.state.subject !== 'English B HL' || this.state.practiceType !== 'paper2') return originalOpenPractice();
        const chapters = this.state.practiceScope === 'selected' ? [...(this.state.selectedChapters || [])] : [];
        await module.init();
        const count = module.loadForSelection(chapters);
        if (!count) return;
        this.updatePracticeHeader();
        Pages.show('practice');
      };

      App.updatePracticeHeader = function() {
        originalUpdatePracticeHeader();
        if (this.state.subject !== 'English B HL') {
          const reading = document.getElementById('english-b-paper2-reading-panel');
          if (reading) reading.style.display = 'none';
          return;
        }
        const reading = document.getElementById('english-b-paper2-reading-panel');
        const genericPaper2 = document.getElementById('paper2-practice-panel');
        const englishPaper1 = document.getElementById('english-b-paper1-practice-panel');
        if (this.state.practiceType === 'paper2') {
          const header = document.getElementById('selection-subject-practice');
          const scope = this.state.practiceScope === 'selected' && this.state.selectedChapters.length ? this.state.selectedChapters.join(', ') : 'All Chapters';
          if (header) header.textContent = `English B HL · Paper 2 Reading · ${scope}`;
          if (genericPaper2) genericPaper2.style.display = 'none';
          if (englishPaper1) englishPaper1.style.display = 'none';
          if (reading) reading.style.display = 'block';
        } else if (reading) {
          reading.style.display = 'none';
        }
        module.syncPaper2Card();
      };

      this.syncPaper2Card();
    }
  };

  const boot = (attempt = 0) => {
    if (typeof App === 'undefined' || typeof Pages === 'undefined') {
      if (attempt < 300) window.setTimeout(() => boot(attempt + 1), 50);
      return;
    }
    EnglishBPaper2Reading.init();
  };
  boot();
})();