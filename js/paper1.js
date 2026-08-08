const Paper1Progress = {
  storageKey: 'ib_paper1_progress',
  schemaVersion: 1,

  load() {
    const saved = typeof Storage !== 'undefined' ? Storage.load(this.storageKey) : null;
    return {
      schemaVersion: this.schemaVersion,
      attempts: Array.isArray(saved?.attempts) ? saved.attempts : []
    };
  },

  recordAttempt(attempt) {
    if (!attempt || typeof Storage === 'undefined') return null;
    const data = this.load();
    data.attempts.push(attempt);
    Storage.save(this.storageKey, data);
    return attempt;
  }
};

const Paper1 = {
  paper1aQuestions: [],
  paper1bQuestions: [],
  questions: [],
  current: null,
  section: 'paper1a',
  selectedChoice: null,
  answerLocked: false,
  attemptSaved: false,
  initialized: false,

  async init() {
    this.ensureStyles();
    this.installUI();
    if (this.initialized) {
      this.applySectionUI();
      return;
    }

    const sources = [
      'data/paper1/biology-paper1a.json',
      'data/paper2/biology-data-analysis.json'
    ];

    const datasets = await Promise.all(sources.map(async source => {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Paper 1 data not found: ${source}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn(`Paper 1 data is not available: ${source}`, error);
        return [];
      }
    }));

    this.paper1aQuestions = datasets[0].filter(question => question.assessmentTarget === 'paper1a');
    this.paper1bQuestions = datasets[1].filter(question => question.assessmentTarget === 'paper1b');
    this.initialized = true;
    this.renderEmptyState();
    this.applySectionUI();
  },

  ensureStyles() {
    if (document.getElementById('paper1-stylesheet')) return;
    const link = document.createElement('link');
    link.id = 'paper1-stylesheet';
    link.rel = 'stylesheet';
    link.href = 'css/paper1.css';
    document.head.appendChild(link);
  },

  installUI() {
    const typeGrid = document.querySelector('.practice-type-grid');
    const paper2Button = document.getElementById('type-paper2');
    if (typeGrid && paper2Button && !document.getElementById('type-paper1')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'type-paper1';
      button.className = 'practice-type-card';
      button.setAttribute('onclick', "App.setPracticeType('paper1')");
      button.innerHTML = `
        <span class="practice-type-icon" aria-hidden="true">P1</span>
        <span>
          <strong>Paper 1 Practice</strong>
          <small>Biology multiple-choice and data-based analysis</small>
        </span>`;
      typeGrid.insertBefore(button, paper2Button);
    }

    const scopeControl = document.querySelector('.scope-control');
    if (scopeControl && !document.getElementById('paper1-section-control')) {
      const control = document.createElement('div');
      control.id = 'paper1-section-control';
      control.className = 'paper1-section-control';
      control.style.display = 'none';
      control.innerHTML = `
        <h3>Paper 1 Section</h3>
        <div class="paper1-section-grid">
          <button type="button" id="section-paper1a" class="paper1-section-card active" onclick="App.setPaper1Section('paper1a')">
            <strong>Paper 1A</strong>
            <small>Final Exam-style multiple-choice · 1 mark each</small>
          </button>
          <button type="button" id="section-paper1b" class="paper1-section-card" onclick="App.setPaper1Section('paper1b')">
            <strong>Paper 1B</strong>
            <small>Data-based questions with markscheme self-check</small>
          </button>
        </div>`;
      scopeControl.parentNode.insertBefore(control, scopeControl);
    }

    const achievements = document.getElementById('practice-achievements');
    if (achievements && !document.getElementById('paper1-practice-panel')) {
      const panel = document.createElement('section');
      panel.id = 'paper1-practice-panel';
      panel.style.display = 'none';
      panel.innerHTML = `
        <div class="paper1-header">
          <span id="paper1-section-title">Paper 1A · Multiple Choice</span>
          <span id="paper1-header-score">1 mark</span>
        </div>
        <div class="paper1-meta">
          <span id="paper1-question-type">Final Exam practice</span>
          <span id="paper1-chapter">—</span>
        </div>

        <section id="paper1a-panel">
          <section id="paper1a-question" class="paper1-question-card"></section>
          <div id="paper1a-choices" class="paper1-choice-list"></div>
          <div class="paper1-actions">
            <button type="button" onclick="Paper1.submitPaper1A()">Check Answer</button>
            <button type="button" onclick="Paper1.next()">Next Question →</button>
          </div>
          <section id="paper1a-feedback"></section>
        </section>

        <section id="paper1b-panel" style="display:none">
          <div class="paper1-meta">
            <span>Command term: <strong id="paper1b-command">—</strong></span>
            <span>Marks: <strong id="paper1b-marks">—</strong></span>
          </div>
          <section id="paper1b-question" class="paper1-question-card"></section>
          <label class="paper1-answer-label" for="paper1b-answer">Your Answer</label>
          <textarea id="paper1b-answer" rows="10" placeholder="Write your answer here..."></textarea>
          <div class="paper1-actions">
            <button type="button" onclick="Paper1.submitPaper1B()">Check Answer</button>
            <button type="button" onclick="Paper1.next()">Next Question →</button>
          </div>
          <section id="paper1b-feedback"></section>
        </section>`;
      achievements.parentNode.insertBefore(panel, achievements);
    }

    if (typeof App !== 'undefined') {
      App.applyPracticeTypeUI();
      App.updatePracticeHeader();
    }
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  normalizeSection(section) {
    return section === 'paper1b' ? 'paper1b' : 'paper1a';
  },

  applySectionUI() {
    const section = this.normalizeSection(typeof App !== 'undefined' ? App.state.paper1Section : this.section);
    this.section = section;

    const sectionAButton = document.getElementById('section-paper1a');
    const sectionBButton = document.getElementById('section-paper1b');
    if (sectionAButton) sectionAButton.classList.toggle('active', section === 'paper1a');
    if (sectionBButton) sectionBButton.classList.toggle('active', section === 'paper1b');

    const panelA = document.getElementById('paper1a-panel');
    const panelB = document.getElementById('paper1b-panel');
    if (panelA) panelA.style.display = section === 'paper1a' ? 'block' : 'none';
    if (panelB) panelB.style.display = section === 'paper1b' ? 'block' : 'none';

    const title = document.getElementById('paper1-section-title');
    const score = document.getElementById('paper1-header-score');
    const type = document.getElementById('paper1-question-type');
    if (title) title.textContent = section === 'paper1a' ? 'Paper 1A · Multiple Choice' : 'Paper 1B · Data-based';
    if (score) score.textContent = section === 'paper1a' ? '1 mark each' : 'Structured data analysis';
    if (type) type.textContent = section === 'paper1a' ? 'Choose one best answer.' : 'Use the stimulus and biological knowledge.';
  },

  loadForSelection(subject, chapters = [], section = 'paper1a') {
    this.section = this.normalizeSection(section);
    const source = this.section === 'paper1b' ? this.paper1bQuestions : this.paper1aQuestions;
    this.questions = source.filter(question => {
      if (question.subject !== subject) return false;
      if (!chapters.length) return true;
      const chapter = question.chapter || question.topic;
      return chapters.includes(chapter);
    });
    this.current = this.pickQuestion();
    this.render();
    return this.questions.length;
  },

  pickQuestion(excludeId = null) {
    if (!this.questions.length) return null;
    const candidates = excludeId && this.questions.length > 1
      ? this.questions.filter(question => question.id !== excludeId)
      : this.questions;
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  },

  renderEmptyState() {
    const questionA = document.getElementById('paper1a-question');
    const choices = document.getElementById('paper1a-choices');
    const questionB = document.getElementById('paper1b-question');
    if (questionA) questionA.innerHTML = '<p class="muted">No Paper 1A questions are available for this selection yet.</p>';
    if (choices) choices.innerHTML = '';
    if (questionB) questionB.innerHTML = '<p class="muted">No Paper 1B questions are available for this selection yet.</p>';
  },

  render() {
    this.selectedChoice = null;
    this.answerLocked = false;
    this.attemptSaved = false;
    this.applySectionUI();

    if (!this.current) {
      this.renderEmptyState();
      const chapter = document.getElementById('paper1-chapter');
      if (chapter) chapter.textContent = '—';
      return;
    }

    const chapter = document.getElementById('paper1-chapter');
    if (chapter) chapter.textContent = this.current.chapter || this.current.topic || '—';

    if (this.section === 'paper1b') this.renderPaper1B();
    else this.renderPaper1A();
  },

  renderPaper1A() {
    const question = document.getElementById('paper1a-question');
    const choices = document.getElementById('paper1a-choices');
    const feedback = document.getElementById('paper1a-feedback');
    if (!question || !choices) return;

    question.innerHTML = `<div class="paper1-question-text">${this.escapeHtml(this.current.question || '')}</div>`;
    const options = Array.isArray(this.current.options) ? this.current.options : [];
    choices.innerHTML = options.map(option => `
      <button type="button" class="paper1-choice" data-choice-id="${this.escapeHtml(option.id)}" onclick="Paper1.selectChoice('${this.escapeHtml(option.id)}')">
        ${this.escapeHtml(option.text)}
      </button>`).join('');
    if (feedback) feedback.innerHTML = '';
  },

  selectChoice(choiceId) {
    if (this.answerLocked || !this.current) return;
    this.selectedChoice = choiceId;
    document.querySelectorAll('#paper1a-choices .paper1-choice').forEach(button => {
      button.classList.toggle('selected', button.dataset.choiceId === choiceId);
    });
  },

  submitPaper1A() {
    if (!this.current || this.section !== 'paper1a' || this.answerLocked) return;
    const feedback = document.getElementById('paper1a-feedback');
    if (!feedback) return;

    if (!this.selectedChoice) {
      feedback.innerHTML = '<div class="paper1-feedback-card"><strong>Select an answer first.</strong><p>Choose A, B, C or D before checking your answer.</p></div>';
      return;
    }

    const correctAnswer = this.current.correctAnswer;
    const isCorrect = this.selectedChoice === correctAnswer;
    const options = Array.isArray(this.current.options) ? this.current.options : [];
    const correctOption = options.find(option => option.id === correctAnswer);
    this.answerLocked = true;

    document.querySelectorAll('#paper1a-choices .paper1-choice').forEach(button => {
      button.disabled = true;
      const id = button.dataset.choiceId;
      button.classList.remove('selected');
      if (id === correctAnswer) button.classList.add('correct');
      if (id === this.selectedChoice && !isCorrect) button.classList.add('incorrect');
    });

    feedback.innerHTML = `
      <div class="paper1-feedback-card ${isCorrect ? 'correct' : 'incorrect'}">
        <strong>${isCorrect ? 'Correct.' : 'Incorrect.'}</strong>
        <p>Correct answer: <strong>${this.escapeHtml(correctAnswer)}</strong>${correctOption ? ` · ${this.escapeHtml(correctOption.text)}` : ''}</p>
        <p>${this.escapeHtml(this.current.explanation || '')}</p>
        ${this.current.explanationJa ? `<p class="paper1-feedback-ja" lang="ja">日本語：${this.escapeHtml(this.current.explanationJa)}</p>` : ''}
      </div>`;

    this.savePaper1AAttempt(isCorrect);
  },

  savePaper1AAttempt(isCorrect) {
    if (!this.current || this.attemptSaved) return;
    const score = isCorrect ? 1 : 0;
    const attempt = {
      attemptId: `${this.current.id || 'paper1a'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: Paper1Progress.schemaVersion,
      questionId: this.current.id || null,
      subject: this.current.subject || null,
      section: 'paper1a',
      chapter: this.current.chapter || this.current.topic || null,
      unit: this.current.unit || null,
      commandTerm: null,
      difficulty: this.current.difficulty || null,
      questionType: 'multiple-choice',
      score,
      maxMarks: 1,
      percentage: score * 100,
      evaluator: {
        type: 'automatic',
        version: 1
      },
      selectedAnswer: this.selectedChoice,
      correctAnswer: this.current.correctAnswer || null,
      createdAt: new Date().toISOString()
    };

    if (Paper1Progress.recordAttempt(attempt)) this.attemptSaved = true;
  },

  renderTableStimulus(stimulus) {
    const columns = Array.isArray(stimulus.columns) ? stimulus.columns : [];
    const rows = Array.isArray(stimulus.rows) ? stimulus.rows : [];
    if (!columns.length || !rows.length) return '';

    const header = columns.map(column => `<th scope="col">${this.escapeHtml(column)}</th>`).join('');
    const body = rows.map(row => {
      const cells = Array.isArray(row) ? row : [];
      return `<tr>${columns.map((_, index) => `<td>${this.escapeHtml(cells[index] ?? '')}</td>`).join('')}</tr>`;
    }).join('');

    return `
      <div class="paper1-data-table-wrap">
        <table class="paper1-data-table">
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  },

  renderLineGraphStimulus(stimulus) {
    const points = (Array.isArray(stimulus.points) ? stimulus.points : [])
      .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
      .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (points.length < 2) return '';

    const width = 520;
    const height = 300;
    const left = 62;
    const right = 22;
    const top = 24;
    const bottom = 54;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const xValues = points.map(point => point.x);
    const yValues = points.map(point => point.y);
    const xMin = Number.isFinite(Number(stimulus.xMin)) ? Number(stimulus.xMin) : Math.min(...xValues);
    const xMax = Number.isFinite(Number(stimulus.xMax)) ? Number(stimulus.xMax) : Math.max(...xValues);
    const yMin = Number.isFinite(Number(stimulus.yMin)) ? Number(stimulus.yMin) : Math.min(0, ...yValues);
    const yMax = Number.isFinite(Number(stimulus.yMax)) ? Number(stimulus.yMax) : Math.max(...yValues);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const toX = value => left + ((value - xMin) / xRange) * plotWidth;
    const toY = value => top + plotHeight - ((value - yMin) / yRange) * plotHeight;
    const pathPoints = points.map(point => `${toX(point.x).toFixed(1)},${toY(point.y).toFixed(1)}`).join(' ');
    const pointDots = points.map(point => `<circle cx="${toX(point.x).toFixed(1)}" cy="${toY(point.y).toFixed(1)}" r="4"></circle>`).join('');
    const xTicks = [...new Set(xValues)].map(value => `
      <g>
        <line class="paper1-data-grid" x1="${toX(value).toFixed(1)}" y1="${top}" x2="${toX(value).toFixed(1)}" y2="${top + plotHeight}"></line>
        <text class="paper1-data-tick" x="${toX(value).toFixed(1)}" y="${height - 30}" text-anchor="middle">${this.escapeHtml(value)}</text>
      </g>`).join('');
    const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (yRange * index / 4)).map(value => `
      <g>
        <line class="paper1-data-grid" x1="${left}" y1="${toY(value).toFixed(1)}" x2="${left + plotWidth}" y2="${toY(value).toFixed(1)}"></line>
        <text class="paper1-data-tick" x="${left - 10}" y="${(toY(value) + 4).toFixed(1)}" text-anchor="end">${this.escapeHtml(Number(value.toFixed(2)))}</text>
      </g>`).join('');

    return `
      <div class="paper1-data-graph-wrap">
        <svg class="paper1-data-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.escapeHtml(stimulus.title || 'Data graph')}">
          ${xTicks}
          ${yTicks}
          <line class="paper1-data-axis" x1="${left}" y1="${top + plotHeight}" x2="${left + plotWidth}" y2="${top + plotHeight}"></line>
          <line class="paper1-data-axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}"></line>
          <polyline class="paper1-data-line" points="${pathPoints}"></polyline>
          <g class="paper1-data-points">${pointDots}</g>
          <text class="paper1-data-axis-label" x="${left + plotWidth / 2}" y="${height - 7}" text-anchor="middle">${this.escapeHtml(stimulus.xLabel || '')}</text>
          <text class="paper1-data-axis-label" x="16" y="${top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 16 ${top + plotHeight / 2})">${this.escapeHtml(stimulus.yLabel || '')}</text>
        </svg>
      </div>`;
  },

  renderStimulus(stimulus) {
    if (!stimulus || typeof stimulus !== 'object') return '';
    let content = '';
    if (stimulus.type === 'table') content = this.renderTableStimulus(stimulus);
    if (stimulus.type === 'lineGraph') content = this.renderLineGraphStimulus(stimulus);
    if (!content) return '';

    return `
      <section class="paper1-stimulus">
        <span class="paper1-stimulus-label">DATA-BASED QUESTION</span>
        <h3>${this.escapeHtml(stimulus.title || 'Data')}</h3>
        ${stimulus.description ? `<p class="paper1-stimulus-description">${this.escapeHtml(stimulus.description)}</p>` : ''}
        ${content}
        ${stimulus.note ? `<p class="paper1-stimulus-note">${this.escapeHtml(stimulus.note)}</p>` : ''}
      </section>`;
  },

  renderPaper1B() {
    const question = document.getElementById('paper1b-question');
    const marks = document.getElementById('paper1b-marks');
    const command = document.getElementById('paper1b-command');
    const answer = document.getElementById('paper1b-answer');
    const feedback = document.getElementById('paper1b-feedback');
    if (!question) return;

    question.innerHTML = `${this.renderStimulus(this.current.stimulus)}<div class="paper1-question-text">${this.escapeHtml(this.current.question || '')}</div>`;
    if (marks) marks.textContent = this.current.marks ?? '—';
    if (command) command.textContent = this.current.commandTerm || '—';
    if (answer) answer.value = '';
    if (feedback) feedback.innerHTML = '';
  },

  renderMarkscheme(markscheme, markschemeJa) {
    if (!markscheme.length) return '<p class="muted">No markscheme is available for this question.</p>';
    return `<ol class="paper1-markscheme-list">${markscheme.map((point, index) => {
      const japanese = markschemeJa[index]
        ? `<span class="paper1-markscheme-ja" lang="ja">日本語：${this.escapeHtml(markschemeJa[index])}</span>`
        : '';
      return `
        <li class="paper1-self-mark-point">
          <label>
            <input type="checkbox" data-paper1b-mark-point="${index}" onchange="Paper1.updateSelfMarkScore()">
            <span class="paper1-self-mark-copy">
              <span>${this.escapeHtml(point)}</span>
              ${japanese}
            </span>
          </label>
        </li>`;
    }).join('')}</ol>`;
  },

  renderSelfMarkPanel(maxMarks) {
    return `
      <div class="paper1-self-mark-panel">
        <div class="paper1-self-mark-heading">
          <div>
            <strong>Markscheme checklist</strong>
            <small>Tick a point only if your answer clearly communicates that idea.</small>
            <small lang="ja">答案にその内容が明確に含まれている場合だけチェックしてください。</small>
          </div>
          <span id="paper1b-self-score">0 / ${this.escapeHtml(maxMarks)}</span>
        </div>
        <div class="paper1-self-mark-save">
          <button type="button" id="paper1b-save-score" onclick="Paper1.savePaper1BAttempt()">Save Score</button>
          <small id="paper1b-save-status">Not saved yet.</small>
        </div>
      </div>`;
  },

  updateSelfMarkScore() {
    const maxMarks = Number(this.current?.marks) || 0;
    const selected = document.querySelectorAll('#paper1b-feedback input[data-paper1b-mark-point]:checked').length;
    const score = Math.min(selected, maxMarks || selected);
    const scoreElement = document.getElementById('paper1b-self-score');
    if (scoreElement) scoreElement.textContent = `${score} / ${maxMarks}`;
  },

  submitPaper1B() {
    if (!this.current || this.section !== 'paper1b' || this.attemptSaved) return;
    const feedback = document.getElementById('paper1b-feedback');
    const answer = document.getElementById('paper1b-answer');
    if (!feedback || !answer) return;

    if (!answer.value.trim()) {
      feedback.innerHTML = '<div class="paper1-feedback-card"><strong>Write an answer first.</strong><p>Attempt the question before revealing the markscheme.</p></div>';
      return;
    }

    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const markschemeJa = Array.isArray(this.current.markschemeJa) ? this.current.markschemeJa : [];
    const maxMarks = Number(this.current.marks) || markscheme.length;
    feedback.innerHTML = `
      <div class="paper1-feedback-card">
        <strong>Markscheme</strong>
        <p>Compare your answer carefully with each marking point.</p>
        ${this.renderMarkscheme(markscheme, markschemeJa)}
        ${this.renderSelfMarkPanel(maxMarks)}
      </div>`;
    this.updateSelfMarkScore();
  },

  savePaper1BAttempt() {
    if (!this.current || this.section !== 'paper1b' || this.attemptSaved) return;

    const maxMarks = Number(this.current.marks) || 0;
    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const checkedIndexes = new Set(
      [...document.querySelectorAll('#paper1b-feedback input[data-paper1b-mark-point]:checked')]
        .map(input => Number(input.dataset.paper1bMarkPoint))
        .filter(Number.isInteger)
    );
    const criteria = markscheme.map((_, index) => ({
      criterionId: `${this.current.id || 'paper1b'}:criterion:${index + 1}`,
      index: index + 1,
      markValue: 1,
      awarded: checkedIndexes.has(index)
    }));
    const rawScore = criteria.reduce((sum, criterion) => sum + (criterion.awarded ? criterion.markValue : 0), 0);
    const score = Math.min(rawScore, maxMarks || rawScore);

    const attempt = {
      attemptId: `${this.current.id || 'paper1b'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: Paper1Progress.schemaVersion,
      questionId: this.current.id || null,
      subject: this.current.subject || null,
      section: 'paper1b',
      chapter: this.current.chapter || this.current.topic || null,
      unit: this.current.unit || null,
      commandTerm: this.current.commandTerm || null,
      difficulty: this.current.difficulty || null,
      questionType: 'data-based',
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
    this.attemptSaved = true;
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

  next() {
    if (!this.questions.length) return;
    const previousId = this.current?.id || null;
    this.current = this.pickQuestion(previousId);
    this.render();
  }
};
