const Paper2ProgressView = {
  styleHref: 'css/paper2-progress.css',
  recorderPatched: false,

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
          <p class="eyebrow">WRITTEN PRACTICE</p>
          <h3>Paper 2 Progress</h3>
          <p class="muted">Saved self-marking and future AI-marking attempts are tracked separately from Vocabulary.</p>
        </div>
        <span id="paper2-progress-attempt-badge">0 attempts</span>
      </div>

      <div class="paper2-progress-summary" aria-label="Paper 2 summary">
        <div class="paper2-progress-stat">
          <span>Attempts</span>
          <strong id="paper2-progress-attempts">0</strong>
        </div>
        <div class="paper2-progress-stat">
          <span>Marks Earned</span>
          <strong id="paper2-progress-marks">0 / 0</strong>
        </div>
        <div class="paper2-progress-stat">
          <span>Overall Score</span>
          <strong id="paper2-progress-percent">0%</strong>
        </div>
      </div>

      <div class="paper2-progress-section">
        <div class="paper2-progress-section-heading">
          <h4>Chapter Performance</h4>
          <span class="muted">Weighted by available marks</span>
        </div>
        <div id="paper2-progress-chapters"></div>
      </div>

      <div class="paper2-progress-section">
        <div class="paper2-progress-section-heading">
          <h4>Recent Attempts</h4>
          <span class="muted">Latest 5</span>
        </div>
        <div id="paper2-progress-recent"></div>
      </div>`;

    const chapterPanel = document.getElementById('chapter-progress-panel');
    if (chapterPanel) chapterPanel.insertAdjacentElement('afterend', panel);
    else statisticsPage.appendChild(panel);
    return panel;
  },

  loadAttempts() {
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

  normalizeAttempt(attempt) {
    if (!attempt || typeof attempt !== 'object') return null;
    const maxMarks = Number(attempt.maxMarks);
    const rawScore = Number(attempt.score);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || !Number.isFinite(rawScore)) return null;

    return {
      ...attempt,
      score: Math.max(0, Math.min(rawScore, maxMarks)),
      maxMarks,
      chapter: attempt.chapter || 'Unspecified chapter',
      evaluatorType: attempt.evaluator?.type || 'unknown'
    };
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
      'self-checklist': 'Self-checklist',
      'ai': 'AI',
      'ai-marking': 'AI',
      'hybrid': 'AI + review'
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

  aggregateChapters(attempts) {
    const chapters = {};
    attempts.forEach(attempt => {
      if (!chapters[attempt.chapter]) {
        chapters[attempt.chapter] = { attempts: 0, score: 0, maxMarks: 0 };
      }
      const stats = chapters[attempt.chapter];
      stats.attempts++;
      stats.score += attempt.score;
      stats.maxMarks += attempt.maxMarks;
    });
    return Object.entries(chapters).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }));
  },

  render() {
    this.ensureStylesheet();
    const panel = this.ensurePanel();
    if (!panel) return;

    const attempts = this.loadAttempts()
      .map(attempt => this.normalizeAttempt(attempt))
      .filter(Boolean);
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalMarks = attempts.reduce((sum, attempt) => sum + attempt.maxMarks, 0);
    const percentage = totalMarks ? Math.round((totalScore / totalMarks) * 100) : 0;

    const attemptCount = document.getElementById('paper2-progress-attempts');
    const attemptBadge = document.getElementById('paper2-progress-attempt-badge');
    const marks = document.getElementById('paper2-progress-marks');
    const percent = document.getElementById('paper2-progress-percent');
    if (attemptCount) attemptCount.textContent = attempts.length;
    if (attemptBadge) attemptBadge.textContent = `${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'}`;
    if (marks) marks.textContent = `${totalScore} / ${totalMarks}`;
    if (percent) percent.textContent = `${percentage}%`;

    const chapterContainer = document.getElementById('paper2-progress-chapters');
    if (chapterContainer) {
      const chapterEntries = this.aggregateChapters(attempts);
      chapterContainer.innerHTML = chapterEntries.length
        ? chapterEntries.map(([chapter, stats]) => {
            const chapterPercent = stats.maxMarks ? Math.round((stats.score / stats.maxMarks) * 100) : 0;
            return `
              <div class="paper2-progress-chapter-row">
                <div>
                  <strong>${this.escapeHtml(chapter)}</strong>
                  <small>${stats.attempts} ${stats.attempts === 1 ? 'attempt' : 'attempts'} · ${stats.score} / ${stats.maxMarks} marks</small>
                </div>
                <span>${chapterPercent}%</span>
              </div>`;
          }).join('')
        : '<p class="muted paper2-progress-empty">No Paper 2 scores saved yet.</p>';
    }

    const recentContainer = document.getElementById('paper2-progress-recent');
    if (recentContainer) {
      const recent = [...attempts]
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
        .slice(0, 5);
      recentContainer.innerHTML = recent.length
        ? recent.map(attempt => `
            <article class="paper2-recent-attempt">
              <div class="paper2-recent-main">
                <strong>${this.escapeHtml(attempt.chapter)}</strong>
                <span>${this.escapeHtml(attempt.commandTerm || 'Paper 2')} · ${this.escapeHtml(attempt.questionType || 'written')}</span>
                <small>${this.escapeHtml(this.formatDate(attempt.createdAt))}</small>
              </div>
              <div class="paper2-recent-score">
                <strong>${attempt.score} / ${attempt.maxMarks}</strong>
                <span>${this.escapeHtml(this.evaluatorLabel(attempt.evaluatorType))}</span>
              </div>
            </article>`).join('')
        : '<p class="muted paper2-progress-empty">Your saved attempts will appear here.</p>';
    }
  },

  patchRecorder() {
    if (this.recorderPatched || typeof Paper2Progress === 'undefined') return;
    if (typeof Paper2Progress.recordAttempt !== 'function') return;

    const originalRecordAttempt = Paper2Progress.recordAttempt;
    Paper2Progress.recordAttempt = function(attempt) {
      const saved = originalRecordAttempt.call(Paper2Progress, attempt);
      if (saved) Paper2ProgressView.render();
      return saved;
    };
    this.recorderPatched = true;
  },

  init() {
    this.ensureStylesheet();
    this.ensurePanel();
    this.patchRecorder();
    this.render();
  }
};

Paper2ProgressView.init();
