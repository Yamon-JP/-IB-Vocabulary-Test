const Paper2Progress = {
  storageKey: 'ib_paper2_progress',
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

const Paper2 = {
  allQuestions: [],
  questions: [],
  current: null,
  attemptSaved: false,

  async init() {
    const sources = [
      'data/paper2.json',
      'data/paper2/biology-theme-a.json',
      'data/paper2/biology-theme-b.json',
      'data/paper2/biology-theme-c.json',
      'data/paper2/biology-theme-d.json',
      'data/paper2/biology-data-analysis.json'
    ];

    const datasets = await Promise.all(sources.map(async source => {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Paper 2 data not found: ${source}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn(`Paper 2 data is not available: ${source}`, error);
        return [];
      }
    }));

    this.allQuestions = datasets.flat();
    this.renderEmptyState();
  },

  pickQuestion(excludeId = null) {
    if (!this.questions.length) return null;
    const candidates = excludeId && this.questions.length > 1
      ? this.questions.filter(question => question.id !== excludeId)
      : this.questions;
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  },

  loadForSelection(subject, chapters = []) {
    this.questions = this.allQuestions.filter(question => {
      if (question.subject !== subject) return false;
      if (!chapters.length) return true;
      const chapter = question.chapter || question.topic;
      return chapters.includes(chapter);
    });
    this.current = this.pickQuestion();
    this.render();
  },

  setQuestions(questions = []) {
    this.questions = Array.isArray(questions) ? questions : [];
    this.current = this.pickQuestion();
    this.render();
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
      <div class="paper2-data-table-wrap">
        <table class="paper2-data-table">
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
        <line class="paper2-data-grid" x1="${toX(value).toFixed(1)}" y1="${top}" x2="${toX(value).toFixed(1)}" y2="${top + plotHeight}"></line>
        <text class="paper2-data-tick" x="${toX(value).toFixed(1)}" y="${height - 30}" text-anchor="middle">${this.escapeHtml(value)}</text>
      </g>`).join('');
    const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (yRange * index / 4)).map(value => `
      <g>
        <line class="paper2-data-grid" x1="${left}" y1="${toY(value).toFixed(1)}" x2="${left + plotWidth}" y2="${toY(value).toFixed(1)}"></line>
        <text class="paper2-data-tick" x="${left - 10}" y="${(toY(value) + 4).toFixed(1)}" text-anchor="end">${this.escapeHtml(Number(value.toFixed(2)))}</text>
      </g>`).join('');

    return `
      <div class="paper2-data-graph-wrap">
        <svg class="paper2-data-graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.escapeHtml(stimulus.title || 'Data graph')}">
          ${xTicks}
          ${yTicks}
          <line class="paper2-data-axis" x1="${left}" y1="${top + plotHeight}" x2="${left + plotWidth}" y2="${top + plotHeight}"></line>
          <line class="paper2-data-axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}"></line>
          <polyline class="paper2-data-line" points="${pathPoints}"></polyline>
          <g class="paper2-data-points">${pointDots}</g>
          <text class="paper2-data-axis-label" x="${left + plotWidth / 2}" y="${height - 7}" text-anchor="middle">${this.escapeHtml(stimulus.xLabel || '')}</text>
          <text class="paper2-data-axis-label" x="16" y="${top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 16 ${top + plotHeight / 2})">${this.escapeHtml(stimulus.yLabel || '')}</text>
        </svg>
      </div>`;
  },

  renderStimulus(stimulus) {
    if (!stimulus || typeof stimulus !== 'object') return '';

    let content = '';
    if (stimulus.type === 'table') content = this.renderTableStimulus(stimulus);
    if (stimulus.type === 'lineGraph') content = this.renderLineGraphStimulus(stimulus);
    if (!content) return '';

    const description = stimulus.description
      ? `<p class="paper2-stimulus-description">${this.escapeHtml(stimulus.description)}</p>`
      : '';
    const note = stimulus.note
      ? `<p class="paper2-stimulus-note">${this.escapeHtml(stimulus.note)}</p>`
      : '';

    return `
      <section class="paper2-stimulus">
        <span class="paper2-stimulus-label">DATA-BASED QUESTION</span>
        <h3>${this.escapeHtml(stimulus.title || 'Data')}</h3>
        ${description}
        ${content}
        ${note}
      </section>`;
  },

  renderEmptyState() {
    const question = document.getElementById('paper2-question');
    if (!question) return;
    question.innerHTML = '<p class="muted">No Paper 2 questions are available for this selection yet.</p>';
  },

  render() {
    const question = document.getElementById('paper2-question');
    const marks = document.getElementById('paper2-marks');
    const command = document.getElementById('paper2-command');
    const answer = document.getElementById('paper2-answer');
    const feedback = document.getElementById('paper2-feedback');
    if (!question) return;

    this.attemptSaved = false;

    if (!this.current) {
      this.renderEmptyState();
      if (marks) marks.textContent = '—';
      if (command) command.textContent = '—';
      if (answer) answer.value = '';
      if (feedback) feedback.innerHTML = '';
      return;
    }

    const stimulus = this.renderStimulus(this.current.stimulus);
    question.innerHTML = `${stimulus}<div class="paper2-question-text">${this.escapeHtml(this.current.question || '')}</div>`;
    if (marks) marks.textContent = this.current.marks ?? '—';
    if (command) command.textContent = this.current.commandTerm || '—';
    if (answer) answer.value = '';
    if (feedback) feedback.innerHTML = '';
  },

  renderMarkscheme(markscheme, markschemeJa) {
    if (!markscheme.length) {
      return '<p class="muted">No markscheme is available for this question.</p>';
    }

    return `<ol class="paper2-markscheme-list paper2-self-mark-list">${markscheme.map((point, index) => {
      const japanese = markschemeJa[index]
        ? `<span class="paper2-markscheme-ja" lang="ja">日本語：${this.escapeHtml(markschemeJa[index])}</span>`
        : '';
      return `
        <li class="paper2-self-mark-point">
          <label>
            <input type="checkbox" data-paper2-mark-point="${index}" onchange="Paper2.updateSelfMarkScore()">
            <span class="paper2-self-mark-copy">
              <span>${this.escapeHtml(point)}</span>
              ${japanese}
            </span>
          </label>
        </li>`;
    }).join('')}</ol>`;
  },

  renderSelfMarkPanel(maxMarks) {
    return `
      <div class="paper2-self-mark-panel">
        <div class="paper2-self-mark-heading">
          <div>
            <strong>Markscheme checklist</strong>
            <small>Tick a point only if your answer clearly communicates that idea.</small>
            <small lang="ja">答案にその内容が明確に含まれている場合だけチェックしてください。</small>
          </div>
          <span id="paper2-self-score">0 / ${this.escapeHtml(maxMarks)}</span>
        </div>
        <div class="paper2-self-mark-save">
          <button type="button" id="paper2-save-score" onclick="Paper2.saveSelfMarkAttempt()">Save Score</button>
          <small id="paper2-save-status">Not saved yet.</small>
        </div>
      </div>`;
  },

  updateSelfMarkScore() {
    const maxMarks = Number(this.current?.marks) || 0;
    const selected = document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]:checked').length;
    const score = Math.min(selected, maxMarks || selected);
    const scoreElement = document.getElementById('paper2-self-score');
    if (scoreElement) scoreElement.textContent = `${score} / ${maxMarks}`;
  },

  saveSelfMarkAttempt() {
    if (!this.current || this.attemptSaved) return;

    const maxMarks = Number(this.current.marks) || 0;
    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const checkedIndexes = new Set(
      [...document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]:checked')]
        .map(input => Number(input.dataset.paper2MarkPoint))
        .filter(Number.isInteger)
    );
    const criteria = markscheme.map((_, index) => ({
      criterionId: `${this.current.id || 'paper2'}:criterion:${index + 1}`,
      index: index + 1,
      markValue: 1,
      awarded: checkedIndexes.has(index)
    }));
    const rawScore = criteria.reduce((sum, criterion) => sum + (criterion.awarded ? criterion.markValue : 0), 0);
    const score = Math.min(rawScore, maxMarks || rawScore);

    const attempt = {
      attemptId: `${this.current.id || 'paper2'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: Paper2Progress.schemaVersion,
      questionId: this.current.id || null,
      subject: this.current.subject || null,
      chapter: this.current.chapter || this.current.topic || null,
      unit: this.current.unit || null,
      commandTerm: this.current.commandTerm || null,
      difficulty: this.current.difficulty || null,
      questionType: this.current.stimulus ? 'data-based' : 'written',
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

    const saved = Paper2Progress.recordAttempt(attempt);
    if (!saved) return;

    this.attemptSaved = true;
    document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]').forEach(input => {
      input.disabled = true;
    });
    const saveButton = document.getElementById('paper2-save-score');
    const status = document.getElementById('paper2-save-status');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Score Saved';
    }
    if (status) status.textContent = `${score} / ${maxMarks} saved for this attempt.`;
  },

  submit() {
    if (!this.current || this.attemptSaved) return;
    const feedback = document.getElementById('paper2-feedback');
    const answer = document.getElementById('paper2-answer');
    if (!feedback || !answer) return;

    if (!answer.value.trim()) {
      feedback.innerHTML = '<div class="paper2-feedback-card"><strong>Write an answer first.</strong><p>Attempt the question before revealing the markscheme.</p></div>';
      return;
    }

    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const markschemeJa = Array.isArray(this.current.markschemeJa) ? this.current.markschemeJa : [];
    const maxMarks = Number(this.current.marks) || markscheme.length;
    const markschemeHtml = this.renderMarkscheme(markscheme, markschemeJa);
    const selfMarkPanel = this.renderSelfMarkPanel(maxMarks);
    const modelAnswer = this.current.modelAnswer
      ? `<div class="paper2-model-answer"><h4>Model Answer</h4><p>${this.escapeHtml(this.current.modelAnswer)}</p></div>`
      : '';
    const modelAnswerJa = this.current.modelAnswerJa
      ? `<div class="paper2-model-answer paper2-model-answer-ja" lang="ja"><h4>日本語訳</h4><p>${this.escapeHtml(this.current.modelAnswerJa)}</p></div>`
      : '';

    this.attemptSaved = false;
    feedback.innerHTML = `
      <div class="paper2-feedback-card">
        <div class="paper2-feedback-heading">
          <strong>Self-mark your answer</strong>
          <span>${this.escapeHtml(this.current.marks ?? '—')} marks</span>
        </div>
        <p>Compare your response with each marking point. Tick only the points that are clearly present in your answer.</p>
        <h4>Markscheme</h4>
        ${markschemeHtml}
        ${selfMarkPanel}
        ${modelAnswer}
        ${modelAnswerJa}
      </div>`;
  },

  next() {
    if (!this.questions.length) return;
    const previousId = this.current && this.current.id;
    this.current = this.pickQuestion(previousId);
    this.render();
  }
};
