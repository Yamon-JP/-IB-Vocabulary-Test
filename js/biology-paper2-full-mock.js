(() => {
  const F = window.BiologyPaper2FullMock = {
    mode: 'practice',
    mockSet: 'auto',
    currentSet: 1,
    active: false,
    phase: 'a',
    installed: false,
    submitted: false,
    saved: false,
    data: null,
    dataCache: {},
    dataPromises: {},
    aq: [],
    aa: [],
    ai: 0,
    bq: [],
    bi: -1,
    ba: ['', ''],
    sid: '',
    startAt: 0,
    endAt: 0,
    timer: null,
    elapsed: 0,

    e(v) {
      return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    normalizeSet(value) {
      if (value === 'auto') return 'auto';
      const n = Number(value);
      return [1, 2, 3].includes(n) ? n : 'auto';
    },

    setPath(set) {
      return `data/paper2/biology-paper2a-mock-v${set}.json?v=${set}`;
    },

    validateA(data) {
      if (!data || Number(data.totalMarks) !== 34 || !Array.isArray(data.questions) || data.questions.length !== 5) return false;
      const marks = data.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
      const points = data.questions.reduce((sum, q) => sum + (q.parts || []).reduce((partSum, p) => partSum + (p.markscheme || []).length, 0), 0);
      const partsValid = data.questions.every(q => (q.parts || []).every(p =>
        Number(p.marks) === (p.markscheme || []).length
        && (p.markschemeJa || []).length === (p.markscheme || []).length
        && typeof p.modelAnswer === 'string'
        && typeof p.modelAnswerJa === 'string'
      ));
      return marks === 34 && points === 34 && partsValid;
    },

    async loadASet(set) {
      set = Number(set);
      if (this.dataCache[set]) return this.dataCache[set];
      if (this.dataPromises[set]) return this.dataPromises[set];

      this.dataPromises[set] = (async () => {
        try {
          const response = await fetch(this.setPath(set));
          const data = await response.json();
          if (!response.ok || !this.validateA(data)) throw new Error('invalid');
          this.dataCache[set] = data;
          return data;
        } catch (error) {
          console.warn(`Biology Paper 2 Section A Mock Set ${set} data unavailable.`, error);
          return null;
        } finally {
          delete this.dataPromises[set];
        }
      })();

      return this.dataPromises[set];
    },

    learned() {
      return App.getCourseCoverageItems?.('Biology SL') || App.state.biologyLearnedUnits || [];
    },

    missingUnits(data) {
      const learned = new Set(this.learned());
      return (data?.requiredUnits || []).filter(unit => !learned.has(unit));
    },

    inferSet(attempt) {
      const explicit = Number(attempt?.mockSet);
      if ([1, 2, 3].includes(explicit)) return explicit;
      const id = String(attempt?.questionId || '');
      const match = id.match(/BIO-P2A-MOCK-V([123])/);
      return match ? Number(match[1]) : null;
    },

    setLastUse() {
      const last = new Map([[1, 0], [2, 0], [3, 0]]);
      const attempts = Paper2Progress.load().attempts || [];
      attempts
        .filter(a => a?.fullMock && a?.assessmentTarget === 'paper2a')
        .forEach(a => {
          const set = this.inferSet(a);
          const time = Date.parse(a?.createdAt) || 0;
          if (set && time > (last.get(set) || 0)) last.set(set, time);
        });
      return last;
    },

    async resolveSet() {
      if (this.mockSet !== 'auto') {
        const set = Number(this.mockSet);
        const data = await this.loadASet(set);
        return { set, data, missing: this.missingUnits(data), auto: false };
      }

      const loaded = await Promise.all([1, 2, 3].map(async set => ({ set, data: await this.loadASet(set) })));
      const eligible = loaded.filter(item => item.data && this.missingUnits(item.data).length === 0);
      if (!eligible.length) return { set: null, data: null, missing: [], auto: true };

      const lastUse = this.setLastUse();
      eligible.sort((a, b) => (lastUse.get(a.set) || 0) - (lastUse.get(b.set) || 0) || a.set - b.set);
      return { ...eligible[0], missing: [], auto: true };
    },

    eligibleB() {
      const learned = new Set(this.learned());
      return (Paper2.allQuestions || []).filter(q =>
        q?.subject === 'Biology SL'
        && q?.assessmentTarget === 'paper2b'
        && Number(q.marks) === 16
        && Array.isArray(q.markscheme)
        && q.markscheme.length === 16
        && Array.isArray(q.requiredUnits)
        && q.requiredUnits.length
        && q.requiredUnits.every(unit => learned.has(unit))
        && q.modelAnswer
      );
    },

    recentBIds() {
      const attempts = [...(Paper2Progress.load().attempts || [])]
        .filter(a => a?.fullMock && a?.assessmentTarget === 'paper2b')
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
      if (!attempts.length) return new Set();
      const latest = attempts[0];
      const ids = Array.isArray(latest.paper2bOptionIds) && latest.paper2bOptionIds.length
        ? latest.paper2bOptionIds
        : [latest.selectedQuestionId || latest.questionId].filter(Boolean);
      return new Set(ids);
    },

    shuffle(items) {
      const a = [...items];
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    pickB(items) {
      const recent = this.recentBIds();
      const fresh = items.filter(q => !recent.has(q.id));
      const source = fresh.length >= 2 ? fresh : items;
      const shuffled = this.shuffle(source);
      if (shuffled.length < 2) return [];
      const first = shuffled[0];
      const theme = String(first.chapter || '')[0];
      const second = shuffled.find((q, index) => index && String(q.chapter || '')[0] !== theme) || shuffled[1];
      return [first, second];
    },

    ui() {
      if (!document.getElementById('p2fm-css')) {
        const style = document.createElement('style');
        style.id = 'p2fm-css';
        style.textContent = `
          #p2fm-control{margin-top:14px}
          .p2fm-top,.p2fm-head{display:flex;justify-content:space-between;gap:10px}
          .p2fm-top,.p2fm-part,.p2fm-review,.p2fm-option{padding:12px;border:1px solid #dfe5ee;border-radius:12px;background:#fbfcfe}
          .p2fm-time{font-weight:900}.p2fm-time.elapsed{color:#b42318}
          .p2fm-parts,.p2fm-options{display:grid;gap:10px;margin-top:12px}
          .p2fm-part textarea,.p2fm-section-b-answer{width:100%;min-height:110px;padding:10px;border:1px solid var(--border-strong);border-radius:10px;resize:vertical}
          .p2fm-section-b-answer{min-height:300px}
          .p2fm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
          .p2fm-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
          .p2fm-stat{text-align:center;padding:9px;border:1px solid #dfe5ee;border-radius:10px}
          .p2fm-ja{display:block;color:#667085;font-size:.86rem;margin-top:3px}
          .p2fm-item{padding:10px 0;border-top:1px solid #eaecf0}.p2fm-user{padding:8px;background:#f8fafc;white-space:pre-wrap}
          .p2fm-point{display:block;margin:7px 0}.p2fm-model{padding:8px;border-left:3px solid #98a2b3;background:#f9fafb}
          .p2fm-option.selected{border-color:#667085;box-shadow:0 0 0 1px #667085 inset}.p2fm-option p{white-space:pre-wrap}
          .p2fm-set-selector{margin-top:12px;padding:12px;border:1px solid #e4e7ec;border-radius:12px;background:#f8fafc}
          .p2fm-set-selector strong{display:block;margin-bottom:8px}.p2fm-set-buttons{display:flex;flex-wrap:wrap;gap:8px}
          .p2fm-set-buttons button{min-height:38px}.p2fm-set-buttons button.active{box-shadow:0 0 0 2px #667085 inset;font-weight:850}
          @media(max-width:720px){.p2fm-top,.p2fm-head{flex-direction:column}.p2fm-summary{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
      }

      const base = document.getElementById('paper2-section-control');
      if (base && !document.getElementById('p2fm-control')) {
        const control = document.createElement('div');
        control.id = 'p2fm-control';
        control.className = 'paper1-section-control';
        control.style.display = 'none';
        control.innerHTML = `
          <h3>Paper 2 Exam Mode</h3>
          <div class="paper1-section-grid">
            <button id="p2fm-practice" class="paper1-section-card active" onclick="BiologyPaper2FullMock.setMode('practice')">
              <strong>Practice</strong><small>Paper 2 Section A / Section B practice</small>
            </button>
            <button id="p2fm-full" class="paper1-section-card" onclick="BiologyPaper2FullMock.setMode('full')">
              <strong>Full Paper Mock</strong><small>Section A 34 + Section B 16 · 50 marks · 90 min</small>
            </button>
          </div>
          <div id="p2fm-set-selector" class="p2fm-set-selector" style="display:none">
            <strong>Mock Set</strong>
            <div class="p2fm-set-buttons">
              <button type="button" data-p2fm-set="auto" onclick="BiologyPaper2FullMock.setMockSet('auto')">Auto</button>
              <button type="button" data-p2fm-set="1" onclick="BiologyPaper2FullMock.setMockSet(1)">Set 1</button>
              <button type="button" data-p2fm-set="2" onclick="BiologyPaper2FullMock.setMockSet(2)">Set 2</button>
              <button type="button" data-p2fm-set="3" onclick="BiologyPaper2FullMock.setMockSet(3)">Set 3</button>
            </div>
            <small class="muted">Auto prioritizes an eligible Section A set that has not been used recently.</small>
          </div>
          <p id="p2fm-note" class="muted">Uses only Learned Units. Section B requires at least two eligible 16-mark questions.</p>`;
        base.after(control);
      }

      const host = document.getElementById('paper2-practice-panel');
      if (host && !document.getElementById('p2fm-panel')) {
        const panel = document.createElement('section');
        panel.id = 'p2fm-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
          <div class="p2fm-top">
            <div><strong id="p2fm-phase">Section A</strong><div id="p2fm-progress" class="muted"></div></div>
            <div><span class="muted">90-minute paper</span><strong id="p2fm-time" class="p2fm-time">90:00</strong></div>
          </div>
          <section id="p2fm-q" class="paper2-question-card"></section>
          <div id="p2fm-parts" class="p2fm-parts"></div>
          <div id="p2fm-actions" class="p2fm-actions"></div>
          <section id="p2fm-feedback"></section>`;
        host.appendChild(panel);
      }

      this.syncSetButtons();
    },

    syncSetButtons() {
      document.querySelectorAll('[data-p2fm-set]').forEach(button => {
        const raw = button.dataset.p2fmSet;
        const value = raw === 'auto' ? 'auto' : Number(raw);
        button.classList.toggle('active', value === this.mockSet);
      });
    },

    setMockSet(value) {
      if (this.active) return;
      this.mockSet = this.normalizeSet(value);
      this.syncSetButtons();
      this.sync();
    },

    async sync() {
      this.ui();
      const relevant = App.state.subject === 'Biology SL' && App.state.practiceType === 'paper2';
      const control = document.getElementById('p2fm-control');
      const section = document.getElementById('paper2-section-control');
      const scope = document.querySelector('.scope-control');
      const chapters = document.getElementById('chapter-options');
      const startButton = document.querySelector('.selection-actions .primary-action');
      const selector = document.getElementById('p2fm-set-selector');

      if (!relevant && this.active) this.stop();
      if (control) control.style.display = relevant ? 'block' : 'none';
      document.getElementById('p2fm-practice')?.classList.toggle('active', this.mode !== 'full');
      document.getElementById('p2fm-full')?.classList.toggle('active', this.mode === 'full');
      if (selector) selector.style.display = relevant && this.mode === 'full' ? 'block' : 'none';
      this.syncSetButtons();

      if (relevant && this.mode === 'full') {
        if (section) section.style.display = 'none';
        if (scope) scope.style.display = 'none';
        if (chapters) chapters.style.display = 'none';
        if (startButton) startButton.textContent = 'Start Full Mock →';

        const resolved = await this.resolveSet();
        const bPool = this.eligibleB();
        const note = document.getElementById('p2fm-note');
        if (!note) return;

        if (!resolved.data) {
          note.textContent = `No Section A Mock Set currently matches all Learned Units. Section B eligible: ${bPool.length}/2.`;
          return;
        }

        const prefix = resolved.auto ? `Auto → Set ${resolved.set}. ` : `Set ${resolved.set}. `;
        if (resolved.missing.length === 0 && bPool.length >= 2) {
          note.textContent = `${prefix}Ready: Section A requirements met · ${bPool.length} eligible 16-mark Section B questions.`;
        } else {
          note.textContent = `${prefix}${resolved.missing.length ? `Section A needs: ${resolved.missing.join(', ')}. ` : ''}Section B eligible: ${bPool.length}/2.`;
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
      if (this.active && next !== 'full' && !confirm('End the current Paper 2 Full Mock? Unsaved answers will be lost.')) return;
      if (this.active && next !== 'full') this.stop();
      this.mode = next;
      this.sync();
    },

    syncPanel() {
      this.ui();
      const panel = document.getElementById('p2fm-panel');
      const base = document.getElementById('paper2-practice-panel');
      const achievements = document.getElementById('practice-achievements');
      if (panel) panel.style.display = this.active ? 'block' : 'none';
      if (base) base.querySelectorAll(':scope > :not(#p2fm-panel)').forEach(element => {
        element.style.display = this.active ? 'none' : '';
      });
      if (achievements) achievements.style.display = this.active ? 'none' : '';
    },

    async start() {
      const resolved = await this.resolveSet();
      if (!resolved.data) {
        alert('No Paper 2 Section A Mock Set is available for the currently selected Learned Units.');
        return false;
      }

      const pool = this.eligibleB();
      if (resolved.missing.length || pool.length < 2) {
        alert(`${resolved.missing.length ? `Section A Set ${resolved.set} also requires:\n${resolved.missing.join('\n')}\n\n` : ''}Section B eligible 16-mark questions: ${pool.length}/2.\n\nSelect more Learned Units before starting.`);
        return false;
      }

      window.BiologyPaper1FullMock?.active && window.BiologyPaper1FullMock.stop?.();

      this.currentSet = resolved.set;
      this.data = resolved.data;
      this.aq = this.data.questions;
      this.aa = this.data.questions.map(q => q.parts.map(() => ''));
      this.ai = 0;
      this.bq = this.pickB(pool);
      this.bi = -1;
      this.ba = ['', ''];
      this.phase = 'a';
      this.submitted = false;
      this.saved = false;
      this.sid = `BIO-P2-FULL-S${this.currentSet}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this.startAt = Date.now();
      this.endAt = 0;
      this.active = true;
      this.startTimer();
      Pages.show('practice');
      App.updatePracticeHeader();
      this.syncPanel();
      this.renderA();
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
      const remaining = Math.max(0, 5400 - this.elapsed);
      const element = document.getElementById('p2fm-time');
      if (!element) return;
      element.textContent = remaining
        ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
        : `Time elapsed · +${Math.floor((this.elapsed - 5400) / 60)} min`;
      element.classList.toggle('elapsed', !remaining);
    },

    renderA() {
      if (!this.active || this.phase !== 'a' || this.submitted) return;
      const q = this.aq[this.ai];
      const question = document.getElementById('p2fm-q');
      const parts = document.getElementById('p2fm-parts');
      const actions = document.getElementById('p2fm-actions');
      const feedback = document.getElementById('p2fm-feedback');

      document.getElementById('p2fm-phase').textContent = `Paper 2 · Section A · Set ${this.currentSet}`;
      document.getElementById('p2fm-progress').textContent = `Question ${this.ai + 1}/${this.aq.length} · ${q.marks} marks`;
      question.innerHTML = `${Paper2.renderStimulus?.(q.stimulus) || ''}<div class="paper2-question-text">${this.e(q.question || 'Answer all parts.')}</div>`;
      feedback.innerHTML = '';
      parts.innerHTML = q.parts.map((part, index) => `
        <section class="p2fm-part">
          <div class="p2fm-head"><strong>${this.e(part.label)} · ${this.e(part.commandTerm)}</strong><span>${part.marks} mark${part.marks === 1 ? '' : 's'}</span></div>
          <p>${this.e(part.question)}</p>
          <textarea oninput="BiologyPaper2FullMock.aa[${this.ai}][${index}]=this.value">${this.e(this.aa[this.ai][index])}</textarea>
        </section>`).join('');
      actions.innerHTML = `<button ${this.ai === 0 ? 'disabled' : ''} onclick="BiologyPaper2FullMock.moveA(-1)">← Previous</button>${this.ai < this.aq.length - 1 ? '<button onclick="BiologyPaper2FullMock.moveA(1)">Next →</button>' : '<button onclick="BiologyPaper2FullMock.toB()">Continue to Section B →</button>'}`;
    },

    moveA(delta) {
      this.ai = Math.max(0, Math.min(this.aq.length - 1, this.ai + delta));
      this.renderA();
    },

    toB() {
      for (let qi = 0; qi < this.aq.length; qi += 1) {
        for (let pi = 0; pi < this.aq[qi].parts.length; pi += 1) {
          if (!this.aa[qi][pi].trim()) {
            this.ai = qi;
            this.renderA();
            alert(`Section A Question ${qi + 1} is incomplete.`);
            return;
          }
        }
      }
      this.phase = 'bselect';
      this.renderBSelect();
    },

    renderBSelect() {
      if (!this.active || this.submitted) return;
      const question = document.getElementById('p2fm-q');
      const parts = document.getElementById('p2fm-parts');
      const actions = document.getElementById('p2fm-actions');
      const feedback = document.getElementById('p2fm-feedback');

      document.getElementById('p2fm-phase').textContent = `Paper 2 · Section B · Set ${this.currentSet}`;
      document.getElementById('p2fm-progress').textContent = 'Choose one of two questions · 16 marks';
      question.innerHTML = '<div class="paper2-question-text"><strong>Choose ONE question.</strong> Both options are 16 marks. Your other option will not be marked.</div>';
      feedback.innerHTML = '';
      parts.innerHTML = `<div class="p2fm-options">${this.bq.map((q, index) => `
        <section class="p2fm-option ${this.bi === index ? 'selected' : ''}">
          <div class="p2fm-head"><strong>Option ${index + 1}</strong><span>16 marks</span></div>
          <p>${this.e(q.question)}</p>
          <small class="muted">Required units: ${this.e((q.requiredUnits || []).join(' · '))}</small>
          <div class="p2fm-actions"><button onclick="BiologyPaper2FullMock.selectB(${index})">${this.bi === index ? 'Continue with this option' : `Choose Option ${index + 1}`}</button></div>
        </section>`).join('')}</div>`;
      actions.innerHTML = '<button onclick="BiologyPaper2FullMock.phase=\'a\';BiologyPaper2FullMock.ai=BiologyPaper2FullMock.aq.length-1;BiologyPaper2FullMock.renderA()">← Back to Section A</button>';
    },

    selectB(index) {
      this.bi = index;
      this.phase = 'b';
      this.renderB();
    },

    renderB() {
      if (!this.active || this.phase !== 'b' || this.submitted || this.bi < 0) return;
      const q = this.bq[this.bi];
      const question = document.getElementById('p2fm-q');
      const parts = document.getElementById('p2fm-parts');
      const actions = document.getElementById('p2fm-actions');
      const feedback = document.getElementById('p2fm-feedback');

      document.getElementById('p2fm-phase').textContent = `Paper 2 · Section B · Option ${this.bi + 1} · Set ${this.currentSet}`;
      document.getElementById('p2fm-progress').textContent = '16 marks · Answer this question only';
      question.innerHTML = `${Paper2.renderStimulus?.(q.stimulus) || ''}<div class="paper2-question-text">${this.e(q.question)}</div>`;
      feedback.innerHTML = '';
      parts.innerHTML = `
        <section class="p2fm-part">
          <div class="p2fm-head"><strong>${this.e(q.commandTerm || 'Structured response')}</strong><span>16 marks</span></div>
          <textarea class="p2fm-section-b-answer" oninput="BiologyPaper2FullMock.ba[${this.bi}]=this.value">${this.e(this.ba[this.bi])}</textarea>
        </section>`;
      actions.innerHTML = '<button onclick="BiologyPaper2FullMock.phase=\'bselect\';BiologyPaper2FullMock.renderBSelect()">← Change Section B option</button><button onclick="BiologyPaper2FullMock.submit()">Submit Full Paper</button>';
    },

    submit() {
      if (this.bi < 0) {
        this.phase = 'bselect';
        this.renderBSelect();
        return;
      }
      if (!this.ba[this.bi].trim()) {
        this.renderB();
        alert('Write your Section B answer before submitting.');
        return;
      }
      this.submitted = true;
      this.endAt = Date.now();
      this.stopTimer();
      this.tick();
      this.review();
    },

    review() {
      const question = document.getElementById('p2fm-q');
      const parts = document.getElementById('p2fm-parts');
      const actions = document.getElementById('p2fm-actions');
      const feedback = document.getElementById('p2fm-feedback');
      const bQuestion = this.bq[this.bi];

      document.getElementById('p2fm-phase').textContent = `Paper 2 submitted · Set ${this.currentSet} · Self-mark`;
      document.getElementById('p2fm-progress').textContent = `Elapsed ${Math.floor(this.elapsed / 60)}:${String(this.elapsed % 60).padStart(2, '0')}`;
      question.innerHTML = '<p><strong>Paper submitted.</strong> Tick only the markscheme points clearly earned by your answers.</p>';
      parts.innerHTML = '';
      actions.innerHTML = '';

      let aKey = 0;
      const aReview = this.aq.map((q, qi) => `
        <section class="p2fm-review">
          <h4>Section A · Question ${qi + 1} · ${q.marks} marks</h4>
          ${q.parts.map((part, pi) => `
            <div class="p2fm-item">
              <strong>${this.e(part.label)} · ${this.e(part.commandTerm)} [${part.marks}]</strong>
              <p>${this.e(part.question)}</p>
              <div class="p2fm-user"><strong>Your answer:</strong><br>${this.e(this.aa[qi][pi])}</div>
              ${part.markscheme.map((point, zi) => `<span class="p2fm-point"><label><input type="checkbox" data-p2fm-a="${aKey++}" onchange="BiologyPaper2FullMock.score()"><span>${this.e(point)}${part.markschemeJa?.[zi] ? `<span class="p2fm-ja">日本語：${this.e(part.markschemeJa[zi])}</span>` : ''}</span></label></span>`).join('')}
              <div class="p2fm-model"><strong>Model Answer</strong><p>${this.e(part.modelAnswer || '')}</p><p class="p2fm-ja">日本語：${this.e(part.modelAnswerJa || '')}</p></div>
            </div>`).join('')}
        </section>`).join('');

      const bReview = `
        <section class="p2fm-review">
          <h4>Section B · Option ${this.bi + 1} · 16 marks</h4>
          <p>${this.e(bQuestion.question)}</p>
          <div class="p2fm-user"><strong>Your answer:</strong><br>${this.e(this.ba[this.bi])}</div>
          ${bQuestion.markscheme.map((point, index) => `<span class="p2fm-point"><label><input type="checkbox" data-p2fm-b="${index}" onchange="BiologyPaper2FullMock.score()"><span>${this.e(point)}${bQuestion.markschemeJa?.[index] ? `<span class="p2fm-ja">日本語：${this.e(bQuestion.markschemeJa[index])}</span>` : ''}</span></label></span>`).join('')}
          <div class="p2fm-model"><strong>Model Answer</strong><p>${this.e(bQuestion.modelAnswer || '')}</p><p class="p2fm-ja">日本語：${this.e(bQuestion.modelAnswerJa || '')}</p></div>
        </section>`;

      feedback.innerHTML = `
        <div class="p2fm-summary">
          <div class="p2fm-stat">Section A<br><strong id="p2fm-as">0/34</strong></div>
          <div class="p2fm-stat">Section B<br><strong id="p2fm-bs">0/16</strong></div>
          <div class="p2fm-stat">Total<br><strong id="p2fm-ts">0/50</strong></div>
        </div>
        ${aReview}${bReview}
        <div class="p2fm-actions"><button id="p2fm-save" onclick="BiologyPaper2FullMock.save()">Save Full Mock Score</button><span id="p2fm-status" class="muted">Not saved yet.</span></div>`;
      this.score();
    },

    score() {
      const aScore = document.querySelectorAll('input[data-p2fm-a]:checked').length;
      const bScore = document.querySelectorAll('input[data-p2fm-b]:checked').length;
      const total = aScore + bScore;
      document.getElementById('p2fm-as').textContent = `${aScore}/34`;
      document.getElementById('p2fm-bs').textContent = `${bScore}/16`;
      document.getElementById('p2fm-ts').textContent = `${total}/50 (${Math.round(total / 50 * 100)}%)`;
      return { as: aScore, bs: bScore, t: total };
    },

    save() {
      if (this.saved || !this.submitted) return;
      const score = this.score();
      const selected = this.bq[this.bi];
      const createdAt = new Date(this.endAt).toISOString();
      const base = {
        schemaVersion: Paper2Progress.schemaVersion,
        subject: 'Biology SL',
        sessionId: this.sid,
        fullMock: true,
        mockSet: this.currentSet,
        paper2bOptionIds: this.bq.map(q => q.id),
        fullMockTotalScore: score.t,
        fullMockTotalMaxMarks: 50,
        elapsedSeconds: this.elapsed,
        createdAt
      };
      const a = {
        ...base,
        attemptId: `${this.sid}-paper2a`,
        questionId: this.data.id,
        assessmentTarget: 'paper2a',
        chapter: 'Paper 2 Full Mock',
        unit: null,
        commandTerm: 'Structured response',
        difficulty: 'challenging',
        questionType: 'full-mock-paper2a',
        score: score.as,
        maxMarks: 34,
        percentage: Math.round(score.as / 34 * 100),
        evaluator: { type: 'self-checklist', version: 1 }
      };
      const b = {
        ...base,
        attemptId: `${this.sid}-paper2b`,
        questionId: selected.id,
        assessmentTarget: 'paper2b',
        chapter: 'Paper 2 Full Mock',
        unit: selected.unit || null,
        commandTerm: selected.commandTerm || 'Structured response',
        difficulty: selected.difficulty || 'challenging',
        questionType: 'full-mock-paper2b',
        selectedQuestionId: selected.id,
        score: score.bs,
        maxMarks: 16,
        percentage: Math.round(score.bs / 16 * 100),
        evaluator: { type: 'self-checklist', version: 1 }
      };

      const data = Paper2Progress.load();
      if (data.attempts.some(x => x.sessionId === this.sid)) return;
      data.attempts.push(a, b);
      Storage.save(Paper2Progress.storageKey, data);
      this.saved = true;

      document.querySelectorAll('input[data-p2fm-a],input[data-p2fm-b]').forEach(input => { input.disabled = true; });
      document.getElementById('p2fm-save').disabled = true;
      document.getElementById('p2fm-status').textContent = `Set ${this.currentSet} · ${score.as}/34 + ${score.bs}/16 = ${score.t}/50 saved.`;
    },

    install() {
      if (
        this.installed
        || typeof App === 'undefined'
        || typeof Pages === 'undefined'
        || typeof Paper2 === 'undefined'
        || typeof BiologyFinalTraining === 'undefined'
        || !BiologyFinalTraining.paper2Loaded
      ) return false;

      this.ui();
      const applyPracticeTypeUI = App.applyPracticeTypeUI;
      const startPractice = App.startPractice;
      const openPractice = App.openPractice;
      const updatePracticeHeader = App.updatePracticeHeader;

      App.applyPracticeTypeUI = function(...args) {
        const result = applyPracticeTypeUI.apply(this, args);
        F.sync();
        return result;
      };
      App.startPractice = async function(...args) {
        if (this.state.subject === 'Biology SL' && this.state.practiceType === 'paper2' && F.mode === 'full') return F.start();
        if (F.active) F.stop();
        return startPractice.apply(this, args);
      };
      App.openPractice = async function(...args) {
        if (this.state.subject === 'Biology SL' && this.state.practiceType === 'paper2' && F.mode === 'full') {
          if (F.active) {
            Pages.show('practice');
            this.updatePracticeHeader();
            F.syncPanel();
            if (!F.submitted) {
              if (F.phase === 'a') F.renderA();
              else if (F.phase === 'b') F.renderB();
              else F.renderBSelect();
            }
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
          if (element) element.textContent = `Biology SL · Paper 2 Full Mock · Set ${F.currentSet} · 50 marks / 90 min`;
          F.syncPanel();
        }
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
          if (!this.installed) console.warn('Biology Paper 2 Full Mock could not initialize. Existing Paper 2 Practice remains available.');
        }
      }, 50);
    }
  };

  F.boot();
})();
