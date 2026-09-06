(() => {
  const MathAISLFullMock = window.MathAISLFullMock = {
    installed: false,
    mode: 'practice',
    active: false,
    paper: null,
    questions: [],
    index: 0,
    answers: {},
    startedAt: null,
    sessionId: null,
    timerId: null,
    durationSeconds: 90 * 60,
    originals: {},

    sets: {
      paper1: [
        'MATH-AI-SL-P1-1.4-001','MATH-AI-SL-P1-1.5-001','MATH-AI-SL-P1-1.3-003','MATH-AI-SL-P1-2.3-003',
        'MATH-AI-SL-P1-2.4-001','MATH-AI-SL-P1-2.5-001','MATH-AI-SL-P1-2.5-002','MATH-AI-SL-P1-3.2-003',
        'MATH-AI-SL-P1-3.3-002','MATH-AI-SL-P1-3.4-001','MATH-AI-SL-P1-4.3-004','MATH-AI-SL-P1-4.4-001',
        'MATH-AI-SL-P1-4.5-004','MATH-AI-SL-P1-4.6-004','MATH-AI-SL-P1-4.7-001','MATH-AI-SL-P1-5.1-003',
        'MATH-AI-SL-P1-5.2-002','MATH-AI-SL-P1-5.3-003'
      ],
      paper2: [
        'MATH-AI-SL-P2-1.4-001','MATH-AI-SL-P2-1.5-001','MATH-AI-SL-P2-2.3-002','MATH-AI-SL-P2-FINAL-FUNC-001',
        'MATH-AI-SL-P2-3.2-002','MATH-AI-SL-P2-3.3-002','MATH-AI-SL-P2-4.3-004','MATH-AI-SL-P2-4.4-001',
        'MATH-AI-SL-P2-4.7-003','MATH-AI-SL-P2-FINAL-CALC-001'
      ]
    },

    escapeHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    questionPool(paper) {
      return paper === 'paper2'
        ? (Array.isArray(Paper2.allQuestions) ? Paper2.allQuestions : [])
        : (Array.isArray(Paper1.paper1bQuestions) ? Paper1.paper1bQuestions : []);
    },

    getFixedSet(paper) {
      const byId = new Map(this.questionPool(paper).map(question => [question?.id, question]));
      return (this.sets[paper] || []).map(id => byId.get(id)).filter(Boolean);
    },

    expectedCount(paper) { return (this.sets[paper] || []).length; },
    totalMarks(questions = this.questions) { return questions.reduce((sum, question) => sum + Number(question?.marks || 0), 0); },

    requiredUnits(paper) {
      const units = new Set();
      this.getFixedSet(paper).forEach(question => (Array.isArray(question?.requiredUnits) ? question.requiredUnits : []).forEach(unit => {
        if (typeof unit === 'string' && unit.trim()) units.add(unit.trim());
      }));
      return [...units];
    },

    missingUnits(paper) {
      const selected = new Set(typeof CourseCoverage.getSelected === 'function' ? CourseCoverage.getSelected('Math AI SL') : []);
      return this.requiredUnits(paper).filter(unit => !selected.has(unit));
    },

    ensureStyles() {
      if (document.getElementById('math-ai-sl-full-mock-styles')) return;
      const style = document.createElement('style');
      style.id = 'math-ai-sl-full-mock-styles';
      style.textContent = `
        #math-fm-mode-control{margin:16px 0;padding:14px;border:1px solid #e4e7ec;border-radius:14px;background:#fbfcfe}
        #math-fm-mode-control h3{margin:0 0 10px}.math-fm-mode-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .math-fm-mode-grid button{padding:12px;border:1px solid #d0d5dd;border-radius:12px;background:#fff;text-align:left;cursor:pointer}
        .math-fm-mode-grid button.active{border-color:#7f56d9;box-shadow:0 0 0 2px rgba(127,86,217,.12)}
        .math-fm-mode-grid strong,.math-fm-mode-grid small{display:block}.math-fm-mode-grid small{margin-top:3px;color:#667085}
        #math-fm-readiness{margin:10px 0 0;color:#667085;font-size:.82rem;line-height:1.45}#math-fm-panel{display:none}.math-fm-shell{display:grid;gap:14px}
        .math-fm-topbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}
        .math-fm-topbar strong,.math-fm-topbar span{display:block}.math-fm-topbar span{color:#667085;font-size:.8rem}#math-fm-timer{font-variant-numeric:tabular-nums;font-weight:900}#math-fm-timer.elapsed{color:#b42318}
        .math-fm-card,.math-fm-review-card,.math-fm-summary{padding:16px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}.math-fm-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;color:#667085;font-size:.78rem}
        .math-fm-question{white-space:pre-wrap;line-height:1.55;font-weight:650}#math-fm-answer{width:100%;min-height:250px;margin-top:14px;padding:12px;border:1px solid #d0d5dd;border-radius:10px;resize:vertical}
        .math-fm-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;margin-top:12px}.math-fm-actions .group{display:flex;flex-wrap:wrap;gap:8px}.math-fm-actions button{padding:10px 14px;border:1px solid #d0d5dd;border-radius:10px;background:#fff;cursor:pointer}.math-fm-actions button.primary{background:#101828;color:#fff;border-color:#101828}
        .math-fm-progress{color:#667085;font-size:.82rem}.math-fm-review{display:grid;gap:14px}.math-fm-review-answer{padding:10px;border-radius:10px;background:#f8fafc;white-space:pre-wrap}.math-fm-ms{margin:10px 0 0;padding-left:22px}.math-fm-ms li{margin:8px 0}.math-fm-ms label{display:flex;gap:8px;align-items:flex-start}.math-fm-ja{display:block;margin-top:3px;color:#475467;font-size:.86rem}.math-fm-model{margin-top:12px;padding:11px;border-left:3px solid #7f56d9;background:#faf9ff}.math-fm-summary strong{font-size:1.2rem}
        @media(max-width:600px){.math-fm-mode-grid{grid-template-columns:1fr}.math-fm-topbar{align-items:flex-start;flex-direction:column}.math-fm-actions{flex-direction:column}.math-fm-actions .group{width:100%}.math-fm-actions button{flex:1}}
      `;
      document.head.appendChild(style);
    },

    ensureModeControl() {
      if (document.getElementById('math-fm-mode-control')) return;
      const scope = document.querySelector('#selection-page .scope-control');
      if (!scope) return;
      const control = document.createElement('div');
      control.id = 'math-fm-mode-control';
      control.style.display = 'none';
      control.innerHTML = `<h3>Exam Mode</h3><div class="math-fm-mode-grid"><button type="button" id="math-fm-practice-mode" onclick="MathAISLFullMock.setMode('practice')"><strong>Practice</strong><small>One question at a time</small></button><button type="button" id="math-fm-full-mode" onclick="MathAISLFullMock.setMode('full')"><strong>Full Paper Mock</strong><small>90 min · 80 marks</small></button></div><p id="math-fm-readiness"></p>`;
      scope.parentNode.insertBefore(control, scope);
    },

    ensurePracticePanel() {
      if (document.getElementById('math-fm-panel')) return;
      const achievements = document.getElementById('practice-achievements');
      if (!achievements) return;
      const panel = document.createElement('section');
      panel.id = 'math-fm-panel';
      achievements.parentNode.insertBefore(panel, achievements);
    },

    setMode(mode) { this.mode = mode === 'full' ? 'full' : 'practice'; this.updateSelectionUI(); },
    currentPaper() { return App.state.practiceType === 'paper2' ? 'paper2' : 'paper1'; },

    updateSelectionUI() {
      this.ensureModeControl();
      const control = document.getElementById('math-fm-mode-control');
      if (!control || typeof App === 'undefined') return;
      const visible = App.state.subject === 'Math AI SL' && ['paper1', 'paper2'].includes(App.state.practiceType);
      control.style.display = visible ? 'block' : 'none';
      if (!visible) return;
      document.getElementById('math-fm-practice-mode')?.classList.toggle('active', this.mode === 'practice');
      document.getElementById('math-fm-full-mode')?.classList.toggle('active', this.mode === 'full');
      const scope = document.querySelector('#selection-page .scope-control');
      const chapters = document.getElementById('chapter-options');
      if (scope) scope.style.display = this.mode === 'full' ? 'none' : '';
      if (chapters && this.mode === 'full') chapters.style.display = 'none';
      const start = document.querySelector('#selection-page .selection-actions .primary-action');
      if (start) start.textContent = this.mode === 'full' ? 'Start Full Mock →' : 'Start Practice →';
      const paper = this.currentPaper();
      const set = this.getFixedSet(paper);
      const missing = this.missingUnits(paper);
      const readiness = document.getElementById('math-fm-readiness');
      if (!readiness) return;
      if (set.length !== this.expectedCount(paper) || this.totalMarks(set) !== 80) readiness.textContent = 'Full Mock set is not fully loaded yet.';
      else if (missing.length) readiness.textContent = `Full Mock locked · ${missing.length} unlearned skill(s): ${missing.join(', ')}`;
      else readiness.textContent = `${paper === 'paper2' ? 'Paper 2' : 'Paper 1'} Full Mock ready · ${set.length} questions · 80 marks · 90 min`;
    },

    hideNormalPracticePanels() {
      ['vocabulary-practice-panel','paper1-practice-panel','paper2-practice-panel','practice-achievements'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      const panel = document.getElementById('math-fm-panel'); if (panel) panel.style.display = 'block';
    },

    restoreNormalPracticePanels() {
      const panel = document.getElementById('math-fm-panel'); if (panel) panel.style.display = 'none';
      const achievements = document.getElementById('practice-achievements'); if (achievements) achievements.style.display = '';
    },

    stopOtherMocks() {
      ['BiologyPaper1FullMock','BiologyPaper2FullMock','EssPaper1FullMock','EssPaper2FullMock'].forEach(name => {
        const module = window[name];
        if (module?.active && typeof module.stopTimer === 'function') module.stopTimer();
        if (module?.active) module.active = false;
      });
    },

    async startFullMock() {
      const paper = this.currentPaper();
      const questions = this.getFixedSet(paper);
      if (questions.length !== this.expectedCount(paper) || this.totalMarks(questions) !== 80) { alert('The Math Full Mock set is not fully loaded yet. Please reload the page and try again.'); return; }
      const missing = this.missingUnits(paper);
      if (missing.length) { alert(`Full Mock is locked until these skills are marked as learned:\n\n${missing.join('\n')}`); Pages.show('selection'); return; }
      this.stopOtherMocks(); this.stopTimer(); this.active = true; this.paper = paper; this.questions = questions; this.index = 0; this.answers = {}; this.startedAt = Date.now(); this.sessionId = `math-${paper}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      App.state.selectedChapters = []; App.state.paper1Section = 'paper1b'; App.state.paper2Section = 'math-paper2'; App.saveState(); App.updatePracticeHeader(); Pages.show('practice');
      this.hideNormalPracticePanels(); this.renderQuestion(); this.startTimer();
    },

    saveCurrentAnswer() {
      const answer = document.getElementById('math-fm-answer'); const question = this.questions[this.index];
      if (answer && question?.id) this.answers[question.id] = answer.value;
    },

    renderQuestion() {
      this.ensurePracticePanel();
      const panel = document.getElementById('math-fm-panel'); const question = this.questions[this.index]; if (!panel || !question) return;
      const answered = this.questions.filter(q => String(this.answers[q.id] || '').trim()).length;
      panel.innerHTML = `<div class="math-fm-shell"><div class="math-fm-topbar"><div><strong>Math AI SL · ${this.paper === 'paper2' ? 'Paper 2' : 'Paper 1'} Full Mock</strong><span>90 min · 80 marks · Technology required</span></div><div><span>Time</span><strong id="math-fm-timer">90:00</strong></div></div><div class="math-fm-card"><div class="math-fm-meta"><span>Question ${this.index + 1} / ${this.questions.length}</span><span>${this.escapeHtml(question.chapter || '')}</span><span>${this.escapeHtml(question.unit || '')}</span><span>${Number(question.marks || 0)} marks</span><span>${this.escapeHtml(question.commandTerm || '')}</span></div><div class="math-fm-question">${this.escapeHtml(question.question)}</div><textarea id="math-fm-answer" placeholder="Show your mathematical working and final answer...">${this.escapeHtml(this.answers[question.id] || '')}</textarea><div class="math-fm-actions"><div class="group"><button type="button" onclick="MathAISLFullMock.previous()" ${this.index === 0 ? 'disabled' : ''}>← Previous</button><button type="button" onclick="MathAISLFullMock.next()" ${this.index === this.questions.length - 1 ? 'disabled' : ''}>Next →</button></div><button type="button" class="primary" onclick="MathAISLFullMock.submitMock()">Submit Full Mock</button></div><p class="math-fm-progress">Answered ${answered} / ${this.questions.length}</p></div></div>`;
      this.updateTimerDisplay();
    },

    previous() { this.saveCurrentAnswer(); if (this.index > 0) this.index -= 1; this.renderQuestion(); },
    next() { this.saveCurrentAnswer(); if (this.index < this.questions.length - 1) this.index += 1; this.renderQuestion(); },

    submitMock() {
      this.saveCurrentAnswer();
      const missingIndex = this.questions.findIndex(question => !String(this.answers[question.id] || '').trim());
      if (missingIndex >= 0) { this.index = missingIndex; this.renderQuestion(); alert(`Question ${missingIndex + 1} is unanswered. Please answer every question before submitting.`); return; }
      this.stopTimer(); this.renderReview();
    },

    renderReview() {
      const panel = document.getElementById('math-fm-panel'); if (!panel) return;
      const cards = this.questions.map((question, qIndex) => {
        const markscheme = Array.isArray(question.markscheme) ? question.markscheme : [];
        const markschemeJa = Array.isArray(question.markschemeJa) ? question.markschemeJa : [];
        const checks = markscheme.slice(0, Number(question.marks || markscheme.length)).map((point, index) => `<li><label><input type="checkbox" data-math-fm-mark="${qIndex}-${index}" onchange="MathAISLFullMock.updateReviewScore()"><span>${this.escapeHtml(point)}${markschemeJa[index] ? `<span class="math-fm-ja" lang="ja">${this.escapeHtml(markschemeJa[index])}</span>` : ''}</span></label></li>`).join('');
        return `<section class="math-fm-review-card"><div class="math-fm-meta"><span>Question ${qIndex + 1}</span><span>${this.escapeHtml(question.unit || '')}</span><span>${Number(question.marks || 0)} marks</span></div><div class="math-fm-question">${this.escapeHtml(question.question)}</div><p><strong>Your Answer</strong></p><div class="math-fm-review-answer">${this.escapeHtml(this.answers[question.id] || '')}</div><p><strong>Markscheme self-check</strong></p><ol class="math-fm-ms">${checks}</ol><div class="math-fm-model"><strong>Model Answer</strong><div>${this.escapeHtml(question.modelAnswer || '')}</div>${question.modelAnswerJa ? `<span class="math-fm-ja" lang="ja">日本語：${this.escapeHtml(question.modelAnswerJa)}</span>` : ''}</div></section>`;
      }).join('');
      panel.innerHTML = `<div class="math-fm-shell"><div class="math-fm-topbar"><div><strong>Math AI SL · ${this.paper === 'paper2' ? 'Paper 2' : 'Paper 1'} Review</strong><span>Tick only marks your answer earned.</span></div><div><span>Elapsed</span><strong>${this.formatElapsed(this.elapsedSeconds())}</strong></div></div><div class="math-fm-summary"><span>Self-mark score</span> <strong id="math-fm-review-score">0 / 80</strong><p class="math-fm-progress">Review all questions, then save the result.</p></div><div class="math-fm-review">${cards}</div><div class="math-fm-actions"><div></div><button type="button" class="primary" onclick="MathAISLFullMock.saveResult()">Save Full Mock Result</button></div></div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateReviewScore() {
      const score = Math.min(document.querySelectorAll('#math-fm-panel input[data-math-fm-mark]:checked').length, 80);
      const label = document.getElementById('math-fm-review-score'); if (label) label.textContent = `${score} / 80`; return score;
    },

    elapsedSeconds() { return this.startedAt ? Math.max(0, Math.floor((Date.now() - this.startedAt) / 1000)) : 0; },
    formatElapsed(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; },
    startTimer() { this.stopTimer(); this.timerId = window.setInterval(() => this.updateTimerDisplay(), 1000); this.updateTimerDisplay(); },
    stopTimer() { if (this.timerId) window.clearInterval(this.timerId); this.timerId = null; },

    updateTimerDisplay() {
      const label = document.getElementById('math-fm-timer'); if (!label || !this.startedAt) return;
      const remaining = this.durationSeconds - this.elapsedSeconds();
      if (remaining >= 0) { label.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`; label.classList.remove('elapsed'); }
      else { label.textContent = `Time elapsed · +${Math.floor(Math.abs(remaining) / 60)} min`; label.classList.add('elapsed'); }
    },

    saveResult() {
      const score = this.updateReviewScore(); const maxMarks = 80; const percentage = Math.round(score / maxMarks * 100); const createdAt = new Date().toISOString();
      const store = this.paper === 'paper2' ? Paper2Progress : Paper1Progress;
      if (!store.load().attempts.some(attempt => attempt?.sessionId === this.sessionId)) {
        store.recordAttempt({ attemptId: `${this.sessionId}-${this.paper}`, schemaVersion: store.schemaVersion, subject: 'Math AI SL', sessionId: this.sessionId, fullMock: true, assessmentTarget: this.paper === 'paper2' ? 'math-paper2' : 'math-paper1', section: this.paper === 'paper2' ? 'math-paper2' : 'paper1b', chapter: `${this.paper === 'paper2' ? 'Paper 2' : 'Paper 1'} Full Mock`, questionType: `full-mock-math-${this.paper}`, questionIds: this.questions.map(question => question.id), score, maxMarks, percentage, fullMockTotalScore: score, fullMockTotalMaxMarks: maxMarks, elapsedSeconds: this.elapsedSeconds(), evaluator: { type: 'self-checklist', version: 1 }, createdAt });
      }
      const panel = document.getElementById('math-fm-panel'); if (panel) panel.insertAdjacentHTML('afterbegin', `<div class="math-fm-summary"><strong>Saved: ${score} / 80 (${percentage}%)</strong><p class="math-fm-progress">Result added to Final Exam Progress.</p></div>`); this.active = false;
    },

    patchApp() {
      if (App.__mathAISLFullMock) return;
      this.originals.applyPracticeTypeUI = App.applyPracticeTypeUI; this.originals.startPractice = App.startPractice; this.originals.openPractice = App.openPractice; this.originals.backToSelection = App.backToSelection;
      App.applyPracticeTypeUI = function(...args) { const result = MathAISLFullMock.originals.applyPracticeTypeUI.apply(this, args); MathAISLFullMock.updateSelectionUI(); return result; };
      App.startPractice = async function(...args) { if (this.state.subject === 'Math AI SL' && MathAISLFullMock.mode === 'full') return MathAISLFullMock.startFullMock(); return MathAISLFullMock.originals.startPractice.apply(this, args); };
      App.openPractice = async function(...args) { if (this.state.subject === 'Math AI SL' && MathAISLFullMock.mode === 'full') return MathAISLFullMock.startFullMock(); return MathAISLFullMock.originals.openPractice.apply(this, args); };
      App.backToSelection = function(...args) { if (MathAISLFullMock.active) { MathAISLFullMock.saveCurrentAnswer(); MathAISLFullMock.stopTimer(); MathAISLFullMock.active = false; } MathAISLFullMock.restoreNormalPracticePanels(); const result = MathAISLFullMock.originals.backToSelection.apply(this, args); MathAISLFullMock.updateSelectionUI(); return result; };
      App.__mathAISLFullMock = true;
    },

    install() { if (this.installed) return; this.installed = true; this.ensureStyles(); this.ensureModeControl(); this.ensurePracticePanel(); this.patchApp(); this.updateSelectionUI(); },

    boot(attempt = 0) {
      const ready = typeof App !== 'undefined' && typeof MathAISL !== 'undefined' && MathAISL.installed && typeof MathAISLFinalAudit !== 'undefined' && MathAISLFinalAudit.loaded && typeof CourseCoverage !== 'undefined' && typeof Paper1 !== 'undefined' && typeof Paper1Progress !== 'undefined' && typeof Paper2 !== 'undefined' && typeof Paper2Progress !== 'undefined';
      if (ready) { this.install(); return; }
      if (attempt < 500) window.setTimeout(() => this.boot(attempt + 1), 50);
      else console.warn('Math AI SL Full Mock could not initialize. Existing Math practice remains available.');
    }
  };
  MathAISLFullMock.boot();
})();
