const Paper2ProgressView = {
  styleHref: 'css/paper2-progress.css',
  activeAssessment: 'paper1a',
  paper1RecorderPatched: false,
  paper2RecorderPatched: false,

  ensureStylesheet() {
    if (document.querySelector(`link[href="${this.styleHref}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = this.styleHref;
    document.head.appendChild(link);
  },

  ensurePanel() {
    let panel = document.getElementById('paper2-progress-panel');
    if (panel) return panel;

    const statisticsPage = document.getElementById('statistics-page');
    if (!statisticsPage) return null;

    panel = document.createElement('section');
    panel.id = 'paper2-progress-panel';
    panel.className = 'progress-panel paper2-progress-panel';
    panel.innerHTML = `
      <div class="paper2-progress-heading">
        <div>
          <p class="eyebrow">FINAL EXAM READINESS</p>
          <h3>Biology Final Exam Progress</h3>
          <p class="muted">Track score and coverage separately across Paper 1A, Paper 1B, Paper 2 · Section A and Paper 2 · Section B.</p>
        </div>
        <span id="paper2-progress-attempt-badge">0 attempts</span>
      </div>

      <div id="final-exam-progress-tabs" class="final-exam-progress-tabs" role="tablist" aria-label="Biology final exam sections">
        ${['paper1a', 'paper1b', 'paper2a', 'paper2b'].map(section => `
          <button type="button"
            id="final-exam-tab-${section}"
            class="final-exam-progress-tab"
            role="tab"
            aria-selected="false"
            onclick="Paper2ProgressView.setAssessment('${section}')">
            ${this.assessmentLabel(section)}
          </button>`).join('')}
      </div>

      <div class="paper2-progress-summary" aria-label="Final exam section summary">
        <div class="paper2-progress-stat">
          <span>Attempts</span>
          <strong id="paper2-progress-attempts">0</strong>
        </div>
        <div class="paper2-progress-stat">
          <span>Marks</span>
          <strong id="paper2-progress-marks">0 / 0</strong>
        </div>
        <div class="paper2-progress-stat">
          <span>Score</span>
          <strong id="paper2-progress-percent">—</strong>
        </div>
        <div class="paper2-progress-stat">
          <span>Coverage</span>
          <strong id="paper2-progress-coverage">0 / 0</strong>
        </div>
      </div>

      <div class="paper2-progress-section">
        <div class="paper2-progress-section-heading">
          <h4>Theme & Unit Performance</h4>
          <span class="muted">Score is weighted by available marks · Coverage counts unique questions tried</span>
        </div>
        <div id="paper2-progress-themes"></div>
      </div>

      <div class="paper2-progress-section">
        <div class="paper2-progress-section-heading">
          <h4>Recent Attempts</h4>
          <span class="muted">Latest 5 in this section</span>
        </div>
        <div id="paper2-progress-recent"></div>
      </div>`;

    const chapterPanel = document.getElementById('chapter-progress-panel');
    if (chapterPanel) chapterPanel.insertAdjacentElement('afterend', panel);
    else statisticsPage.appendChild(panel);
    return panel;
  },

  assessmentLabel(section) {
    const labels = {
      paper1a: 'Paper 1A',
      paper1b: 'Paper 1B',
      paper2a: 'Paper 2 · Section A',
      paper2b: 'Paper 2 · Section B'
    };
    return labels[section] || 'Paper';
  },

  setAssessment(section) {
    if (!['paper1a', 'paper1b', 'paper2a', 'paper2b'].includes(section)) return;
    this.activeAssessment = section;
    this.render();
  },

  loadPaper1Attempts() {
    try {
      if (typeof Paper1Progress !== 'undefined' && typeof Paper1Progress.load === 'function') {
        const data = Paper1Progress.load();
        return Array.isArray(data?.attempts) ? data.attempts : [];
      }
      if (typeof Storage !== 'undefined') {
        const data = Storage.load('ib_paper1_progress');
        return Array.isArray(data?.attempts) ? data.attempts : [];
      }
    } catch (error) {
      console.warn('Paper 1 progress could not be loaded.', error);
    }
    return [];
  },

  loadPaper2Attempts() {
    try {
      if (typeof Paper2Progress !== 'undefined' && typeof Paper2Progress.load === 'function') {
        const data = Paper2Progress.load();
        return Array.isArray(data?.attempts) ? data.attempts : [];
      }
      if (typeof Storage !== 'undefined') {
        const data = Storage.load('ib_paper2_progress');
        return Array.isArray(data?.attempts) ? data.attempts : [];
      }
    } catch (error) {
      console.warn('Paper 2 progress could not be loaded.', error);
    }
    return [];
  },

  getQuestionCatalog() {
    const catalog = [];

    if (typeof Paper1 !== 'undefined') {
      if (Array.isArray(Paper1.paper1aQuestions)) catalog.push(...Paper1.paper1aQuestions);
      if (Array.isArray(Paper1.paper1bQuestions)) catalog.push(...Paper1.paper1bQuestions);
    }

    if (typeof Paper2 !== 'undefined' && Array.isArray(Paper2.allQuestions)) {
      catalog.push(...Paper2.allQuestions);
    }

    const seen = new Set();
    return catalog.filter(question => {
      if (!question || question.subject !== 'Biology SL') return false;
      if (!['paper1a', 'paper1b', 'paper2a', 'paper2b'].includes(question.assessmentTarget)) return false;
      if (!question.id || seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    });
  },

  questionIndex(catalog) {
    return new Map(catalog.map(question => [question.id, question]));
  },

  resolveAssessment(attempt, question) {
    if (['paper1a', 'paper1b'].includes(attempt?.section)) return attempt.section;
    if (['paper2a', 'paper2b'].includes(attempt?.assessmentTarget)) return attempt.assessmentTarget;
    if (['paper1a', 'paper1b', 'paper2a', 'paper2b'].includes(question?.assessmentTarget)) {
      return question.assessmentTarget;
    }
    return null;
  },

  getPrimaryUnit(item) {
    const candidates = [
      item?.primaryUnit,
      item?.unit,
      Array.isArray(item?.requiredUnits) ? item.requiredUnits[0] : null
    ];
    return candidates.find(value => typeof value === 'string' && value.trim())?.trim() || 'Unspecified unit';
  },

  getPrimaryChapter(item) {
    const candidates = [item?.primaryChapter, item?.chapter, item?.topic];
    return candidates.find(value => typeof value === 'string' && value.trim())?.trim() || 'Unspecified chapter';
  },

  getTheme(item) {
    const values = [this.getPrimaryUnit(item), this.getPrimaryChapter(item)];
    for (const value of values) {
      const match = String(value || '').trim().match(/^([A-D])/i);
      if (match) return match[1].toUpperCase();
    }
    return 'Other';
  },

  normalizeAttempt(attempt, question) {
    if (!attempt || typeof attempt !== 'object') return null;
    const maxMarks = Number(attempt.maxMarks);
    const rawScore = Number(attempt.score);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || !Number.isFinite(rawScore)) return null;

    const assessment = this.resolveAssessment(attempt, question);
    if (!assessment) return null;

    const reference = question || attempt;
    return {
      ...attempt,
      assessment,
      score: Math.max(0, Math.min(rawScore, maxMarks)),
      maxMarks,
      chapter: this.getPrimaryChapter(reference),
      unit: this.getPrimaryUnit(reference),
      theme: this.getTheme(reference),
      evaluatorType: attempt.evaluator?.type || 'unknown'
    };
  },

  getNormalizedAttempts(catalog) {
    const index = this.questionIndex(catalog);
    const raw = [...this.loadPaper1Attempts(), ...this.loadPaper2Attempts()];
    return raw
      .map(attempt => this.normalizeAttempt(attempt, index.get(attempt?.questionId)))
      .filter(Boolean);
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  evaluatorLabel(type) {
    const labels = {
      automatic: 'Automatic',
      'self-checklist': 'Self-checklist',
      ai: 'AI',
      'ai-marking': 'AI',
      hybrid: 'AI + review'
    };
    return labels[type] || 'Recorded';
  },

  formatDate(value) {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },

  summarizeAttempts(attempts) {
    const score = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const maxMarks = attempts.reduce((sum, attempt) => sum + attempt.maxMarks, 0);
    return {
      attempts: attempts.length,
      score,
      maxMarks,
      percentage: maxMarks ? Math.round((score / maxMarks) * 100) : null
    };
  },

  coverageStats(questions, attempts) {
    const attemptedIds = new Set(
      attempts
        .map(attempt => attempt.questionId)
        .filter(Boolean)
    );
    const questionIds = new Set(questions.map(question => question.id).filter(Boolean));
    const tried = [...attemptedIds].filter(id => questionIds.has(id)).length;
    return { tried, total: questionIds.size };
  },

  groupQuestionsByThemeAndUnit(questions) {
    const themes = {};
    questions.forEach(question => {
      const theme = this.getTheme(question);
      const unit = this.getPrimaryUnit(question);
      if (!themes[theme]) themes[theme] = {};
      if (!themes[theme][unit]) themes[theme][unit] = [];
      themes[theme][unit].push(question);
    });
    return themes;
  },

  renderThemes(questions, attempts) {
    const container = document.getElementById('paper2-progress-themes');
    if (!container) return;

    const grouped = this.groupQuestionsByThemeAndUnit(questions);
    const themeOrder = ['A', 'B', 'C', 'D', 'Other'];
    const themeNames = {
      A: 'Unity and diversity',
      B: 'Form and function',
      C: 'Interaction and interdependence',
      D: 'Continuity and change',
      Other: 'Other'
    };

    const rendered = themeOrder.map(theme => {
      const units = grouped[theme];
      if (!units) return '';

      const themeQuestions = Object.values(units).flat();
      const themeIds = new Set(themeQuestions.map(question => question.id));
      const themeAttempts = attempts.filter(attempt => themeIds.has(attempt.questionId));
      const themeSummary = this.summarizeAttempts(themeAttempts);
      const themeCoverage = this.coverageStats(themeQuestions, themeAttempts);
      const themeScore = themeSummary.percentage === null ? 'Not attempted' : `${themeSummary.percentage}%`;

      const unitRows = Object.entries(units)
        .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
        .map(([unit, unitQuestions]) => {
          const unitIds = new Set(unitQuestions.map(question => question.id));
          const unitAttempts = themeAttempts.filter(attempt => unitIds.has(attempt.questionId));
          const unitSummary = this.summarizeAttempts(unitAttempts);
          const unitCoverage = this.coverageStats(unitQuestions, unitAttempts);
          const scoreLabel = unitSummary.percentage === null ? 'Not attempted' : `${unitSummary.percentage}%`;
          const marksLabel = unitSummary.maxMarks
            ? `${unitSummary.score} / ${unitSummary.maxMarks} marks`
            : 'No saved score';

          return `
            <div class="final-exam-unit-row">
              <div class="final-exam-unit-copy">
                <strong>${this.escapeHtml(unit)}</strong>
                <small>${marksLabel} · ${unitCoverage.tried} / ${unitCoverage.total} questions tried</small>
              </div>
              <div class="final-exam-unit-metrics">
                <span class="final-exam-score-pill ${unitSummary.percentage === null ? 'empty' : ''}">${scoreLabel}</span>
                <span class="final-exam-coverage-pill">${unitCoverage.tried}/${unitCoverage.total}</span>
              </div>
            </div>`;
        }).join('');

      return `
        <details class="final-exam-theme-card" open>
          <summary>
            <div>
              <strong>Theme ${this.escapeHtml(theme)}: ${this.escapeHtml(themeNames[theme] || '')}</strong>
              <small>${themeSummary.score} / ${themeSummary.maxMarks} marks · ${themeCoverage.tried} / ${themeCoverage.total} questions tried</small>
            </div>
            <span class="final-exam-theme-score ${themeSummary.percentage === null ? 'empty' : ''}">${themeScore}</span>
          </summary>
          <div class="final-exam-unit-list">${unitRows}</div>
        </details>`;
    }).join('');

    container.innerHTML = rendered || '<p class="muted paper2-progress-empty">No active questions are available for this section.</p>';
  },

  renderRecent(attempts) {
    const recentContainer = document.getElementById('paper2-progress-recent');
    if (!recentContainer) return;

    const recent = [...attempts]
      .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
      .slice(0, 5);

    recentContainer.innerHTML = recent.length
      ? recent.map(attempt => `
          <article class="paper2-recent-attempt">
            <div class="paper2-recent-main">
              <strong>${this.escapeHtml(attempt.unit)}</strong>
              <span>${this.escapeHtml(attempt.commandTerm || this.assessmentLabel(attempt.assessment))} · ${this.escapeHtml(attempt.questionType || 'written')}</span>
              <small>${this.escapeHtml(this.formatDate(attempt.createdAt))}</small>
            </div>
            <div class="paper2-recent-score">
              <strong>${attempt.score} / ${attempt.maxMarks}</strong>
              <span>${this.escapeHtml(this.evaluatorLabel(attempt.evaluatorType))}</span>
            </div>
          </article>`).join('')
      : '<p class="muted paper2-progress-empty">No saved attempts for this section yet.</p>';
  },

  render() {
    this.ensureStylesheet();
    const panel = this.ensurePanel();
    if (!panel) return;
    this.patchRecorders();

    const catalog = this.getQuestionCatalog();
    const attempts = this.getNormalizedAttempts(catalog);
    const sectionQuestions = catalog.filter(question => question.assessmentTarget === this.activeAssessment);
    const sectionAttempts = attempts.filter(attempt => attempt.assessment === this.activeAssessment);
    const summary = this.summarizeAttempts(sectionAttempts);
    const coverage = this.coverageStats(sectionQuestions, sectionAttempts);

    document.querySelectorAll('.final-exam-progress-tab').forEach(button => {
      const active = button.id === `final-exam-tab-${this.activeAssessment}`;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    const attemptCount = document.getElementById('paper2-progress-attempts');
    const attemptBadge = document.getElementById('paper2-progress-attempt-badge');
    const marks = document.getElementById('paper2-progress-marks');
    const percent = document.getElementById('paper2-progress-percent');
    const coverageElement = document.getElementById('paper2-progress-coverage');

    if (attemptCount) attemptCount.textContent = summary.attempts;
    if (attemptBadge) attemptBadge.textContent = `${this.assessmentLabel(this.activeAssessment)} · ${summary.attempts} ${summary.attempts === 1 ? 'attempt' : 'attempts'}`;
    if (marks) marks.textContent = `${summary.score} / ${summary.maxMarks}`;
    if (percent) percent.textContent = summary.percentage === null ? '—' : `${summary.percentage}%`;
    if (coverageElement) coverageElement.textContent = `${coverage.tried} / ${coverage.total}`;

    this.renderThemes(sectionQuestions, sectionAttempts);
    this.renderRecent(sectionAttempts);
  },

  patchRecorders() {
    if (!this.paper1RecorderPatched && typeof Paper1Progress !== 'undefined' && typeof Paper1Progress.recordAttempt === 'function') {
      const originalPaper1Record = Paper1Progress.recordAttempt;
      Paper1Progress.recordAttempt = function(attempt) {
        const saved = originalPaper1Record.call(Paper1Progress, attempt);
        if (saved) Paper2ProgressView.render();
        return saved;
      };
      this.paper1RecorderPatched = true;
    }

    if (!this.paper2RecorderPatched && typeof Paper2Progress !== 'undefined' && typeof Paper2Progress.recordAttempt === 'function') {
      const originalPaper2Record = Paper2Progress.recordAttempt;
      Paper2Progress.recordAttempt = function(attempt) {
        const saved = originalPaper2Record.call(Paper2Progress, attempt);
        if (saved) Paper2ProgressView.render();
        return saved;
      };
      this.paper2RecorderPatched = true;
    }
  },

  init() {
    this.ensureStylesheet();
    this.ensurePanel();
    this.patchRecorders();
    this.render();
  }
};

Paper2ProgressView.init();