(() => {
  const ProgressUIV2 = window.ProgressUIV2 = {
    installed: false,
    pagesPatched: false,
    activeView: 'overview',
    subjects: ['English B HL', 'Biology SL', 'ESS HL', 'Math AI SL'],

    subjectMeta: {
      'English B HL': { short: 'ENG', theme: 'english', icon: 'Aa' },
      'Biology SL': { short: 'BIO', theme: 'biology', icon: 'BIO' },
      'ESS HL': { short: 'ESS', theme: 'ess', icon: 'ESS' },
      'Math AI SL': { short: 'MATH', theme: 'math', icon: 'MATH' }
    },

    sections(subject) {
      return ({
        'English B HL': [
          ['english-b-paper1-writing', 'Paper 1 Writing'],
          ['english-b-paper2-reading', 'Paper 2 Reading'],
          ['english-b-paper2-listening', 'Paper 2 Listening']
        ],
        'Biology SL': [
          ['paper1a', 'Paper 1A'],
          ['paper1b', 'Paper 1B'],
          ['paper2a', 'Paper 2A'],
          ['paper2b', 'Paper 2B']
        ],
        'ESS HL': [
          ['ess-paper1', 'Paper 1'],
          ['ess2a', 'Paper 2A'],
          ['ess2b', 'Paper 2B']
        ],
        'Math AI SL': [
          ['math-paper1', 'Paper 1'],
          ['math-paper2', 'Paper 2']
        ]
      })[subject] || [];
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    attempts(key) {
      const data = typeof Storage !== 'undefined' ? Storage.load(key) : null;
      return Array.isArray(data?.attempts) ? data.attempts : [];
    },

    allAttempts() {
      return [
        ...this.attempts('ib_paper1_progress'),
        ...this.attempts('ib_paper2_progress'),
        ...this.attempts('ib_english_b_paper1_progress'),
        ...this.attempts('ib_english_b_paper2_reading_progress'),
        ...this.attempts('ib_english_b_paper2_listening_progress')
      ];
    },

    assessment(attempt) {
      if (!attempt) return null;
      if (attempt.subject === 'English B HL') return attempt.assessmentTarget || null;
      if (attempt.subject === 'Biology SL') {
        if (['paper1a', 'paper1b'].includes(attempt.section)) return attempt.section;
        return ['paper2a', 'paper2b'].includes(attempt.assessmentTarget) ? attempt.assessmentTarget : null;
      }
      if (attempt.subject === 'ESS HL') {
        return attempt.assessmentTarget || (attempt.section === 'esspaper1' ? 'ess-paper1' : null);
      }
      if (attempt.subject === 'Math AI SL') {
        if (attempt.assessmentTarget === 'math-paper2') return 'math-paper2';
        if (attempt.assessmentTarget === 'math-paper1' || attempt.section === 'paper1b') return 'math-paper1';
      }
      return null;
    },

    validAttempts(attempts) {
      return attempts.filter(attempt => {
        const score = Number(attempt?.score);
        const maxMarks = Number(attempt?.maxMarks);
        return Number.isFinite(score) && Number.isFinite(maxMarks) && maxMarks > 0;
      });
    },

    summarize(attempts) {
      const valid = this.validAttempts(attempts);
      const score = valid.reduce((sum, attempt) => sum + Number(attempt.score), 0);
      const maxMarks = valid.reduce((sum, attempt) => sum + Number(attempt.maxMarks), 0);
      return {
        attempts: valid.length,
        score,
        maxMarks,
        percentage: maxMarks ? Math.round(score / maxMarks * 100) : null
      };
    },

    subjectAttempts(subject) {
      return this.allAttempts().filter(attempt => attempt?.subject === subject);
    },

    sectionSummary(subject, section) {
      return this.summarize(
        this.subjectAttempts(subject).filter(attempt => this.assessment(attempt) === section)
      );
    },

    ensureConsolidationStyles() {
      if (document.getElementById('progress-ui-v2-consolidation-styles')) return;
      const style = document.createElement('style');
      style.id = 'progress-ui-v2-consolidation-styles';
      style.textContent = `
        .progress-v2-more-panel{margin-top:16px}
        .progress-v2-more-details>summary{font-weight:850}
        .progress-v2-more-stack{display:grid;gap:14px;padding-top:8px}
        .progress-v2-detail-block{padding-top:14px;border-top:1px solid #e4e7ec}
        .progress-v2-detail-block:first-child{padding-top:2px;border-top:0}
        .progress-v2-detail-block>.progress-v2-panel-heading{margin-bottom:10px}
        .progress-v2-analysis-panel{margin:0}
      `;
      document.head.appendChild(style);
    },

    restructure() {
      const page = document.getElementById('statistics-page');
      const heading = page?.querySelector('.page-heading');
      if (!page || !heading) return false;
      this.ensureConsolidationStyles();
      if (document.getElementById('progress-ui-v2-root')) {
        this.attachLegacyPanels();
        return true;
      }

      page.classList.add('progress-ui-v2-page');
      heading.querySelector('p.muted')?.replaceChildren(document.createTextNode('See the big picture first, then drill into each subject.'));

      const root = document.createElement('section');
      root.id = 'progress-ui-v2-root';
      root.innerHTML = `
        <nav id="progress-v2-tabs" class="progress-v2-tabs" aria-label="Progress views"></nav>

        <section id="progress-v2-overview" class="progress-v2-view">
          <div id="progress-v2-summary-grid" class="progress-v2-summary-grid"></div>

          <section class="progress-v2-panel">
            <div class="progress-v2-panel-heading">
              <div>
                <p class="eyebrow">FINAL EXAM PERFORMANCE</p>
                <h3>All subjects</h3>
              </div>
              <span>Saved scored attempts</span>
            </div>
            <div id="progress-v2-subject-performance" class="progress-v2-performance-list"></div>
          </section>

          <section class="progress-v2-panel progress-v2-daily-card">
            <div class="progress-v2-panel-heading">
              <div>
                <p class="eyebrow">DAILY ACTIVITY</p>
                <h3 id="progress-v2-daily-month">This month</h3>
                <p id="progress-v2-daily-summary" class="muted">No tracked days yet.</p>
              </div>
              <div class="progress-v2-streak-pair">
                <span>🔥 Current <strong id="progress-v2-current-streak">0</strong></span>
                <span>🏆 Best <strong id="progress-v2-best-streak">0</strong></span>
              </div>
            </div>
            <details id="progress-v2-daily-details" class="progress-v2-details">
              <summary>View calendar <span>⌄</span></summary>
              <div id="progress-v2-daily-slot"></div>
            </details>
          </section>
        </section>

        <section id="progress-v2-subject" class="progress-v2-view" hidden>
          <header id="progress-v2-subject-hero" class="progress-v2-subject-hero">
            <div>
              <span id="progress-v2-subject-kicker" class="progress-v2-subject-kicker">SUBJECT</span>
              <h3 id="progress-v2-subject-title">Subject</h3>
              <p id="progress-v2-subject-summary" class="muted">No saved exam attempts yet.</p>
            </div>
            <div class="progress-v2-score-ring" aria-label="Subject final exam performance">
              <strong id="progress-v2-subject-score">—</strong>
              <span>Exam</span>
            </div>
          </header>

          <section class="progress-v2-panel">
            <div class="progress-v2-panel-heading compact">
              <div><p class="eyebrow">PAPER PERFORMANCE</p><h3>Papers & Sections</h3></div>
              <span>Marks-weighted score</span>
            </div>
            <div id="progress-v2-section-grid" class="progress-v2-section-grid"></div>
          </section>

          <section class="progress-v2-panel progress-v2-more-panel">
            <div class="progress-v2-panel-heading compact">
              <div><p class="eyebrow">MORE PROGRESS DETAILS</p><h3>History & Analysis</h3></div>
              <span>Open when you need deeper detail</span>
            </div>
            <details id="progress-v2-more-details" class="progress-v2-details progress-v2-more-details">
              <summary>Open progress details <span>⌄</span></summary>
              <div class="progress-v2-more-stack">
                <section id="progress-v2-chapter-panel" class="progress-v2-detail-block">
                  <div class="progress-v2-panel-heading compact">
                    <div><p class="eyebrow">QUIZ / CHAPTER PROGRESS</p><h3 id="progress-v2-chapter-title">Chapter progress</h3></div>
                    <span id="progress-v2-chapter-note">Vocabulary quiz data</span>
                  </div>
                  <div id="progress-v2-chapter-preview" class="progress-v2-chapter-list"></div>
                  <details id="progress-v2-chapter-details" class="progress-v2-details compact-details">
                    <summary>View all chapters <span>⌄</span></summary>
                    <div id="progress-v2-chapter-all" class="progress-v2-chapter-list"></div>
                  </details>
                </section>

                <section class="progress-v2-detail-block">
                  <div class="progress-v2-panel-heading compact">
                    <div><p class="eyebrow">RECENT EXAM TRAINING</p><h3>Latest attempts</h3></div>
                    <span>Latest 5 saved</span>
                  </div>
                  <div id="progress-v2-recent" class="progress-v2-recent-list"></div>
                </section>

                <section class="progress-v2-detail-block progress-v2-analysis-panel">
                  <div class="progress-v2-panel-heading compact">
                    <div><p class="eyebrow">SUBJECT ANALYSIS</p><h3>Detailed Analysis</h3></div>
                    <span>Expandable by subject</span>
                  </div>
                  <details id="progress-v2-analysis-details" class="progress-v2-details">
                    <summary>Open detailed analysis <span>⌄</span></summary>
                    <div id="progress-v2-analysis-placeholder" class="progress-v2-analysis-placeholder"></div>
                    <div id="progress-v2-analysis-slot"></div>
                  </details>
                </section>
              </div>
            </details>
          </section>
        </section>`;

      heading.insertAdjacentElement('afterend', root);
      this.renderTabs();
      this.attachLegacyPanels();
      return true;
    },

    renderTabs() {
      const nav = document.getElementById('progress-v2-tabs');
      if (!nav) return;
      const items = [
        ['overview', 'Overview'],
        ...this.subjects.map(subject => [subject, this.subjectMeta[subject]?.short || subject])
      ];
      nav.innerHTML = items.map(([value, label]) => {
        const theme = value === 'overview' ? 'overview' : this.subjectMeta[value]?.theme || 'general';
        return `<button type="button" data-progress-view="${this.escapeHtml(value)}" data-theme="${theme}" class="${value === this.activeView ? 'active' : ''}" aria-pressed="${value === this.activeView ? 'true' : 'false'}">${this.escapeHtml(label)}</button>`;
      }).join('');
      nav.querySelectorAll('[data-progress-view]').forEach(button => {
        button.addEventListener('click', () => this.setView(button.dataset.progressView));
      });
    },

    setView(view) {
      if (view !== 'overview' && !this.subjects.includes(view)) return;
      this.activeView = view;
      this.renderTabs();
      this.render();
      document.getElementById('statistics-page')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    attachLegacyPanels() {
      if (typeof DailyChallenge !== 'undefined' && typeof DailyChallenge.ensureSupplementalUI === 'function') {
        DailyChallenge.ensureSupplementalUI();
      }

      const dailySlot = document.getElementById('progress-v2-daily-slot');
      const dailyPanel = document.getElementById('daily-history-panel');
      if (dailySlot && dailyPanel && dailyPanel.parentElement !== dailySlot) dailySlot.appendChild(dailyPanel);

      const analysisSlot = document.getElementById('progress-v2-analysis-slot');
      const biologyPanel = document.getElementById('paper2-progress-panel');
      if (analysisSlot && biologyPanel && biologyPanel.parentElement !== analysisSlot) analysisSlot.appendChild(biologyPanel);

      if (biologyPanel) {
        const eyebrow = biologyPanel.querySelector('.paper2-progress-heading .eyebrow');
        const title = biologyPanel.querySelector('.paper2-progress-heading h3');
        const description = biologyPanel.querySelector('.paper2-progress-heading p.muted');
        if (eyebrow) eyebrow.textContent = 'DETAILED ANALYSIS';
        if (title) title.textContent = 'Biology Detailed Analysis';
        if (description) description.textContent = 'Theme, unit, coverage and recent-attempt analysis for Biology SL.';
      }
    },

    renderOverviewSummary() {
      const grid = document.getElementById('progress-v2-summary-grid');
      if (!grid || typeof Progress === 'undefined') return;
      const currentStreak = typeof DailyChallenge?.getCurrentMissionStreak === 'function'
        ? DailyChallenge.getCurrentMissionStreak()
        : Number(window.Streak?.data?.count || 0);
      const values = [
        ['🔥', currentStreak, 'Day Streak'],
        ['⚡', Number(Progress.data?.xp || 0), 'Total XP'],
        ['✓', Number(Progress.data?.questions || 0), 'Quiz Questions'],
        ['◎', `${typeof Progress.accuracy === 'function' ? Progress.accuracy() : 0}%`, 'Quiz Accuracy']
      ];
      grid.innerHTML = values.map(([icon, value, label]) => `
        <article class="progress-v2-summary-card">
          <span aria-hidden="true">${icon}</span>
          <strong>${this.escapeHtml(value)}</strong>
          <small>${this.escapeHtml(label)}</small>
        </article>`).join('');
    },

    renderSubjectPerformanceOverview() {
      const container = document.getElementById('progress-v2-subject-performance');
      if (!container) return;
      container.innerHTML = this.subjects.map(subject => {
        const summary = this.summarize(this.subjectAttempts(subject));
        const meta = this.subjectMeta[subject] || {};
        const score = summary.percentage === null ? '—' : `${summary.percentage}%`;
        const width = summary.percentage === null ? 0 : Math.max(0, Math.min(100, summary.percentage));
        return `
          <button type="button" class="progress-v2-performance-row" data-open-subject="${this.escapeHtml(subject)}" data-theme="${meta.theme || 'general'}">
            <span class="progress-v2-subject-badge">${this.escapeHtml(meta.short || '')}</span>
            <span class="progress-v2-performance-copy">
              <strong>${this.escapeHtml(subject)}</strong>
              <span class="progress-v2-performance-track"><span style="width:${width}%"></span></span>
            </span>
            <span class="progress-v2-performance-metric"><strong>${score}</strong><small>${summary.attempts} ${summary.attempts === 1 ? 'attempt' : 'attempts'}</small></span>
            <span class="progress-v2-row-arrow" aria-hidden="true">›</span>
          </button>`;
      }).join('');
      container.querySelectorAll('[data-open-subject]').forEach(button => {
        button.addEventListener('click', () => this.setView(button.dataset.openSubject));
      });
    },

    renderDailyOverview() {
      if (typeof DailyChallenge === 'undefined') return;
      const stats = typeof DailyChallenge.getCurrentMonthStats === 'function'
        ? DailyChallenge.getCurrentMonthStats()
        : null;
      const current = typeof DailyChallenge.getCurrentMissionStreak === 'function' ? DailyChallenge.getCurrentMissionStreak() : 0;
      const best = typeof DailyChallenge.getBestMissionStreak === 'function' ? DailyChallenge.getBestMissionStreak() : current;
      const monthEl = document.getElementById('progress-v2-daily-month');
      const summaryEl = document.getElementById('progress-v2-daily-summary');
      const currentEl = document.getElementById('progress-v2-current-streak');
      const bestEl = document.getElementById('progress-v2-best-streak');
      if (stats && monthEl) {
        monthEl.textContent = new Date(stats.year, stats.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      if (stats && summaryEl) summaryEl.textContent = `${stats.completed} / ${stats.eligibleDays} tracked days fully complete`;
      if (currentEl) currentEl.textContent = String(current);
      if (bestEl) bestEl.textContent = String(best);
    },

    chapterEntries(subject) {
      const chapters = Progress?.data?.chapterStats?.[subject] || {};
      return Object.entries(chapters).map(([chapter, stats]) => {
        const questions = Number(stats?.questions || 0);
        const correct = Number(stats?.correct || 0);
        return {
          chapter,
          questions,
          correct,
          accuracy: questions ? Math.round(correct / questions * 100) : 0
        };
      }).sort((a, b) => a.chapter.localeCompare(b.chapter, 'en', { numeric: true }));
    },

    chapterRow(item) {
      return `
        <div class="progress-v2-chapter-row">
          <div><strong>${this.escapeHtml(item.chapter)}</strong><small>${item.correct} / ${item.questions} correct</small></div>
          <div class="progress-v2-mini-track"><span style="width:${Math.max(0, Math.min(100, item.accuracy))}%"></span></div>
          <strong class="progress-v2-chapter-score">${item.accuracy}%</strong>
        </div>`;
    },

    renderChapters(subject) {
      const panel = document.getElementById('progress-v2-chapter-panel');
      const preview = document.getElementById('progress-v2-chapter-preview');
      const all = document.getElementById('progress-v2-chapter-all');
      const details = document.getElementById('progress-v2-chapter-details');
      const note = document.getElementById('progress-v2-chapter-note');
      if (!panel || !preview || !all || !details || !note) return;

      if (subject === 'Math AI SL') {
        note.textContent = 'Exam skill data';
        preview.innerHTML = '<p class="progress-v2-empty">Math AI SL does not use vocabulary quiz chapters. Topic and skill analysis can be added here as exam analytics expand.</p>';
        all.innerHTML = '';
        details.hidden = true;
        return;
      }

      note.textContent = 'Vocabulary quiz data';
      const entries = this.chapterEntries(subject);
      if (!entries.length) {
        preview.innerHTML = '<p class="progress-v2-empty">No chapter quiz progress yet.</p>';
        all.innerHTML = '';
        details.hidden = true;
        return;
      }

      const attention = [...entries].sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions).slice(0, 5);
      preview.innerHTML = attention.map(item => this.chapterRow(item)).join('');
      all.innerHTML = entries.map(item => this.chapterRow(item)).join('');
      details.hidden = entries.length <= 5;
    },

    renderSections(subject) {
      const container = document.getElementById('progress-v2-section-grid');
      if (!container) return;
      container.innerHTML = this.sections(subject).map(([section, label]) => {
        const summary = this.sectionSummary(subject, section);
        const score = summary.percentage === null ? '—' : `${summary.percentage}%`;
        return `
          <article class="progress-v2-section-card">
            <span>${this.escapeHtml(label)}</span>
            <strong>${score}</strong>
            <small>${summary.attempts} ${summary.attempts === 1 ? 'attempt' : 'attempts'}</small>
          </article>`;
      }).join('');
    },

    recentLabel(attempt) {
      return attempt?.unit
        || attempt?.chapter
        || (Array.isArray(attempt?.chapters) ? attempt.chapters.join(', ') : '')
        || attempt?.questionId
        || attempt?.setId
        || 'Practice attempt';
    },

    renderRecent(subject) {
      const container = document.getElementById('progress-v2-recent');
      if (!container) return;
      const recent = this.validAttempts(this.subjectAttempts(subject))
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
        .slice(0, 5);
      if (!recent.length) {
        container.innerHTML = '<p class="progress-v2-empty">No saved scored exam attempts yet.</p>';
        return;
      }
      container.innerHTML = recent.map(attempt => {
        const section = this.assessment(attempt);
        const sectionLabel = this.sections(subject).find(([key]) => key === section)?.[1] || 'Exam';
        const score = Math.round(Number(attempt.score) / Number(attempt.maxMarks) * 100);
        const date = new Date(attempt.createdAt || 0);
        const dateLabel = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        return `
          <article class="progress-v2-recent-row">
            <div>
              <span>${this.escapeHtml(sectionLabel)}</span>
              <strong>${this.escapeHtml(this.recentLabel(attempt))}</strong>
              <small>${this.escapeHtml(dateLabel)}</small>
            </div>
            <strong>${score}%</strong>
          </article>`;
      }).join('');
    },

    renderAnalysis(subject) {
      const placeholder = document.getElementById('progress-v2-analysis-placeholder');
      const slot = document.getElementById('progress-v2-analysis-slot');
      if (!placeholder || !slot) return;
      const biologyPanel = document.getElementById('paper2-progress-panel');

      if (subject === 'Biology SL') {
        placeholder.hidden = true;
        slot.hidden = false;
        if (biologyPanel) biologyPanel.style.display = 'block';
        if (typeof Paper2ProgressView !== 'undefined' && typeof Paper2ProgressView.render === 'function') {
          Paper2ProgressView.render();
          this.attachLegacyPanels();
        }
        return;
      }

      slot.hidden = true;
      placeholder.hidden = false;
      const examples = {
        'English B HL': 'Writing criteria, Reading and Listening question types, text types and recurring weaknesses can live here.',
        'ESS HL': 'Topic, command-term, data-analysis, case-study and essay performance can live here.',
        'Math AI SL': 'Topic 1–5, skill, modeling, calculator and interpretation performance can live here.'
      };
      placeholder.innerHTML = `
        <strong>${this.escapeHtml(subject)} analysis foundation</strong>
        <p>${this.escapeHtml(examples[subject] || 'Subject-specific detailed analytics can be added here.')}</p>
        <span>Current saved exam results remain available above while this analysis layer expands.</span>`;
    },

    renderSubject(subject) {
      const meta = this.subjectMeta[subject] || { short: 'SUBJECT', theme: 'general' };
      const summary = this.summarize(this.subjectAttempts(subject));
      const hero = document.getElementById('progress-v2-subject-hero');
      const kicker = document.getElementById('progress-v2-subject-kicker');
      const title = document.getElementById('progress-v2-subject-title');
      const summaryEl = document.getElementById('progress-v2-subject-summary');
      const score = document.getElementById('progress-v2-subject-score');
      if (hero) hero.dataset.theme = meta.theme;
      if (kicker) kicker.textContent = meta.short;
      if (title) title.textContent = subject;
      if (summaryEl) {
        summaryEl.textContent = summary.attempts
          ? `${summary.score} / ${summary.maxMarks} marks across ${summary.attempts} scored ${summary.attempts === 1 ? 'attempt' : 'attempts'}.`
          : 'No saved scored Final Exam attempts yet.';
      }
      if (score) score.textContent = summary.percentage === null ? '—' : `${summary.percentage}%`;
      this.renderSections(subject);
      this.renderChapters(subject);
      this.renderRecent(subject);
      this.renderAnalysis(subject);
    },

    render() {
      if (!this.restructure()) return false;
      this.attachLegacyPanels();

      const overview = document.getElementById('progress-v2-overview');
      const subjectView = document.getElementById('progress-v2-subject');
      if (!overview || !subjectView) return false;

      const showOverview = this.activeView === 'overview';
      overview.hidden = !showOverview;
      subjectView.hidden = showOverview;

      if (showOverview) {
        this.renderOverviewSummary();
        this.renderSubjectPerformanceOverview();
        this.renderDailyOverview();
      } else {
        this.renderSubject(this.activeView);
      }
      return true;
    },

    patchPages() {
      if (this.pagesPatched || typeof Pages === 'undefined') return;
      const original = Pages.show.bind(Pages);
      const self = this;
      Pages.show = function(page) {
        const result = original(page);
        if (page === 'statistics') {
          window.setTimeout(() => {
            self.render();
            self.attachLegacyPanels();
          }, 0);
          window.setTimeout(() => {
            self.attachLegacyPanels();
            if (self.activeView !== 'overview') self.renderAnalysis(self.activeView);
          }, 180);
        }
        return result;
      };
      this.pagesPatched = true;
    },

    install() {
      if (this.installed) return true;
      if (
        typeof Pages === 'undefined'
        || typeof Progress === 'undefined'
        || typeof Storage === 'undefined'
        || !document.getElementById('statistics-page')
      ) return false;

      if (!this.restructure()) return false;
      this.patchPages();
      this.installed = true;
      this.render();
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 500) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Progress UI v2 could not initialize. Existing Progress remains available.');
        }
      }, 50);
    }
  };

  ProgressUIV2.boot();
})();
