(() => {
  const F = window.EssPaper1FullMock = {
    mode: 'practice',
    active: false,
    installed: false,
    submitted: false,
    saved: false,
    caseStudy: null,
    questions: [],
    answers: [],
    i: 0,
    sid: '',
    startAt: 0,
    endAt: 0,
    elapsed: 0,
    timer: null,
    dataPromise: null,

    e(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    async fetchJson(path) {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return response.json();
    },

    validate(caseStudy, questions) {
      if (!caseStudy || caseStudy.id !== 'ESS-CS9-ATM-ECO-001') return false;
      if (!Array.isArray(questions) || questions.length !== 7) return false;
      const ids = questions.map(q => q.id);
      if (new Set(ids).size !== 7) return false;
      if (questions.some(q =>
        q.subject !== 'ESS HL'
        || q.assessmentTarget !== 'ess-paper1'
        || q.caseStudyId !== caseStudy.id
        || !Array.isArray(q.requiredUnits)
        || !q.requiredUnits.length
        || !Array.isArray(q.markscheme)
        || q.markscheme.length !== Number(q.marks)
        || !Array.isArray(q.markschemeJa)
        || q.markschemeJa.length !== q.markscheme.length
        || typeof q.modelAnswer !== 'string'
        || typeof q.modelAnswerJa !== 'string'
      )) return false;
      return questions.reduce((sum, q) => sum + Number(q.marks || 0), 0) === 70;
    },

    async loadData() {
      if (this.caseStudy && this.questions.length === 7) return true;
      if (this.dataPromise) return this.dataPromise;
      this.dataPromise = (async () => {
        try {
          const [caseRows, p1, p2, p3] = await Promise.all([
            this.fetchJson('data/paper1/ess-case-study-9.json?v=1'),
            this.fetchJson('data/paper1/ess-paper1-case9-part1.json?v=1'),
            this.fetchJson('data/paper1/ess-paper1-case9-part2.json?v=1'),
            this.fetchJson('data/paper1/ess-paper1-case9-part3.json?v=1')
          ]);
          const caseStudy = (Array.isArray(caseRows) ? caseRows : []).find(item => item?.id === 'ESS-CS9-ATM-ECO-001') || null;
          const questions = [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : []), ...(Array.isArray(p3) ? p3 : [])]
            .filter(q => q?.caseStudyId === 'ESS-CS9-ATM-ECO-001')
            .sort((a, b) => {
              const an = Number(String(a.id || '').match(/Q(\d+)$/)?.[1] || 0);
              const bn = Number(String(b.id || '').match(/Q(\d+)$/)?.[1] || 0);
              return an - bn;
            });
          if (!this.validate(caseStudy, questions)) throw new Error('ESS Paper 1 Full Mock data failed validation.');
          this.caseStudy = caseStudy;
          this.questions = questions;
          return true;
        } catch (error) {
          console.warn('ESS Paper 1 Full Mock data unavailable.', error);
          return false;
        } finally {
          this.dataPromise = null;
        }
      })();
      return this.dataPromise;
    },

    learned() {
      return App.getCourseCoverageItems?.('ESS HL') || [];
    },

    requiredUnits() {
      const units = new Set();
      (this.caseStudy?.requiredUnits || []).forEach(unit => units.add(unit));
      this.questions.forEach(q => (q.requiredUnits || []).forEach(unit => units.add(unit)));
      return [...units].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    },

    missingUnits() {
      const learned = new Set(this.learned());
      return this.requiredUnits().filter(unit => !learned.has(unit));
    },

    ensureStyles() {
      if (document.getElementById('ess-p1fm-css')) return;
      const style = document.createElement('style');
      style.id = 'ess-p1fm-css';
      style.textContent = `
        #ess-p1fm-control{margin-top:14px}
        .ess-p1fm-top,.ess-p1fm-head{display:flex;justify-content:space-between;gap:10px}
        .ess-p1fm-top,.ess-p1fm-question,.ess-p1fm-review,.ess-p1fm-booklet{padding:12px;border:1px solid #dfe5ee;border-radius:12px;background:#fbfcfe}
        .ess-p1fm-time{display:block;font-weight:900}.ess-p1fm-time.elapsed{color:#b42318}
        .ess-p1fm-question textarea{width:100%;min-height:180px;padding:10px;border:1px solid var(--border-strong);border-radius:10px;resize:vertical}
        .ess-p1fm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
        .ess-p1fm-booklet{margin:12px 0}.ess-p1fm-booklet summary{cursor:pointer;font-weight:850}
        .ess-p1fm-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
        .ess-p1fm-stat{text-align:center;padding:9px;border:1px solid #dfe5ee;border-radius:10px}
        .ess-p1fm-ja{display:block;color:#667085;font-size:.86rem;margin-top:4px}
        .ess-p1fm-user{padding:8px;background:#f8fafc;white-space:pre-wrap}
        .ess-p1fm-point{display:block;margin:7px 0}
        .ess-p1fm-model{padding:8px;border-left:3px solid #98a2b3;background:#f9fafb}
        @media(max-width:720px){.ess-p1fm-top,.ess-p1fm-head{flex-direction:column}.ess-p1fm-summary{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    },

    ui() {
      this.ensureStyles();
      const base = document.getElementById('paper1-section-control');
      if (base && !document.getElementById('ess-p1fm-control')) {
        const control = document.createElement('div');
        control.id = 'ess-p1fm-control';
        control.className = 'paper1-section-control';
        control.style.display = 'none';
        control.innerHTML = `
          <h3>Paper 1 Exam Mode</h3>
          <div class="paper1-section-grid">
            <button id="ess-p1fm-practice" class="paper1-section-card active" onclick="EssPaper1FullMock.setMode('practice')">
              <strong>Practice</strong><small>Case-study question practice</small>
            </button>
            <button id="ess-p1fm-full" class="paper1-section-card" onclick="EssPaper1FullMock.setMode('full')">
              <strong>Full Paper Mock</strong><small>Case Study 9 · 7 questions · 70 marks · 120 min</small>
            </button>
          </div>
          <p id="ess-p1fm-note" class="muted">Full Mock uses only material selected in Course Coverage.</p>`;
        base.after(control);
      }

      const host = document.getElementById('paper1-practice-panel');
      if (host && !document.getElementById('ess-p1fm-panel')) {
        const panel = document.createElement('section');
        panel.id = 'ess-p1fm-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
          <div class="ess-p1fm-top">
            <div><strong id="ess-p1fm-phase">ESS HL Paper 1 Full Mock</strong><div id="ess-p1fm-progress" class="muted"></div></div>
            <div><span class="muted">120-minute paper</span><strong id="ess-p1fm-time" class="ess-p1fm-time">120:00</strong></div>
          </div>
          <div id="ess-p1fm-booklet"></div>
          <section id="ess-p1fm-question" class="ess-p1fm-question"></section>
          <div id="ess-p1fm-actions" class="ess-p1fm-actions"></div>
          <section id="ess-p1fm-feedback"></section>`;
        host.appendChild(panel);
      }
    },

    async sync() {
      this.ui();
      const relevant = App.state.subject === 'ESS HL' && App.state.practiceType === 'paper1';
      const control = document.getElementById('ess-p1fm-control');
      const section = document.getElementById('paper1-section-control');
      const scope = document.querySelector('.scope-control');
      const chapters = document.getElementById('chapter-options');
      const startButton = document.querySelector('.selection-actions .primary-action');

      if (control) control.style.display = relevant ? 'block' : 'none';
      document.getElementById('ess-p1fm-practice')?.classList.toggle('active', this.mode !== 'full');
      document.getElementById('ess-p1fm-full')?.classList.toggle('active', this.mode === 'full');

      if (relevant && this.mode === 'full') {
        if (section) section.style.display = 'none';
        if (scope) scope.style.display = 'none';
        if (chapters) chapters.style.display = 'none';
        if (startButton) startButton.textContent = 'Start Full Mock →';
        const note = document.getElementById('ess-p1fm-note');
        const loaded = await this.loadData();
        if (note) {
          if (!loaded) note.textContent = 'Full Mock data could not be loaded.';
          else {
            const missing = this.missingUnits();
            note.textContent = missing.length
              ? `Full Mock needs: ${missing.join(', ')}`
              : 'Ready: Case Study 9 · 7 questions · 70 marks · 120 min.';
          }
        }
      } else {
        if (relevant && section) section.style.display = 'block';
        if (scope) scope.style.display = '';
        App.applyPracticeScopeUI?.();
        if (startButton) startButton.textContent = 'Start Practice →';
      }
    },

    setMode(value) {
      const next = value === 'full' ? 'full' : 'practice';
      if (this.active && next !== 'full' && !confirm('End the current ESS Paper 1 Full Mock? Unsaved answers will be lost.')) return;
      if (this.active && next !== 'full') this.stop();
      this.mode = next;
      this.sync();
    },

    syncPanel() {
      this.ui();
      const panel = document.getElementById('ess-p1fm-panel');
      const a = document.getElementById('paper1a-panel');
      const b = document.getElementById('paper1b-panel');
      const achievements = document.getElementById('practice-achievements');
      if (panel) panel.style.display = this.active ? 'block' : 'none';
      if (this.active) {
        if (a) a.style.display = 'none';
        if (b) b.style.display = 'none';
        if (achievements) achievements.style.display = 'none';
      } else if (achievements) achievements.style.display = '';
    },

    renderResource(resource) {
      if (!resource || typeof Paper1 === 'undefined') return '';
      if (resource.type === 'table' || resource.type === 'lineGraph') return Paper1.renderStimulus?.(resource) || '';
      if (resource.type === 'text') {
        return `<section class="paper1-stimulus"><span class="paper1-stimulus-label">RESOURCE BOOKLET</span><h3>${this.e(resource.title || 'Resource')}</h3><p class="paper1-stimulus-description">${this.e(resource.text || resource.description || '')}</p></section>`;
      }
      return Paper1.renderStimulus?.(resource) || '';
    },

    renderBooklet() {
      if (!this.caseStudy) return '';
      return `<details class="ess-p1fm-booklet" open><summary>Resource Booklet · ${this.e(this.caseStudy.title)}</summary><p>${this.e(this.caseStudy.summary || '')}</p>${(this.caseStudy.resources || []).map(resource => this.renderResource(resource)).join('')}</details>`;
    },

    async start() {
      const loaded = await this.loadData();
      if (!loaded) {
        alert('ESS Paper 1 Full Mock data could not be loaded.');
        return false;
      }
      const missing = this.missingUnits();
      if (missing.length) {
        alert(`This Full Mock includes material not selected in Course Coverage:\n\n${missing.join('\n')}\n\nSelect these units before starting.`);
        return false;
      }

      window.BiologyPaper1FullMock?.active && window.BiologyPaper1FullMock.stop?.();
      window.BiologyPaper2FullMock?.active && window.BiologyPaper2FullMock.stop?.();

      this.answers = Array(this.questions.length).fill('');
      this.i = 0;
      this.submitted = false;
      this.saved = false;
      this.sid = `ESS-P1-FULL-CS9-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.startAt = Date.now();
      this.endAt = 0;
      this.elapsed = 0;
      this.active = true;
      this.startTimer();
      Pages.show('practice');
      App.updatePracticeHeader();
      this.syncPanel();
      this.render();
      return true;
    },

    stop() {
      this.active = false;
      this.stopTimer();
      this.syncPanel();
    },

    startTimer() {
      this.stopTimer();
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    },

    stopTimer() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    },

    tick() {
      if (!this.startAt) return;
      this.elapsed = Math.floor(((this.endAt || Date.now()) - this.startAt) / 1000);
      const remaining = Math.max(0, 7200 - this.elapsed);
      const element = document.getElementById('ess-p1fm-time');
      if (!element) return;
      element.textContent = remaining
        ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
        : `Time elapsed · +${Math.floor((this.elapsed - 7200) / 60)} min`;
      element.classList.toggle('elapsed', !remaining);
    },

    render() {
      if (!this.active || this.submitted) return;
      const q = this.questions[this.i];
      const progress = document.getElementById('ess-p1fm-progress');
      const booklet = document.getElementById('ess-p1fm-booklet');
      const question = document.getElementById('ess-p1fm-question');
      const actions = document.getElementById('ess-p1fm-actions');
      const feedback = document.getElementById('ess-p1fm-feedback');
      if (progress) progress.textContent = `Question ${this.i + 1}/7 · ${q.marks} marks · ${this.answers.filter(answer => answer.trim()).length}/7 answered`;
      if (booklet) booklet.innerHTML = this.renderBooklet();
      if (question) question.innerHTML = `
        <div class="ess-p1fm-head"><strong>Question ${this.i + 1} · ${this.e(q.commandTerm || 'Response')}</strong><span>${q.marks} marks</span></div>
        <p>${this.e(q.question)}</p>
        <textarea aria-label="Answer to question ${this.i + 1}" oninput="EssPaper1FullMock.answers[${this.i}]=this.value">${this.e(this.answers[this.i])}</textarea>`;
      if (feedback) feedback.innerHTML = '';
      if (actions) actions.innerHTML = `
        <button ${this.i === 0 ? 'disabled' : ''} onclick="EssPaper1FullMock.move(-1)">← Previous</button>
        ${this.i < 6 ? '<button onclick="EssPaper1FullMock.move(1)">Next →</button>' : '<button onclick="EssPaper1FullMock.submit()">Submit Full Paper</button>'}`;
    },

    move(delta) {
      this.i = Math.max(0, Math.min(6, this.i + delta));
      this.render();
    },

    submit() {
      const missing = this.answers.findIndex(answer => !answer.trim());
      if (missing >= 0) {
        this.i = missing;
        this.render();
        alert(`Question ${missing + 1} is unanswered.`);
        return;
      }
      this.submitted = true;
      this.endAt = Date.now();
      this.stopTimer();
      this.tick();
      this.review();
    },

    review() {
      const progress = document.getElementById('ess-p1fm-progress');
      const booklet = document.getElementById('ess-p1fm-booklet');
      const question = document.getElementById('ess-p1fm-question');
      const actions = document.getElementById('ess-p1fm-actions');
      const feedback = document.getElementById('ess-p1fm-feedback');
      if (progress) progress.textContent = `Submitted · Elapsed ${Math.floor(this.elapsed / 60)}:${String(this.elapsed % 60).padStart(2, '0')}`;
      if (booklet) booklet.innerHTML = this.renderBooklet();
      if (question) question.innerHTML = '<p><strong>Paper submitted.</strong> Tick each markscheme point that your answer clearly earns.</p>';
      if (actions) actions.innerHTML = '';

      let k = 0;
      const reviews = this.questions.map((q, qi) => `
        <section class="ess-p1fm-review">
          <div class="ess-p1fm-head"><h4>Question ${qi + 1}</h4><strong>${q.marks} marks</strong></div>
          <p><strong>${this.e(q.commandTerm || '')}</strong> · ${this.e(q.question)}</p>
          <div class="ess-p1fm-user"><strong>Your answer:</strong><br>${this.e(this.answers[qi])}</div>
          ${q.markscheme.map((point, mi) => `<span class="ess-p1fm-point"><label><input type="checkbox" data-ess-p1fm-mark="${k++}" onchange="EssPaper1FullMock.score()"><span>${this.e(point)}${q.markschemeJa?.[mi] ? `<span class="ess-p1fm-ja">日本語：${this.e(q.markschemeJa[mi])}</span>` : ''}</span></label></span>`).join('')}
          <div class="ess-p1fm-model"><strong>Model Answer</strong><p>${this.e(q.modelAnswer || '')}</p><span class="ess-p1fm-ja">日本語：${this.e(q.modelAnswerJa || '')}</span></div>
        </section>`).join('');

      if (feedback) feedback.innerHTML = `
        <div class="ess-p1fm-summary">
          <div class="ess-p1fm-stat">Score<br><strong id="ess-p1fm-score">0/70</strong></div>
          <div class="ess-p1fm-stat">Percentage<br><strong id="ess-p1fm-percent">0%</strong></div>
          <div class="ess-p1fm-stat">Time<br><strong>${Math.floor(this.elapsed / 60)} min</strong></div>
        </div>
        ${reviews}
        <div class="ess-p1fm-actions"><button id="ess-p1fm-save" onclick="EssPaper1FullMock.save()">Save Full Mock Score</button><span id="ess-p1fm-status" class="muted">Not saved yet.</span></div>`;
      this.score();
    },

    score() {
      const score = document.querySelectorAll('input[data-ess-p1fm-mark]:checked').length;
      const percent = Math.round(score / 70 * 100);
      const scoreElement = document.getElementById('ess-p1fm-score');
      const percentElement = document.getElementById('ess-p1fm-percent');
      if (scoreElement) scoreElement.textContent = `${score}/70`;
      if (percentElement) percentElement.textContent = `${percent}%`;
      return score;
    },

    save() {
      if (this.saved || !this.submitted || typeof Paper1Progress === 'undefined') return;
      const score = this.score();
      const createdAt = new Date(this.endAt).toISOString();
      const attempt = {
        attemptId: `${this.sid}-paper1`,
        schemaVersion: Paper1Progress.schemaVersion,
        subject: 'ESS HL',
        sessionId: this.sid,
        fullMock: true,
        caseStudyId: this.caseStudy?.id || 'ESS-CS9-ATM-ECO-001',
        questionIds: this.questions.map(q => q.id),
        section: 'esspaper1',
        assessmentTarget: 'ess-paper1',
        chapter: 'Paper 1 Full Mock',
        questionType: 'full-mock-ess-paper1',
        score,
        maxMarks: 70,
        percentage: Math.round(score / 70 * 100),
        fullMockTotalScore: score,
        fullMockTotalMaxMarks: 70,
        elapsedSeconds: this.elapsed,
        evaluator: { type: 'self-checklist', version: 1 },
        createdAt
      };
      const data = Paper1Progress.load();
      if (data.attempts.some(item => item.sessionId === this.sid)) return;
      data.attempts.push(attempt);
      Storage.save(Paper1Progress.storageKey, data);
      this.saved = true;
      document.querySelectorAll('input[data-ess-p1fm-mark]').forEach(input => { input.disabled = true; });
      const button = document.getElementById('ess-p1fm-save');
      const status = document.getElementById('ess-p1fm-status');
      if (button) button.disabled = true;
      if (status) status.textContent = `${score}/70 (${Math.round(score / 70 * 100)}%) saved.`;
    },

    install() {
      if (
        this.installed
        || typeof App === 'undefined'
        || typeof Pages === 'undefined'
        || typeof Paper1 === 'undefined'
        || typeof Paper1Progress === 'undefined'
        || typeof EssExam === 'undefined'
      ) return false;

      this.ui();
      const applyPracticeTypeUI = App.applyPracticeTypeUI;
      const startPractice = App.startPractice;
      const openPractice = App.openPractice;
      const updatePracticeHeader = App.updatePracticeHeader;
      const paper1ApplySectionUI = Paper1.applySectionUI;

      App.applyPracticeTypeUI = function(...args) {
        const result = applyPracticeTypeUI.apply(this, args);
        F.sync();
        return result;
      };
      App.startPractice = async function(...args) {
        if (this.state.subject === 'ESS HL' && this.state.practiceType === 'paper1' && F.mode === 'full') return F.start();
        if (F.active) F.stop();
        return startPractice.apply(this, args);
      };
      App.openPractice = async function(...args) {
        if (this.state.subject === 'ESS HL' && this.state.practiceType === 'paper1' && F.mode === 'full') {
          if (F.active) {
            Pages.show('practice');
            this.updatePracticeHeader();
            F.syncPanel();
            if (F.submitted) F.review(); else F.render();
            return true;
          }
          return F.start();
        }
        if (F.active) F.stop();
        return openPractice.apply(this, args);
      };
      App.updatePracticeHeader = function(...args) {
        const result = updatePracticeHeader.apply(this, args);
        if (F.active) {
          const element = document.getElementById('selection-subject-practice');
          if (element) element.textContent = 'ESS HL · Paper 1 Full Mock · 70 marks / 120 min';
          F.syncPanel();
        }
        return result;
      };
      Paper1.applySectionUI = function(...args) {
        const result = paper1ApplySectionUI.apply(this, args);
        F.sync();
        F.syncPanel();
        return result;
      };

      this.installed = true;
      this.sync();
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (this.install() || attempts > 800) {
          clearInterval(timer);
          if (!this.installed) console.warn('ESS Paper 1 Full Mock could not initialize. Existing ESS Paper 1 Practice remains available.');
        }
      }, 50);
    }
  };

  F.boot();
})();
