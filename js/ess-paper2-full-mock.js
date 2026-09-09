(() => {
  const F = window.EssPaper2FullMock = {
    mode: 'practice', active: false, installed: false, submitted: false, saved: false,
    phase: 'a', aq: [], aa: [], ai: 0, bq: [], selectedB: [], ba: {}, bi: 0,
    sid: '', startAt: 0, endAt: 0, elapsed: 0, timer: null, dataPromise: null,

    e(value) {
      return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    async fetchJson(path) {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return response.json();
    },

    selectedAIds() {
      return ['ESS-P2A-F2-1-1','ESS-P2A-F2-2-4','ESS-P2A-F2-3-1','ESS-P2A-F2-6-1','ESS-P2A-F2-6-4','ESS-P2A-F2-7-2','ESS-P2A-F2-8-1','ESS-P2A-B2-Q14','ESS-P2A-B3-Q21'];
    },

    validateA(questions) {
      const expected = this.selectedAIds();
      if (!Array.isArray(questions) || questions.length !== expected.length) return false;
      if (questions.reduce((sum, q) => sum + Number(q?.marks || 0), 0) !== 40) return false;
      if (new Set(questions.map(q => q.id)).size !== questions.length) return false;
      if (expected.some((id, index) => questions[index]?.id !== id)) return false;
      const topics = new Set(questions.flatMap(q => Array.isArray(q.chapters) ? q.chapters : [q.chapter]).filter(Boolean));
      if ([1,2,3,4,5,6,7,8].some(n => !topics.has(`Topic ${n}`))) return false;
      return questions.every(q => q?.subject === 'ESS HL' && q?.assessmentTarget === 'ess2a' && Number(q?.marks) > 0 && Array.isArray(q?.requiredUnits) && q.requiredUnits.length > 0 && Array.isArray(q?.markscheme) && q.markscheme.length === Number(q.marks) && Array.isArray(q?.markschemeJa) && q.markschemeJa.length === q.markscheme.length && typeof q?.modelAnswer === 'string' && typeof q?.modelAnswerJa === 'string');
    },

    validateB(questions) {
      if (!Array.isArray(questions) || questions.length !== 3) return false;
      if (questions.map(q => q?.option).sort().join('') !== 'ABC') return false;
      return questions.every(q => {
        const config = q?.structuredMarking || {};
        const parts = Array.isArray(q?.parts) ? q.parts : [];
        return q?.subject === 'ESS HL' && q?.assessmentTarget === 'ess2b' && Number(q?.mockSet) === 10 && Number(q?.marks) === 20 && Array.isArray(q?.requiredUnits) && q.requiredUnits.length > 0 && Array.isArray(q?.markscheme) && q.markscheme.length >= 11 && Array.isArray(q?.markschemeJa) && q.markschemeJa.length === q.markscheme.length && config.mode === 'analytic-plus-markband' && Number(config.analyticMarks) === 11 && Number(config.markbandMarks) === 9 && parts.length === 3 && parts.map(part => Number(part.marks)).join(',') === '4,7,9' && parts.every(part => typeof part.question === 'string' && typeof part.modelAnswer === 'string' && typeof part.modelAnswerJa === 'string');
      });
    },

    async loadData() {
      if (this.aq.length === 9 && this.bq.length === 3) return true;
      if (this.dataPromise) return this.dataPromise;
      this.dataPromise = (async () => {
        try {
          const [a1,a2,a3,baseA,bA,bB,bC] = await Promise.all([
            this.fetchJson('data/paper2/ess-section-a-final-extra-2-part1.json?v=1'),
            this.fetchJson('data/paper2/ess-section-a-final-extra-2-part2.json?v=1'),
            this.fetchJson('data/paper2/ess-section-a-final-extra-2-part3.json?v=1'),
            this.fetchJson('data/paper2/ess-section-a.json?v=1'),
            this.fetchJson('data/paper2/ess-section-b-set10-a.json?v=1'),
            this.fetchJson('data/paper2/ess-section-b-set10-b.json?v=1'),
            this.fetchJson('data/paper2/ess-section-b-set10-c.json?v=1')
          ]);
          const aPool = [...a1,...a2,...a3,...baseA].filter(q => q?.subject === 'ESS HL' && q?.assessmentTarget === 'ess2a');
          const byId = new Map(aPool.map(q => [q.id, q]));
          const aq = this.selectedAIds().map(id => byId.get(id)).filter(Boolean);
          const bq = [...bA,...bB,...bC].flat().sort((x,y) => String(x.option).localeCompare(String(y.option)));
          if (!this.validateA(aq)) throw new Error('ESS Paper 2 Section A Full Mock data failed validation.');
          if (!this.validateB(bq)) throw new Error('ESS Paper 2 Section B Full Mock data failed validation.');
          this.aq = aq; this.bq = bq; return true;
        } catch (error) {
          console.warn('ESS Paper 2 Full Mock data unavailable.', error); return false;
        } finally { this.dataPromise = null; }
      })();
      return this.dataPromise;
    },

    learned() { return App.getCourseCoverageItems?.('ESS HL') || []; },
    requiredUnits() {
      const units = new Set();
      [...this.aq,...this.bq].forEach(q => (q?.requiredUnits || []).forEach(unit => units.add(unit)));
      return [...units].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
    },
    missingUnits() { const learned = new Set(this.learned()); return this.requiredUnits().filter(unit => !learned.has(unit)); },

    ensureStyles() {
      if (document.getElementById('ess-p2fm-css')) return;
      const style = document.createElement('style'); style.id = 'ess-p2fm-css';
      style.textContent = `#ess-p2fm-control{margin-top:14px}.ess-p2fm-top,.ess-p2fm-head{display:flex;justify-content:space-between;gap:10px}.ess-p2fm-top,.ess-p2fm-question,.ess-p2fm-review,.ess-p2fm-option{padding:12px;border:1px solid #dfe5ee;border-radius:12px;background:#fbfcfe}.ess-p2fm-time{display:block;font-weight:900}.ess-p2fm-time.elapsed{color:#b42318}.ess-p2fm-question textarea,.ess-p2fm-part textarea{width:100%;min-height:150px;padding:10px;border:1px solid var(--border-strong);border-radius:10px;resize:vertical}.ess-p2fm-part textarea{min-height:190px}.ess-p2fm-parts{display:grid;gap:10px;margin-top:10px}.ess-p2fm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ess-p2fm-options{display:grid;gap:10px;margin-top:12px}.ess-p2fm-option.selected{border-color:#667085;box-shadow:0 0 0 1px #667085 inset}.ess-p2fm-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.ess-p2fm-stat{text-align:center;padding:9px;border:1px solid #dfe5ee;border-radius:10px}.ess-p2fm-ja{display:block;color:#667085;font-size:.86rem;margin-top:4px}.ess-p2fm-user{padding:8px;background:#f8fafc;white-space:pre-wrap}.ess-p2fm-point{display:block;margin:7px 0}.ess-p2fm-model{padding:8px;border-left:3px solid #98a2b3;background:#f9fafb}.ess-p2fm-band{padding:10px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;margin-top:10px}.ess-p2fm-band select{margin-top:7px;min-width:110px}@media(max-width:720px){.ess-p2fm-top,.ess-p2fm-head{flex-direction:column}.ess-p2fm-summary{grid-template-columns:1fr 1fr}}`;
      document.head.appendChild(style);
    },

    ui() {
      this.ensureStyles();
      const base = document.getElementById('paper2-section-control');
      if (base && !document.getElementById('ess-p2fm-control')) {
        const control = document.createElement('div'); control.id = 'ess-p2fm-control'; control.className = 'paper1-section-control'; control.style.display = 'none';
        control.innerHTML = `<h3>Paper 2 Exam Mode</h3><div class="paper1-section-grid"><button id="ess-p2fm-practice" class="paper1-section-card active" onclick="EssPaper2FullMock.setMode('practice')"><strong>Practice</strong><small>Section A / Section B practice</small></button><button id="ess-p2fm-full" class="paper1-section-card" onclick="EssPaper2FullMock.setMode('full')"><strong>Full Paper Mock</strong><small>Section A 40 + Section B 40 · 80 marks · 150 min</small></button></div><p id="ess-p2fm-note" class="muted">Full Mock uses only material selected in Course Coverage.</p>`;
        base.after(control);
      }
      const host = document.getElementById('paper2-practice-panel');
      if (host && !document.getElementById('ess-p2fm-panel')) {
        const panel = document.createElement('section'); panel.id = 'ess-p2fm-panel'; panel.style.display = 'none';
        panel.innerHTML = `<div class="ess-p2fm-top"><div><strong id="ess-p2fm-phase">ESS HL Paper 2 Full Mock</strong><div id="ess-p2fm-progress" class="muted"></div></div><div><span class="muted">150-minute paper</span><strong id="ess-p2fm-time" class="ess-p2fm-time">150:00</strong></div></div><section id="ess-p2fm-question" class="ess-p2fm-question"></section><div id="ess-p2fm-actions" class="ess-p2fm-actions"></div><section id="ess-p2fm-feedback"></section>`;
        host.appendChild(panel);
      }
    },

    normalPaper2Elements() {
      return [document.querySelector('#paper2-practice-panel > .paper2-header'),document.querySelector('#paper2-practice-panel > .paper2-meta'),document.getElementById('paper2-question'),document.querySelector('label[for="paper2-answer"]'),document.getElementById('paper2-answer'),document.querySelector('#paper2-practice-panel > .paper2-actions'),document.getElementById('paper2-feedback')].filter(Boolean);
    },
    syncPanel() {
      this.ui(); const panel = document.getElementById('ess-p2fm-panel'); if (panel) panel.style.display = this.active ? 'block' : 'none';
      this.normalPaper2Elements().forEach(element => { element.style.display = this.active ? 'none' : ''; });
      const achievements = document.getElementById('practice-achievements'); if (achievements) achievements.style.display = this.active ? 'none' : '';
    },

    async sync() {
      this.ui();
      const relevant = App.state.subject === 'ESS HL' && App.state.practiceType === 'paper2';
      const control = document.getElementById('ess-p2fm-control'), section = document.getElementById('paper2-section-control'), scope = document.querySelector('.scope-control'), chapters = document.getElementById('chapter-options'), startButton = document.querySelector('.selection-actions .primary-action');
      if (!relevant && this.active) this.stop(); if (control) control.style.display = relevant ? 'block' : 'none';
      document.getElementById('ess-p2fm-practice')?.classList.toggle('active', this.mode !== 'full'); document.getElementById('ess-p2fm-full')?.classList.toggle('active', this.mode === 'full');
      if (relevant && this.mode === 'full') {
        if (section) section.style.display = 'none'; if (scope) scope.style.display = 'none'; if (chapters) chapters.style.display = 'none'; if (startButton) startButton.textContent = 'Start Full Mock →';
        const note = document.getElementById('ess-p2fm-note'), loaded = await this.loadData();
        if (note) { if (!loaded) note.textContent = 'Full Mock data could not be loaded.'; else { const missing = this.missingUnits(); note.textContent = missing.length ? `Full Mock needs: ${missing.join(', ')}` : 'Ready: Section A 40 + Section B 40 · 80 marks · 150 min · Topics 1–8 covered in Section A.'; } }
      } else {
        if (relevant && section) section.style.display = 'block'; if (scope) scope.style.display = ''; App.applyPracticeScopeUI?.(); if (startButton) startButton.textContent = 'Start Practice →';
      }
    },

    setMode(value) { const next = value === 'full' ? 'full' : 'practice'; if (this.active && next !== 'full' && !confirm('End the current ESS Paper 2 Full Mock? Unsaved answers will be lost.')) return; if (this.active && next !== 'full') this.stop(); this.mode = next; this.sync(); },

    async start() {
      const loaded = await this.loadData(); if (!loaded) { alert('ESS Paper 2 Full Mock data could not be loaded.'); return false; }
      const missing = this.missingUnits(); if (missing.length) { alert(`This Full Mock includes material not selected in Course Coverage:\n\n${missing.join('\n')}\n\nSelect these units before starting.`); return false; }
      window.EssPaper1FullMock?.active && window.EssPaper1FullMock.stop?.(); window.BiologyPaper1FullMock?.active && window.BiologyPaper1FullMock.stop?.(); window.BiologyPaper2FullMock?.active && window.BiologyPaper2FullMock.stop?.();
      this.aa = Array(this.aq.length).fill(''); this.ai = 0; this.selectedB = []; this.ba = Object.fromEntries(this.bq.map(q => [q.id, ['', '', '']])); this.bi = 0; this.phase = 'a'; this.submitted = false; this.saved = false;
      this.sid = `ESS-P2-FULL-MS10-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; this.startAt = Date.now(); this.endAt = 0; this.elapsed = 0; this.active = true; this.startTimer(); Pages.show('practice'); App.updatePracticeHeader(); this.syncPanel(); this.renderA(); return true;
    },
    stop() { this.active = false; this.stopTimer(); this.syncPanel(); },
    startTimer() { this.stopTimer(); this.tick(); this.timer = setInterval(() => this.tick(), 1000); },
    stopTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; },
    tick() { if (!this.startAt) return; this.elapsed = Math.floor(((this.endAt || Date.now()) - this.startAt) / 1000); const remaining = Math.max(0, 9000 - this.elapsed), element = document.getElementById('ess-p2fm-time'); if (!element) return; element.textContent = remaining ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}` : `Time elapsed · +${Math.floor((this.elapsed - 9000) / 60)} min`; element.classList.toggle('elapsed', !remaining); },

    renderA() {
      if (!this.active || this.submitted) return; this.phase = 'a'; const q = this.aq[this.ai], phase = document.getElementById('ess-p2fm-phase'), progress = document.getElementById('ess-p2fm-progress'), question = document.getElementById('ess-p2fm-question'), actions = document.getElementById('ess-p2fm-actions'), feedback = document.getElementById('ess-p2fm-feedback');
      if (phase) phase.textContent = 'Paper 2 · Section A · 40 marks'; if (progress) progress.textContent = `Question ${this.ai + 1}/${this.aq.length} · ${q.marks} marks · ${this.aa.filter(answer => answer.trim()).length}/${this.aq.length} answered`; if (feedback) feedback.innerHTML = '';
      if (question) question.innerHTML = `${Paper2.renderStimulus?.(q.stimulus) || ''}<div class="ess-p2fm-head"><strong>${this.e(q.commandTerm || 'Response')}</strong><span>${q.marks} marks</span></div><p>${this.e(q.question)}</p><textarea aria-label="Section A answer ${this.ai + 1}" oninput="EssPaper2FullMock.aa[${this.ai}]=this.value">${this.e(this.aa[this.ai])}</textarea>`;
      if (actions) actions.innerHTML = `<button ${this.ai === 0 ? 'disabled' : ''} onclick="EssPaper2FullMock.moveA(-1)">← Previous</button>${this.ai < this.aq.length - 1 ? '<button onclick="EssPaper2FullMock.moveA(1)">Next →</button>' : '<button onclick="EssPaper2FullMock.toBSelect()">Continue to Section B →</button>'}`;
    },
    moveA(delta) { this.ai = Math.max(0, Math.min(this.aq.length - 1, this.ai + delta)); this.renderA(); },
    toBSelect() { const missing = this.aa.findIndex(answer => !answer.trim()); if (missing >= 0) { this.ai = missing; this.renderA(); alert(`Section A question ${missing + 1} is unanswered.`); return; } this.phase = 'bselect'; this.renderBSelect(); },
    optionParts(q) { return (q.parts || []).map(part => `<div class="ess-p2fm-part"><strong>(${this.e(part.label)}) ${part.marks} marks</strong><p>${this.e(part.question)}</p></div>`).join(''); },

    renderBSelect() {
      if (!this.active || this.submitted) return; const phase = document.getElementById('ess-p2fm-phase'), progress = document.getElementById('ess-p2fm-progress'), question = document.getElementById('ess-p2fm-question'), actions = document.getElementById('ess-p2fm-actions'), feedback = document.getElementById('ess-p2fm-feedback');
      if (phase) phase.textContent = 'Paper 2 · Section B · Choose TWO of THREE'; if (progress) progress.textContent = `${this.selectedB.length}/2 selected · 20 marks each`; if (feedback) feedback.innerHTML = '';
      if (question) question.innerHTML = `<p><strong>Choose TWO questions.</strong> Each question is 20 marks. Answer all three parts of each selected question.</p><div class="ess-p2fm-options">${this.bq.map(q => `<section class="ess-p2fm-option ${this.selectedB.includes(q.id) ? 'selected' : ''}"><div class="ess-p2fm-head"><strong>Option ${this.e(q.option)} · ${this.e(q.primaryUnit || q.unit || '')}</strong><span>20 marks</span></div>${this.optionParts(q)}<button type="button" onclick="EssPaper2FullMock.toggleB('${this.e(q.id)}')">${this.selectedB.includes(q.id) ? 'Selected ✓' : 'Select this question'}</button></section>`).join('')}</div>`;
      if (actions) actions.innerHTML = `<button onclick="EssPaper2FullMock.phase='a';EssPaper2FullMock.renderA()">← Back to Section A</button><button ${this.selectedB.length === 2 ? '' : 'disabled'} onclick="EssPaper2FullMock.beginB()">Answer selected questions →</button>`;
    },
    toggleB(id) { const index = this.selectedB.indexOf(id); if (index >= 0) this.selectedB.splice(index, 1); else if (this.selectedB.length < 2) this.selectedB.push(id); else alert('Choose exactly two Section B questions. Deselect one before choosing another.'); this.renderBSelect(); },
    beginB() { if (this.selectedB.length !== 2) return; this.phase = 'b'; this.bi = 0; this.renderB(); },
    currentB() { return this.bq.find(q => q.id === this.selectedB[this.bi]) || null; },

    renderB() {
      if (!this.active || this.submitted) return; const q = this.currentB(); if (!q) return this.renderBSelect(); const phase = document.getElementById('ess-p2fm-phase'), progress = document.getElementById('ess-p2fm-progress'), question = document.getElementById('ess-p2fm-question'), actions = document.getElementById('ess-p2fm-actions'), feedback = document.getElementById('ess-p2fm-feedback');
      if (phase) phase.textContent = `Paper 2 · Section B · Option ${this.e(q.option)}`; if (progress) progress.textContent = `Selected question ${this.bi + 1}/2 · 20 marks`; if (feedback) feedback.innerHTML = ''; const answers = this.ba[q.id];
      if (question) question.innerHTML = `<div class="ess-p2fm-head"><strong>${this.e(q.primaryUnit || q.unit || '')}</strong><span>20 marks</span></div><p>${this.e(q.question)}</p><div class="ess-p2fm-parts">${(q.parts || []).map((part,index) => `<section class="ess-p2fm-part"><div class="ess-p2fm-head"><strong>(${this.e(part.label)}) ${this.e(index === 2 ? 'Evaluation' : index === 1 ? 'Analysis' : 'Foundations')}</strong><span>${part.marks} marks</span></div><p>${this.e(part.question)}</p><textarea aria-label="Option ${this.e(q.option)} part ${this.e(part.label)}" oninput="EssPaper2FullMock.ba['${this.e(q.id)}'][${index}]=this.value">${this.e(answers[index])}</textarea></section>`).join('')}</div>`;
      if (actions) actions.innerHTML = `<button onclick="EssPaper2FullMock.phase='bselect';EssPaper2FullMock.renderBSelect()">← Change choices</button>${this.bi > 0 ? '<button onclick="EssPaper2FullMock.moveB(-1)">← Previous selected question</button>' : ''}${this.bi < 1 ? '<button onclick="EssPaper2FullMock.moveB(1)">Next selected question →</button>' : '<button onclick="EssPaper2FullMock.submit()">Submit Full Paper</button>'}`;
    },
    moveB(delta) { this.bi = Math.max(0, Math.min(1, this.bi + delta)); this.renderB(); },
    submit() {
      if (this.selectedB.length !== 2) { this.phase = 'bselect'; this.renderBSelect(); return; }
      for (let i = 0; i < this.selectedB.length; i += 1) { const answers = this.ba[this.selectedB[i]] || [], missing = answers.findIndex(answer => !String(answer || '').trim()); if (missing >= 0) { this.bi = i; this.renderB(); alert(`Complete all three parts of selected Section B question ${i + 1}.`); return; } }
      this.submitted = true; this.endAt = Date.now(); this.stopTimer(); this.tick(); this.review();
    },

    markbandDescriptors() { return Paper2.getEssHlMarkbandDescriptors(); },
    renderAReview() {
      let k = 0;
      return this.aq.map((q,qi) => `<section class="ess-p2fm-review"><div class="ess-p2fm-head"><h4>Section A · Question ${qi + 1}</h4><strong>${q.marks} marks</strong></div>${Paper2.renderStimulus?.(q.stimulus) || ''}<p><strong>${this.e(q.commandTerm || '')}</strong> · ${this.e(q.question)}</p><div class="ess-p2fm-user"><strong>Your answer:</strong><br>${this.e(this.aa[qi])}</div>${q.markscheme.map((point,mi) => `<span class="ess-p2fm-point"><label><input type="checkbox" data-ess-p2fm-a="${k++}" onchange="EssPaper2FullMock.score()"><span>${this.e(point)}${q.markschemeJa?.[mi] ? `<span class="ess-p2fm-ja">日本語：${this.e(q.markschemeJa[mi])}</span>` : ''}</span></label></span>`).join('')}<div class="ess-p2fm-model"><strong>Model Answer</strong><p>${this.e(q.modelAnswer || '')}</p><span class="ess-p2fm-ja">日本語：${this.e(q.modelAnswerJa || '')}</span></div></section>`).join('');
    },

    renderBReview(q,index) {
      const config = q.structuredMarking || {}, analyticMax = Number(config.analyticMarks) || 11, groups = Array.isArray(config.analyticGroups) && config.analyticGroups.length ? config.analyticGroups : [{label:'a',title:'Part (a) · Foundations',titleJa:'パート(a)・基礎理解',start:0,count:4},{label:'b',title:'Part (b) · Application and analysis',titleJa:'パート(b)・応用と分析',start:4,count:7}];
      const analytic = groups.map(group => { const start = Math.max(0, Number(group.start) || 0), end = Math.min(start + (Number(group.count) || 0), analyticMax, q.markscheme.length), points = []; for (let mi = start; mi < end; mi += 1) points.push(`<span class="ess-p2fm-point"><label><input type="checkbox" data-ess-p2fm-b="${index}" data-ess-p2fm-bi="${mi}" onchange="EssPaper2FullMock.score()"><span>${this.e(q.markscheme[mi])}${q.markschemeJa?.[mi] ? `<span class="ess-p2fm-ja">日本語：${this.e(q.markschemeJa[mi])}</span>` : ''}</span></label></span>`); return `<div class="ess-p2fm-band"><strong>${this.e(group.title || group.label || '')}</strong>${group.titleJa ? `<span class="ess-p2fm-ja">${this.e(group.titleJa)}</span>` : ''}${points.join('')}</div>`; }).join('');
      const descriptors = this.markbandDescriptors().map(item => `<li><strong>${this.e(item.range)}:</strong> ${this.e(item.text)}<span class="ess-p2fm-ja">${this.e(item.textJa || '')}</span></li>`).join('');
      const partAnswers = q.parts.map((part,pi) => `<div class="ess-p2fm-user"><strong>Your answer (${this.e(part.label)}):</strong><br>${this.e(this.ba[q.id]?.[pi] || '')}</div><div class="ess-p2fm-model"><strong>Model Answer (${this.e(part.label)})</strong><p>${this.e(part.modelAnswer || '')}</p><span class="ess-p2fm-ja">日本語：${this.e(part.modelAnswerJa || '')}</span></div>`).join('');
      return `<section class="ess-p2fm-review"><div class="ess-p2fm-head"><h4>Section B · Option ${this.e(q.option)}</h4><strong>20 marks</strong></div><p>${this.e(q.question)}</p>${partAnswers}${analytic}<div class="ess-p2fm-band"><strong>Part (c) · Markband / 9</strong><span class="ess-p2fm-ja">パート(c)は9点のmarkbandで評価します。</span><ul>${descriptors}</ul><label>Markband score: <select data-ess-p2fm-band="${index}" onchange="EssPaper2FullMock.score()">${Array.from({length:10},(_,n) => `<option value="${n}">${n}</option>`).join('')}</select> / 9</label></div></section>`;
    },

    review() {
      const phase = document.getElementById('ess-p2fm-phase'), progress = document.getElementById('ess-p2fm-progress'), question = document.getElementById('ess-p2fm-question'), actions = document.getElementById('ess-p2fm-actions'), feedback = document.getElementById('ess-p2fm-feedback');
      if (phase) phase.textContent = 'ESS HL Paper 2 Full Mock · Self-marking'; if (progress) progress.textContent = `Submitted · Elapsed ${Math.floor(this.elapsed / 60)}:${String(this.elapsed % 60).padStart(2, '0')}`; if (question) question.innerHTML = '<p><strong>Paper submitted.</strong> Mark Section A point-by-point. For each Section B response, mark (a)+(b) analytically and award part (c) using the 0–9 markband.</p>'; if (actions) actions.innerHTML = '';
      const selectedQuestions = this.selectedB.map(id => this.bq.find(q => q.id === id)).filter(Boolean);
      if (feedback) feedback.innerHTML = `<div class="ess-p2fm-summary"><div class="ess-p2fm-stat">Section A<br><strong id="ess-p2fm-as">0/40</strong></div><div class="ess-p2fm-stat">Section B<br><strong id="ess-p2fm-bs">0/40</strong></div><div class="ess-p2fm-stat">Total<br><strong id="ess-p2fm-ts">0/80</strong></div><div class="ess-p2fm-stat">Percentage<br><strong id="ess-p2fm-pc">0%</strong></div></div>${this.renderAReview()}${selectedQuestions.map((q,index) => this.renderBReview(q,index)).join('')}<div class="ess-p2fm-actions"><button id="ess-p2fm-save" onclick="EssPaper2FullMock.save()">Save Full Mock Score</button><span id="ess-p2fm-status" class="muted">Not saved yet.</span></div>`;
      this.score();
    },

    score() {
      const aScore = document.querySelectorAll('input[data-ess-p2fm-a]:checked').length; let bScore = 0;
      this.selectedB.forEach((_,index) => { const analytic = document.querySelectorAll(`input[data-ess-p2fm-b="${index}"]:checked`).length, band = Number(document.querySelector(`select[data-ess-p2fm-band="${index}"]`)?.value || 0); bScore += Math.min(20, analytic + Math.max(0, Math.min(9, band))); });
      const total = Math.min(80, aScore + bScore), percent = Math.round(total / 80 * 100); const aElement = document.getElementById('ess-p2fm-as'), bElement = document.getElementById('ess-p2fm-bs'), tElement = document.getElementById('ess-p2fm-ts'), pElement = document.getElementById('ess-p2fm-pc'); if (aElement) aElement.textContent = `${aScore}/40`; if (bElement) bElement.textContent = `${bScore}/40`; if (tElement) tElement.textContent = `${total}/80`; if (pElement) pElement.textContent = `${percent}%`; return { aScore,bScore,total,percent };
    },

    save() {
      if (this.saved || !this.submitted || typeof Paper2Progress === 'undefined') return; const result = this.score(), createdAt = new Date(this.endAt).toISOString();
      const attempt = { attemptId:`${this.sid}-paper2`, schemaVersion:Paper2Progress.schemaVersion, subject:'ESS HL', sessionId:this.sid, fullMock:true, mockSet:10, section:'esspaper2', assessmentTarget:'ess-paper2', chapter:'Paper 2 Full Mock', questionType:'full-mock-ess-paper2', score:result.total, maxMarks:80, percentage:result.percent, sectionAScore:result.aScore, sectionAMaxMarks:40, sectionBScore:result.bScore, sectionBMaxMarks:40, fullMockTotalScore:result.total, fullMockTotalMaxMarks:80, sectionAQuestionIds:this.aq.map(q => q.id), paper2bOptionIds:[...this.selectedB], selectedSectionBQuestionIds:[...this.selectedB], elapsedSeconds:this.elapsed, evaluator:{type:'self-checklist-plus-markband',version:1}, createdAt };
      const data = Paper2Progress.load(); if (data.attempts.some(item => item.sessionId === this.sid)) return; data.attempts.push(attempt); Storage.save(Paper2Progress.storageKey, data); this.saved = true; document.querySelectorAll('input[data-ess-p2fm-a],input[data-ess-p2fm-b]').forEach(input => { input.disabled = true; }); document.querySelectorAll('select[data-ess-p2fm-band]').forEach(select => { select.disabled = true; }); const button = document.getElementById('ess-p2fm-save'), status = document.getElementById('ess-p2fm-status'); if (button) button.disabled = true; if (status) status.textContent = `${result.total}/80 (${result.percent}%) saved.`;
    },

    install() {
      if (this.installed || typeof App === 'undefined' || typeof Pages === 'undefined' || typeof Paper2 === 'undefined' || typeof Paper2Progress === 'undefined' || typeof EssExam === 'undefined' || typeof Paper2.getEssHlMarkbandDescriptors !== 'function') return false;
      this.ui(); const applyPracticeTypeUI = App.applyPracticeTypeUI, startPractice = App.startPractice, openPractice = App.openPractice, updatePracticeHeader = App.updatePracticeHeader, setQuestions = Paper2.setQuestions;
      App.applyPracticeTypeUI = function(...args) { const result = applyPracticeTypeUI.apply(this,args); F.sync(); return result; };
      App.startPractice = async function(...args) { if (this.state.subject === 'ESS HL' && this.state.practiceType === 'paper2' && F.mode === 'full') return F.start(); if (F.active) F.stop(); return startPractice.apply(this,args); };
      App.openPractice = async function(...args) { if (this.state.subject === 'ESS HL' && this.state.practiceType === 'paper2' && F.mode === 'full') { if (F.active) { Pages.show('practice'); this.updatePracticeHeader(); F.syncPanel(); if (F.submitted) F.review(); else if (F.phase === 'a') F.renderA(); else if (F.phase === 'bselect') F.renderBSelect(); else F.renderB(); return true; } return F.start(); } if (F.active) F.stop(); return openPractice.apply(this,args); };
      App.updatePracticeHeader = function(...args) { const result = updatePracticeHeader.apply(this,args); if (F.active) { const element = document.getElementById('selection-subject-practice'); if (element) element.textContent = 'ESS HL · Paper 2 Full Mock · 80 marks / 150 min'; F.syncPanel(); } return result; };
      Paper2.setQuestions = function(...args) { const result = setQuestions.apply(this,args); F.sync(); F.syncPanel(); return result; };
      this.installed = true; this.sync(); return true;
    },

    boot() {
      let attempts = 0; const timer = setInterval(() => { attempts += 1; if (this.install() || attempts > 800) { clearInterval(timer); if (!this.installed) console.warn('ESS Paper 2 Full Mock could not initialize. Existing ESS Paper 2 Practice remains available.'); } }, 50);
    }
  };
  F.boot();
})();
