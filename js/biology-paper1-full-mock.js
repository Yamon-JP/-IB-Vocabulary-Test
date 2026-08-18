(() => {
  const F = window.BiologyPaper1FullMock = {
    mode: 'practice',
    mockSet: 'auto',
    currentSet: 1,
    active: false,
    phase: 'a',
    installed: false,
    submitted: false,
    saved: false,
    qs: [],
    ans: [],
    i: 0,
    b: null,
    bCache: {},
    bPromises: {},
    ba: [],
    bi: 0,
    sid: '',
    startAt: 0,
    endAt: 0,
    timer: null,
    aScore: 0,
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
      return `data/paper1/biology-paper1b-mock-v${set}.json?v=${set}`;
    },

    validateB(data) {
      if (!data || Number(data.totalMarks) !== 25 || !Array.isArray(data.questions) || data.questions.length !== 4) return false;
      const marks = data.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
      const points = data.questions.reduce((sum, q) => sum + (q.parts || []).reduce((partSum, p) => partSum + (p.markscheme || []).length, 0), 0);
      const partsValid = data.questions.every(q => (q.parts || []).every(p =>
        Number(p.marks) === (p.markscheme || []).length
        && (p.markschemeJa || []).length === (p.markscheme || []).length
        && typeof p.modelAnswer === 'string'
        && typeof p.modelAnswerJa === 'string'
      ));
      return marks === 25 && points === 25 && partsValid;
    },

    async loadBSet(set) {
      set = Number(set);
      if (this.bCache[set]) return this.bCache[set];
      if (this.bPromises[set]) return this.bPromises[set];

      this.bPromises[set] = (async () => {
        try {
          const response = await fetch(this.setPath(set));
          const data = await response.json();
          if (!response.ok || !this.validateB(data)) throw new Error('invalid');
          this.bCache[set] = data;
          return data;
        } catch (error) {
          console.warn(`Paper 1 Full Mock Set ${set} data unavailable.`, error);
          return null;
        } finally {
          delete this.bPromises[set];
        }
      })();

      return this.bPromises[set];
    },

    learned() {
      return App.getCourseCoverageItems?.('Biology SL') || App.state.biologyLearnedUnits || [];
    },

    pool() {
      const learned = new Set(this.learned());
      return (Paper1.paper1aQuestions || []).filter(q =>
        q.subject === 'Biology SL'
        && q.assessmentTarget === 'paper1a'
        && q.requiredUnits?.length
        && q.requiredUnits.every(unit => learned.has(unit))
      );
    },

    missingUnits(data) {
      const learned = new Set(this.learned());
      return (data?.requiredUnits || []).filter(unit => !learned.has(unit));
    },

    inferSet(attempt) {
      const explicit = Number(attempt?.mockSet);
      if ([1, 2, 3].includes(explicit)) return explicit;
      const id = String(attempt?.questionId || '');
      const match = id.match(/BIO-P1B-MOCK-V([123])/);
      return match ? Number(match[1]) : null;
    },

    setLastUse() {
      const last = new Map([[1, 0], [2, 0], [3, 0]]);
      const attempts = Paper1Progress.load().attempts || [];
      attempts
        .filter(a => a?.fullMock && (a?.section === 'paper1b' || String(a?.questionType || '').includes('paper1b')))
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
        const data = await this.loadBSet(set);
        return { set, data, missing: this.missingUnits(data), auto: false };
      }

      const loaded = await Promise.all([1, 2, 3].map(async set => ({ set, data: await this.loadBSet(set) })));
      const eligible = loaded.filter(item => item.data && this.missingUnits(item.data).length === 0);
      if (!eligible.length) return { set: null, data: null, missing: [], auto: true };

      const lastUse = this.setLastUse();
      eligible.sort((a, b) => (lastUse.get(a.set) || 0) - (lastUse.get(b.set) || 0) || a.set - b.set);
      return { ...eligible[0], missing: [], auto: true };
    },

    recentPaper1AIds() {
      const attempts = [...(Paper1Progress.load().attempts || [])]
        .filter(a => a?.fullMock && Array.isArray(a?.paper1aQuestionIds) && a.paper1aQuestionIds.length)
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
      return new Set(attempts[0]?.paper1aQuestionIds || []);
    },

    shuffle(items) {
      const a = [...items];
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    takeBalanced(items, output, limit = 30) {
      const groups = { A: [], B: [], C: [], D: [], X: [] };
      this.shuffle(items).forEach(q => (groups[String(q.chapter || '')[0]] || groups.X).push(q));

      while (output.length < limit) {
        let added = 0;
        for (const theme of ['A', 'B', 'C', 'D']) {
          if (output.length >= limit) break;
          if (groups[theme].length) {
            output.push(groups[theme].shift());
            added += 1;
          }
        }
        if (!added) break;
      }

      if (output.length < limit) {
        const rest = this.shuffle([...groups.A, ...groups.B, ...groups.C, ...groups.D, ...groups.X]);
        while (output.length < limit && rest.length) output.push(rest.shift());
      }
      return output;
    },

    pick30(items) {
      const recent = this.recentPaper1AIds();
      const fresh = items.filter(q => !recent.has(q.id));
      const repeated = items.filter(q => recent.has(q.id));
      const output = [];
      this.takeBalanced(fresh, output, 30);
      if (output.length < 30) this.takeBalanced(repeated, output, 30);
      return output.slice(0, 30);
    },

    ui() {
      if (!document.getElementById('p1fm-css')) {
        const style = document.createElement('style');
        style.id = 'p1fm-css';
        style.textContent = `
          #p1fm-control{margin-top:14px}
          .p1fm-top,.p1fm-head{display:flex;justify-content:space-between;gap:10px}
          .p1fm-top,.p1fm-part,.p1fm-review{padding:12px;border:1px solid #dfe5ee;border-radius:12px;background:#fbfcfe}
          .p1fm-time{font-weight:900}.p1fm-time.elapsed{color:#b42318}
          .p1fm-parts{display:grid;gap:10px;margin-top:12px}
          .p1fm-part textarea{width:100%;min-height:100px;padding:10px;border:1px solid var(--border-strong);border-radius:10px}
          .p1fm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
          .p1fm-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
          .p1fm-stat{text-align:center;padding:9px;border:1px solid #dfe5ee;border-radius:10px}
          .p1fm-ja{color:#667085;font-size:.86rem}.p1fm-item{padding:10px 0;border-top:1px solid #eaecf0}
          .p1fm-user{padding:8px;background:#f8fafc;white-space:pre-wrap}.p1fm-point{display:block;margin:7px 0}
          .p1fm-model{padding:8px;border-left:3px solid #98a2b3;background:#f9fafb}
          .p1fm-set-selector{margin-top:12px;padding:12px;border:1px solid #e4e7ec;border-radius:12px;background:#f8fafc}
          .p1fm-set-selector strong{display:block;margin-bottom:8px}
          .p1fm-set-buttons{display:flex;flex-wrap:wrap;gap:8px}
          .p1fm-set-buttons button{min-height:38px}
          .p1fm-set-buttons button.active{box-shadow:0 0 0 2px #667085 inset;font-weight:850}
          @media(max-width:720px){.p1fm-top,.p1fm-head{flex-direction:column}.p1fm-summary{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
      }

      const base = document.getElementById('paper1-section-control');
      if (base && !document.getElementById('p1fm-control')) {
        const control = document.createElement('div');
        control.id = 'p1fm-control';
        control.className = 'paper1-section-control';
        control.style.display = 'none';
        control.innerHTML = `
          <h3>Paper 1 Exam Mode</h3>
          <div class="paper1-section-grid">
            <button id="p1fm-practice" class="paper1-section-card active" onclick="BiologyPaper1FullMock.setMode('practice')">
              <strong>Practice</strong><small>Paper 1A / Paper 1B practice</small>
            </button>
            <button id="p1fm-full" class="paper1-section-card" onclick="BiologyPaper1FullMock.setMode('full')">
              <strong>Full Paper Mock</strong><small>30 MCQ + 25-mark Paper 1B · 55 marks · 90 min</small>
            </button>
          </div>
          <div id="p1fm-set-selector" class="p1fm-set-selector" style="display:none">
            <strong>Mock Set</strong>
            <div class="p1fm-set-buttons">
              <button type="button" data-p1fm-set="auto" onclick="BiologyPaper1FullMock.setMockSet('auto')">Auto</button>
              <button type="button" data-p1fm-set="1" onclick="BiologyPaper1FullMock.setMockSet(1)">Set 1</button>
              <button type="button" data-p1fm-set="2" onclick="BiologyPaper1FullMock.setMockSet(2)">Set 2</button>
              <button type="button" data-p1fm-set="3" onclick="BiologyPaper1FullMock.setMockSet(3)">Set 3</button>
            </div>
            <small class="muted">Auto prioritizes an eligible set that has not been used recently.</small>
          </div>
          <p id="p1fm-note" class="muted">Uses only Learned Units. Requires at least 30 eligible Paper 1A questions.</p>`;
        base.after(control);
      }

      const host = document.getElementById('paper1-practice-panel');
      if (host && !document.getElementById('p1fm-panel')) {
        const panel = document.createElement('section');
        panel.id = 'p1fm-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
          <div class="p1fm-top">
            <div><strong id="p1fm-phase">Paper 1A</strong><div id="p1fm-progress" class="muted"></div></div>
            <div><span class="muted">90-minute paper</span><strong id="p1fm-time" class="p1fm-time">90:00</strong></div>
          </div>
          <section id="p1fm-q" class="paper1-question-card"></section>
          <div id="p1fm-choices" class="paper1-choice-list"></div>
          <div id="p1fm-parts" class="p1fm-parts"></div>
          <div id="p1fm-actions" class="p1fm-actions"></div>
          <section id="p1fm-feedback"></section>`;
        host.appendChild(panel);
      }

      this.syncSetButtons();
    },

    syncSetButtons() {
      document.querySelectorAll('[data-p1fm-set]').forEach(button => {
        const raw = button.dataset.p1fmSet;
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
      const relevant = App.state.subject === 'Biology SL' && App.state.practiceType === 'paper1';
      const control = document.getElementById('p1fm-control');
      const section = document.getElementById('paper1-section-control');
      const scope = document.querySelector('.scope-control');
      const chapters = document.getElementById('chapter-options');
      const startButton = document.querySelector('.selection-actions .primary-action');
      const selector = document.getElementById('p1fm-set-selector');

      if (control) control.style.display = relevant ? 'block' : 'none';
      document.getElementById('p1fm-practice')?.classList.toggle('active', this.mode !== 'full');
      document.getElementById('p1fm-full')?.classList.toggle('active', this.mode === 'full');
      if (selector) selector.style.display = relevant && this.mode === 'full' ? 'block' : 'none';
      this.syncSetButtons();

      if (relevant && this.mode === 'full') {
        if (section) section.style.display = 'none';
        if (scope) scope.style.display = 'none';
        if (chapters) chapters.style.display = 'none';
        if (startButton) startButton.textContent = 'Start Full Mock →';

        const resolved = await this.resolveSet();
        const note = document.getElementById('p1fm-note');
        const available = this.pool().length;
        if (!note) return;

        if (!resolved.data) {
          note.textContent = `Paper 1A available: ${available}/30. No Paper 1B Mock Set currently matches all Learned Units.`;
          return;
        }

        const prefix = resolved.auto ? `Auto → Set ${resolved.set}. ` : `Set ${resolved.set}. `;
        if (available >= 30 && resolved.missing.length === 0) {
          note.textContent = `${prefix}Ready: ${available} eligible Paper 1A questions · Paper 1B requirements met.`;
        } else {
          note.textContent = `${prefix}Paper 1A available: ${available}/30.${resolved.missing.length ? ` Paper 1B needs: ${resolved.missing.join(', ')}` : ''}`;
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
      if (this.active && next !== 'full' && !confirm('End the current Full Paper Mock? Unsaved answers will be lost.')) return;
      if (this.active && next !== 'full') this.stop();
      this.mode = next;
      this.sync();
    },

    syncPanel() {
      this.ui();
      const panel = document.getElementById('p1fm-panel');
      const a = document.getElementById('paper1a-panel');
      const b = document.getElementById('paper1b-panel');
      const bm = document.getElementById('paper1b-mock-panel');
      const achievements = document.getElementById('practice-achievements');

      if (panel) panel.style.display = this.active ? 'block' : 'none';
      if (this.active) {
        if (a) a.style.display = 'none';
        if (b) b.style.display = 'none';
        if (bm) bm.style.display = 'none';
        if (achievements) achievements.style.display = 'none';
      } else if (achievements) {
        achievements.style.display = '';
      }
    },

    micro(s) {
      const stoma = (x, y, r = 0, marker = '') => `
        <g transform="translate(${x} ${y}) rotate(${r})">
          <ellipse cx="-11" rx="9" ry="25" fill="#d8dde5" stroke="#475467" stroke-width="2"/>
          <ellipse cx="11" rx="9" ry="25" fill="#d8dde5" stroke="#475467" stroke-width="2"/>
          <ellipse rx="4" ry="17" fill="#fff" stroke="#667085"/>${marker}
        </g>`;
      const svg = `
        <div class="paper1-data-graph-wrap">
          <svg class="paper1-data-graph" viewBox="0 0 520 300">
            <rect x="8" y="8" width="504" height="270" rx="8" fill="#f6f7f9" stroke="#d0d5dd"/>
            ${stoma(105, 80, -18)}
            ${stoma(210, 145, 9, '<circle r="3.5" fill="#111827"/>')}
            ${stoma(315, 78, 22)}
            ${stoma(405, 150, -14)}
            ${stoma(300, 220, 18)}
            <line x1="310" y1="115" x2="225" y2="140" stroke="#111827" stroke-width="2"/>
            <text x="318" y="112" font-size="18" font-weight="800">X</text>
            <line x1="35" y1="255" x2="75" y2="255" stroke="#111827" stroke-width="5"/>
            <text x="55" y="274" text-anchor="middle">${this.e(s.scaleBarLabel || '24 µm')}</text>
            <text x="500" y="274" text-anchor="end">Field area = ${this.e(s.fieldAreaMm2 || 0.05)} mm²</text>
          </svg>
        </div>`;
      return `<section class="paper1-stimulus"><span class="paper1-stimulus-label">DATA-BASED QUESTION</span><h3>${this.e(s.title)}</h3><p>${this.e(s.description || '')}</p>${svg}${s.note ? `<p class="paper1-stimulus-note">${this.e(s.note)}</p>` : ''}</section>`;
    },

    stim(stimulus) {
      return stimulus?.template === 'leafEpidermisMock'
        ? this.micro(stimulus)
        : (Paper1.renderStimulus?.(stimulus) || '');
    },

    async start() {
      const pool = this.pool();
      const resolved = await this.resolveSet();
      if (!resolved.data) {
        alert('No Paper 1B Mock Set is available for the currently selected Learned Units.');
        return false;
      }

      if (pool.length < 30 || resolved.missing.length) {
        alert(`Paper 1A: ${pool.length}/30 eligible questions.${resolved.missing.length ? `\n\nPaper 1B Set ${resolved.set} also requires:\n${resolved.missing.join('\n')}` : ''}\n\nSelect more Learned Units before starting.`);
        return false;
      }

      BiologyPaper1BMock.stop?.();
      window.BiologyPaper2FullMock?.active && window.BiologyPaper2FullMock.stop?.();

      this.currentSet = resolved.set;
      this.b = resolved.data;
      this.qs = this.pick30(pool);
      this.ans = Array(30).fill(null);
      this.ba = this.b.questions.map(q => q.parts.map(() => ''));
      this.i = 0;
      this.bi = 0;
      this.phase = 'a';
      this.submitted = false;
      this.saved = false;
      this.sid = `BIO-P1-FULL-S${this.currentSet}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      this.elapsed = Math.floor(((this.endAt || Date.now()) - this.startAt) / 1000);
      const remaining = Math.max(0, 5400 - this.elapsed);
      const element = document.getElementById('p1fm-time');
      if (!element) return;
      element.textContent = remaining
        ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
        : `Time elapsed · +${Math.floor((this.elapsed - 5400) / 60)} min`;
      element.classList.toggle('elapsed', !remaining);
    },

    renderA() {
      if (!this.active || this.phase !== 'a' || this.submitted) return;
      const q = this.qs[this.i];
      const question = document.getElementById('p1fm-q');
      const choices = document.getElementById('p1fm-choices');
      const parts = document.getElementById('p1fm-parts');
      const actions = document.getElementById('p1fm-actions');
      const feedback = document.getElementById('p1fm-feedback');

      document.getElementById('p1fm-phase').textContent = `Paper 1A · Multiple Choice · Set ${this.currentSet}`;
      document.getElementById('p1fm-progress').textContent = `Question ${this.i + 1}/30 · ${this.ans.filter(Boolean).length} answered`;
      question.innerHTML = `${this.stim(q.stimulus)}<div class="paper1-question-text">${this.e(q.question)}</div>`;
      choices.innerHTML = q.options.map(o => `<button class="paper1-choice ${this.ans[this.i] === o.id ? 'selected' : ''}" onclick="BiologyPaper1FullMock.chooseA('${o.id}')">${this.e(o.text)}</button>`).join('');
      parts.innerHTML = '';
      feedback.innerHTML = '';
      actions.innerHTML = `<button ${this.i === 0 ? 'disabled' : ''} onclick="BiologyPaper1FullMock.moveA(-1)">← Previous</button>${this.i < 29 ? '<button onclick="BiologyPaper1FullMock.moveA(1)">Next →</button>' : '<button onclick="BiologyPaper1FullMock.toB()">Continue to Paper 1B →</button>'}`;
    },

    chooseA(value) {
      this.ans[this.i] = value;
      this.renderA();
    },

    moveA(delta) {
      this.i = Math.max(0, Math.min(29, this.i + delta));
      this.renderA();
    },

    toB() {
      const missing = this.ans.findIndex(value => !value);
      if (missing >= 0) {
        this.i = missing;
        this.renderA();
        alert(`Question ${missing + 1} is unanswered.`);
        return;
      }
      this.phase = 'b';
      this.renderB();
    },

    renderB() {
      if (!this.active || this.phase !== 'b' || this.submitted) return;
      const q = this.b.questions[this.bi];
      const question = document.getElementById('p1fm-q');
      const choices = document.getElementById('p1fm-choices');
      const parts = document.getElementById('p1fm-parts');
      const actions = document.getElementById('p1fm-actions');
      const feedback = document.getElementById('p1fm-feedback');

      document.getElementById('p1fm-phase').textContent = `Paper 1B · Data-based · Set ${this.currentSet}`;
      document.getElementById('p1fm-progress').textContent = `Question ${this.bi + 1}/4 · ${q.marks} marks`;
      question.innerHTML = this.stim(q.stimulus);
      choices.innerHTML = '';
      feedback.innerHTML = '';
      parts.innerHTML = q.parts.map((part, index) => `
        <section class="p1fm-part">
          <div class="p1fm-head"><strong>${this.e(part.label)} · ${this.e(part.commandTerm)}</strong><span>${part.marks} mark${part.marks === 1 ? '' : 's'}</span></div>
          <p>${this.e(part.question)}</p>
          <textarea oninput="BiologyPaper1FullMock.ba[${this.bi}][${index}]=this.value">${this.e(this.ba[this.bi][index])}</textarea>
        </section>`).join('');
      actions.innerHTML = `<button onclick="BiologyPaper1FullMock.backB()">← ${this.bi ? 'Previous' : 'Back to Paper 1A'}</button>${this.bi < 3 ? '<button onclick="BiologyPaper1FullMock.bi++;BiologyPaper1FullMock.renderB()">Next →</button>' : '<button onclick="BiologyPaper1FullMock.submit()">Submit Full Paper</button>'}`;
    },

    backB() {
      if (this.bi) {
        this.bi -= 1;
        this.renderB();
        return;
      }
      this.phase = 'a';
      this.i = 29;
      this.renderA();
    },

    submit() {
      for (let q = 0; q < 4; q += 1) {
        for (let p = 0; p < this.b.questions[q].parts.length; p += 1) {
          if (!this.ba[q][p].trim()) {
            this.bi = q;
            this.renderB();
            alert(`Paper 1B Question ${q + 1} is incomplete.`);
            return;
          }
        }
      }
      this.submitted = true;
      this.endAt = Date.now();
      this.stopTimer();
      this.tick();
      this.aScore = this.qs.reduce((sum, q, index) => sum + (this.ans[index] === q.correctAnswer ? 1 : 0), 0);
      this.review();
    },

    review() {
      const question = document.getElementById('p1fm-q');
      const choices = document.getElementById('p1fm-choices');
      const parts = document.getElementById('p1fm-parts');
      const actions = document.getElementById('p1fm-actions');
      const feedback = document.getElementById('p1fm-feedback');

      document.getElementById('p1fm-phase').textContent = `Full Paper submitted · Set ${this.currentSet} · Self-mark Paper 1B`;
      document.getElementById('p1fm-progress').textContent = `Elapsed ${Math.floor(this.elapsed / 60)}:${String(this.elapsed % 60).padStart(2, '0')}`;
      question.innerHTML = '<p><strong>Paper submitted.</strong> Paper 1A is marked automatically. Tick Paper 1B markscheme points that your answer clearly earns.</p>';
      choices.innerHTML = '';
      parts.innerHTML = '';
      actions.innerHTML = '';

      let k = 0;
      const bReview = this.b.questions.map((q, qi) => `
        <section class="p1fm-review">
          <h4>Paper 1B · Q${qi + 1} · ${q.marks} marks</h4>
          ${q.parts.map((part, pi) => `
            <div class="p1fm-item">
              <strong>${this.e(part.label)} · ${this.e(part.commandTerm)} [${part.marks}]</strong>
              <p>${this.e(part.question)}</p>
              <div class="p1fm-user"><strong>Your answer:</strong><br>${this.e(this.ba[qi][pi])}</div>
              ${part.markscheme.map((point, zi) => `<span class="p1fm-point"><label><input type="checkbox" data-p1fm-mark="${k++}" onchange="BiologyPaper1FullMock.score()"><span>${this.e(point)}${part.markschemeJa?.[zi] ? `<span class="p1fm-ja">日本語：${this.e(part.markschemeJa[zi])}</span>` : ''}</span></label></span>`).join('')}
              <div class="p1fm-model"><strong>Model Answer</strong><p>${this.e(part.modelAnswer || '')}</p><p class="p1fm-ja">日本語：${this.e(part.modelAnswerJa || '')}</p></div>
            </div>`).join('')}
        </section>`).join('');

      const aReview = this.qs.map((q, index) => {
        const selected = q.options.find(x => x.id === this.ans[index]);
        const correct = q.options.find(x => x.id === q.correctAnswer);
        return `<div class="p1fm-item"><strong>Q${index + 1} · ${this.ans[index] === q.correctAnswer ? 'Correct' : 'Incorrect'}</strong><p>${this.e(q.question)}</p><p>Your answer: ${this.e(this.ans[index])}${selected ? ` · ${this.e(selected.text)}` : ''}<br>Correct: ${this.e(q.correctAnswer)}${correct ? ` · ${this.e(correct.text)}` : ''}</p><p>${this.e(q.explanation || '')}</p>${q.explanationJa ? `<p class="p1fm-ja">日本語：${this.e(q.explanationJa)}</p>` : ''}</div>`;
      }).join('');

      feedback.innerHTML = `
        <div class="p1fm-summary">
          <div class="p1fm-stat">Paper 1A<br><strong>${this.aScore}/30</strong></div>
          <div class="p1fm-stat">Paper 1B<br><strong id="p1fm-bs">0/25</strong></div>
          <div class="p1fm-stat">Total<br><strong id="p1fm-ts">${this.aScore}/55</strong></div>
        </div>
        ${bReview}
        <section class="p1fm-review"><h4>Paper 1A answer review</h4>${aReview}</section>
        <div class="p1fm-actions"><button id="p1fm-save" onclick="BiologyPaper1FullMock.save()">Save Full Mock Score</button><span id="p1fm-status" class="muted">Not saved yet.</span></div>`;
      this.score();
    },

    score() {
      const bScore = document.querySelectorAll('input[data-p1fm-mark]:checked').length;
      const total = this.aScore + bScore;
      document.getElementById('p1fm-bs').textContent = `${bScore}/25`;
      document.getElementById('p1fm-ts').textContent = `${total}/55 (${Math.round(total / 55 * 100)}%)`;
      return bScore;
    },

    save() {
      if (this.saved || !this.submitted) return;
      const bScore = this.score();
      const total = this.aScore + bScore;
      const createdAt = new Date(this.endAt).toISOString();
      const base = {
        schemaVersion: Paper1Progress.schemaVersion,
        subject: 'Biology SL',
        sessionId: this.sid,
        fullMock: true,
        mockSet: this.currentSet,
        paper1aQuestionIds: this.qs.map(q => q.id),
        fullMockTotalScore: total,
        fullMockTotalMaxMarks: 55,
        elapsedSeconds: this.elapsed,
        createdAt
      };
      const a = {
        ...base,
        attemptId: `${this.sid}-paper1a`,
        questionId: `${this.sid}:paper1a`,
        section: 'paper1a',
        chapter: 'Paper 1 Full Mock',
        questionType: 'full-mock-paper1a',
        score: this.aScore,
        maxMarks: 30,
        percentage: Math.round(this.aScore / 30 * 100),
        evaluator: { type: 'automatic', version: 1 }
      };
      const b = {
        ...base,
        attemptId: `${this.sid}-paper1b`,
        questionId: this.b.id,
        section: 'paper1b',
        chapter: 'Paper 1 Full Mock',
        questionType: 'full-mock-paper1b',
        score: bScore,
        maxMarks: 25,
        percentage: Math.round(bScore / 25 * 100),
        evaluator: { type: 'self-checklist', version: 1 }
      };

      const data = Paper1Progress.load();
      if (data.attempts.some(x => x.sessionId === this.sid)) return;
      data.attempts.push(a, b);
      Storage.save(Paper1Progress.storageKey, data);
      this.saved = true;

      document.querySelectorAll('input[data-p1fm-mark]').forEach(input => { input.disabled = true; });
      document.getElementById('p1fm-save').disabled = true;
      document.getElementById('p1fm-status').textContent = `Set ${this.currentSet} · ${this.aScore}/30 + ${bScore}/25 = ${total}/55 saved.`;
    },

    install() {
      if (
        this.installed
        || typeof App === 'undefined'
        || typeof Pages === 'undefined'
        || typeof Paper1 === 'undefined'
        || typeof BiologyFinalTraining === 'undefined'
        || !BiologyFinalTraining.paper1Loaded
        || typeof BiologyPaper1BMock === 'undefined'
        || !BiologyPaper1BMock.installed
      ) return false;

      this.ui();
      const applyPracticeTypeUI = App.applyPracticeTypeUI;
      const startPractice = App.startPractice;
      const openPractice = App.openPractice;
      const updatePracticeHeader = App.updatePracticeHeader;
      const applySectionUI = Paper1.applySectionUI;

      App.applyPracticeTypeUI = function(...args) {
        const result = applyPracticeTypeUI.apply(this, args);
        F.sync();
        return result;
      };
      App.startPractice = async function(...args) {
        if (this.state.subject === 'Biology SL' && this.state.practiceType === 'paper1' && F.mode === 'full') return F.start();
        if (F.active) F.stop();
        return startPractice.apply(this, args);
      };
      App.openPractice = async function(...args) {
        if (this.state.subject === 'Biology SL' && this.state.practiceType === 'paper1' && F.mode === 'full') {
          if (F.active) {
            Pages.show('practice');
            this.updatePracticeHeader();
            F.syncPanel();
            if (!F.submitted) (F.phase === 'b' ? F.renderB() : F.renderA());
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
          if (element) element.textContent = `Biology SL · Paper 1 Full Mock · Set ${F.currentSet} · 55 marks / 90 min`;
          F.syncPanel();
        }
        return result;
      };
      Paper1.applySectionUI = function(...args) {
        const result = applySectionUI.apply(this, args);
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
          if (!this.installed) console.warn('Biology Paper 1 Full Mock could not initialize. Existing Paper 1 Practice remains available.');
        }
      }, 50);
    }
  };

  F.boot();
})();
