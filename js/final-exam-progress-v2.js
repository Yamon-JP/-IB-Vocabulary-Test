(() => {
  const FinalExamProgressV2 = window.FinalExamProgressV2 = {
    installed: false,
    pagesPatched: false,
    progressViewPatched: false,
    refreshTimer: null,
    subjects: ['English B HL', 'Biology SL', 'ESS HL', 'Math AI SL'],
    stores: [
      { key: 'ib_paper1_progress', subject: null },
      { key: 'ib_paper2_progress', subject: null },
      { key: 'ib_english_b_paper1_progress', subject: 'English B HL' },
      { key: 'ib_english_b_paper2_reading_progress', subject: 'English B HL' },
      { key: 'ib_english_b_paper2_listening_progress', subject: 'English B HL' }
    ],

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    loadAttempts(key) {
      if (typeof Storage === 'undefined') return [];
      const saved = Storage.load(key);
      return Array.isArray(saved?.attempts) ? saved.attempts : [];
    },

    allAttempts() {
      const seen = new Set();
      const attempts = [];
      this.stores.forEach(store => {
        this.loadAttempts(store.key).forEach((attempt, index) => {
          const subject = String(attempt?.subject || store.subject || '').trim();
          if (!this.subjects.includes(subject)) return;
          const identity = `${store.key}:${attempt?.attemptId || attempt?.sessionId || attempt?.questionId || attempt?.setId || ''}:${attempt?.createdAt || ''}:${index}`;
          if (seen.has(identity)) return;
          seen.add(identity);
          attempts.push({ ...attempt, subject });
        });
      });
      return attempts;
    },

    validAttempt(attempt) {
      const score = Number(attempt?.score);
      const maxMarks = Number(attempt?.maxMarks);
      return Number.isFinite(score) && Number.isFinite(maxMarks) && maxMarks > 0;
    },

    sortRecent(attempts) {
      return [...attempts].sort((a, b) => (Date.parse(b?.createdAt) || 0) - (Date.parse(a?.createdAt) || 0));
    },

    subjectAttempts(subject) {
      return this.allAttempts().filter(attempt => attempt.subject === subject && this.validAttempt(attempt));
    },

    normalAttempts(subject) {
      return this.sortRecent(this.subjectAttempts(subject).filter(attempt => !attempt?.fullMock));
    },

    summarize(attempts) {
      const valid = attempts.filter(attempt => this.validAttempt(attempt));
      const score = valid.reduce((sum, attempt) => {
        const maxMarks = Number(attempt.maxMarks);
        return sum + Math.max(0, Math.min(Number(attempt.score), maxMarks));
      }, 0);
      const maxMarks = valid.reduce((sum, attempt) => sum + Number(attempt.maxMarks), 0);
      return {
        attempts: valid.length,
        score,
        maxMarks,
        percentage: maxMarks > 0 ? Math.round(score / maxMarks * 100) : null
      };
    },

    currentReadiness(subject) {
      return this.summarize(this.normalAttempts(subject).slice(0, 5));
    },

    trend(subject) {
      const recent = this.normalAttempts(subject).slice(0, 6);
      if (recent.length < 6) return { status: 'baseline', label: 'Building baseline', delta: null, icon: '•' };
      const current = this.summarize(recent.slice(0, 3));
      const previous = this.summarize(recent.slice(3, 6));
      if (current.percentage === null || previous.percentage === null) return { status: 'baseline', label: 'Building baseline', delta: null, icon: '•' };
      const delta = current.percentage - previous.percentage;
      if (delta >= 3) return { status: 'up', label: `Improving +${delta} pts`, delta, icon: '↑' };
      if (delta <= -3) return { status: 'down', label: `Needs attention ${delta} pts`, delta, icon: '↓' };
      return { status: 'stable', label: `Stable ${delta >= 0 ? '+' : ''}${delta} pts`, delta, icon: '→' };
    },

    assessment(attempt) {
      if (!attempt) return null;
      if (attempt.subject === 'English B HL') return attempt.assessmentTarget || null;
      if (attempt.subject === 'Biology SL') {
        if (['paper1a', 'paper1b'].includes(attempt.section)) return attempt.section;
        if (['paper2a', 'paper2b'].includes(attempt.assessmentTarget)) return attempt.assessmentTarget;
      }
      if (attempt.subject === 'ESS HL') {
        if (attempt.assessmentTarget) return attempt.assessmentTarget;
        if (attempt.section === 'esspaper1') return 'ess-paper1';
      }
      if (attempt.subject === 'Math AI SL') {
        if (attempt.assessmentTarget === 'math-paper2') return 'math-paper2';
        if (attempt.assessmentTarget === 'math-paper1' || attempt.section === 'paper1b') return 'math-paper1';
      }
      return null;
    },

    assessmentLabel(subject, assessment) {
      const labels = {
        'English B HL': {
          'english-b-paper1-writing': 'Paper 1 Writing',
          'english-b-paper2-reading': 'Paper 2 Reading',
          'english-b-paper2-listening': 'Paper 2 Listening'
        },
        'Biology SL': {
          paper1a: 'Paper 1A',
          paper1b: 'Paper 1B',
          paper2a: 'Paper 2 · Section A',
          paper2b: 'Paper 2 · Section B'
        },
        'ESS HL': {
          'ess-paper1': 'Paper 1',
          ess2a: 'Paper 2A',
          ess2b: 'Paper 2B'
        },
        'Math AI SL': {
          'math-paper1': 'Paper 1',
          'math-paper2': 'Paper 2'
        }
      };
      return labels[subject]?.[assessment] || assessment || 'Exam';
    },

    inferMockPaper(attempt) {
      if (['paper1a', 'paper1b'].includes(attempt?.section)) return 'paper1';
      if (['paper2a', 'paper2b'].includes(attempt?.assessmentTarget)) return 'paper2';
      const target = String(attempt?.assessmentTarget || attempt?.section || '').toLowerCase();
      if (target.includes('paper1')) return 'paper1';
      if (target.includes('paper2')) return 'paper2';
      return null;
    },

    latestMocks(subject) {
      const latest = {};
      this.sortRecent(this.subjectAttempts(subject).filter(attempt => attempt?.fullMock && attempt?.sessionId)).forEach(attempt => {
        const paper = this.inferMockPaper(attempt);
        if (!paper || latest[paper]) return;
        const score = Number(attempt.fullMockTotalScore);
        const maxMarks = Number(attempt.fullMockTotalMaxMarks);
        if (!Number.isFinite(score) || !Number.isFinite(maxMarks) || maxMarks <= 0) return;
        latest[paper] = {
          paper,
          score,
          maxMarks,
          percentage: Math.round(score / maxMarks * 100),
          createdAt: attempt.createdAt,
          sessionId: attempt.sessionId
        };
      });
      return latest;
    },

    mockLabel(subject) {
      const mocks = this.latestMocks(subject);
      const parts = [];
      if (mocks.paper1) parts.push(`P1 ${mocks.paper1.percentage}%`);
      if (mocks.paper2) parts.push(`P2 ${mocks.paper2.percentage}%`);
      return parts.length ? parts.join(' · ') : 'No saved Full Mock';
    },

    areaName(attempt) {
      const direct = [attempt?.unit, attempt?.chapter, attempt?.topic]
        .find(value => typeof value === 'string' && value.trim());
      if (direct) return direct.trim();
      if (Array.isArray(attempt?.chapters) && attempt.chapters.length) return attempt.chapters.join(', ');
      return this.assessmentLabel(attempt?.subject, this.assessment(attempt));
    },

    weakestEnglish() {
      const subject = 'English B HL';
      const attempts = this.normalAttempts(subject);
      const candidates = [];
      const writing = attempts.filter(attempt => this.assessment(attempt) === 'english-b-paper1-writing' && attempt?.scores).slice(0, 5);
      const criteria = [
        ['Language', 'language', 12],
        ['Message', 'message', 12],
        ['Conceptual understanding', 'conceptualUnderstanding', 6]
      ];
      criteria.forEach(([area, criterion, max]) => {
        const rows = writing.filter(attempt => Number.isFinite(Number(attempt?.scores?.[criterion])));
        if (!rows.length) return;
        const score = rows.reduce((sum, attempt) => sum + Number(attempt.scores[criterion]), 0);
        const maxMarks = rows.length * max;
        candidates.push({
          subject,
          assessment: 'english-b-paper1-writing',
          area,
          criterion,
          label: `Paper 1 Writing · ${area}`,
          percentage: Math.round(score / maxMarks * 100),
          attempts: rows.length
        });
      });
      [
        ['english-b-paper2-reading', 'Paper 2 Reading'],
        ['english-b-paper2-listening', 'Paper 2 Listening']
      ].forEach(([assessment, label]) => {
        const rows = attempts.filter(attempt => this.assessment(attempt) === assessment).slice(0, 5);
        const summary = this.summarize(rows);
        if (summary.percentage !== null) {
          candidates.push({
            subject,
            assessment,
            area: label,
            criterion: null,
            label,
            percentage: summary.percentage,
            attempts: summary.attempts
          });
        }
      });
      return candidates.sort((a, b) => a.percentage - b.percentage || a.attempts - b.attempts)[0] || null;
    },

    weakestGeneral(subject) {
      const groups = new Map();
      this.normalAttempts(subject).forEach(attempt => {
        const assessment = this.assessment(attempt);
        const area = this.areaName(attempt);
        const key = `${assessment || 'exam'}|${area}`;
        if (!groups.has(key)) groups.set(key, { assessment, area, attempts: [] });
        groups.get(key).attempts.push(attempt);
      });
      const candidates = [...groups.values()].map(group => {
        const recent = this.sortRecent(group.attempts).slice(0, 6);
        const summary = this.summarize(recent);
        return {
          subject,
          assessment: group.assessment,
          area: group.area,
          criterion: null,
          label: `${this.assessmentLabel(subject, group.assessment)} · ${group.area}`,
          percentage: summary.percentage,
          attempts: summary.attempts
        };
      }).filter(candidate => candidate.percentage !== null);
      return candidates.sort((a, b) => a.percentage - b.percentage || a.attempts - b.attempts)[0] || null;
    },

    weakest(subject) {
      return subject === 'English B HL' ? this.weakestEnglish() : this.weakestGeneral(subject);
    },

    recommendation(subject) {
      const weak = this.weakest(subject);
      return weak ? { ...weak, source: 'final-exam' } : null;
    },

    weakestAcrossSubjects() {
      return this.subjects
        .map(subject => this.recommendation(subject))
        .filter(Boolean)
        .sort((a, b) => a.percentage - b.percentage || a.attempts - b.attempts)[0] || null;
    },

    subjectTP(subject) {
      if (typeof TrainingPoints === 'undefined' || typeof TrainingPoints.summary !== 'function') return null;
      const summary = TrainingPoints.summary();
      const value = Number(summary?.subjects?.[subject]);
      return Number.isFinite(value) ? value : null;
    },

    overallTP() {
      if (typeof TrainingPoints === 'undefined' || typeof TrainingPoints.summary !== 'function') return null;
      const value = Number(TrainingPoints.summary()?.total);
      return Number.isFinite(value) ? value : null;
    },

    ensureStyles() {
      if (document.getElementById('final-exam-progress-v2-styles')) return;
      const style = document.createElement('style');
      style.id = 'final-exam-progress-v2-styles';
      style.textContent = `
        .final-readiness-panel{margin-top:16px}
        .final-readiness-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .final-readiness-card{padding:14px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}
        .final-readiness-card span,.final-readiness-card small{display:block;color:#667085}
        .final-readiness-card strong{display:block;margin-top:4px;font-size:1.08rem;line-height:1.35}
        .final-readiness-card small{margin-top:5px;font-size:.76rem;line-height:1.4}
        .final-readiness-trend[data-status="up"] strong{color:#027a48}
        .final-readiness-trend[data-status="down"] strong{color:#b42318}
        .final-readiness-overview-list{display:grid;gap:8px}
        .final-readiness-overview-row{display:grid;grid-template-columns:1.2fr .72fr .9fr 1fr 1.5fr;gap:10px;align-items:center;width:100%;padding:12px;border:1px solid #e4e7ec;border-radius:13px;background:#fff;text-align:left}
        .final-readiness-overview-row:hover{border-color:#cfd6df}
        .final-readiness-overview-row span,.final-readiness-overview-row small{color:#667085;font-size:.78rem}
        .final-readiness-overview-row strong{font-size:.92rem}
        .final-readiness-overview-empty{color:#667085}
        @media(max-width:900px){.final-readiness-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.final-readiness-overview-row{grid-template-columns:1fr 1fr}.final-readiness-overview-row .final-readiness-weak{grid-column:1/-1}}
        @media(max-width:560px){.final-readiness-grid{grid-template-columns:1fr}.final-readiness-overview-row{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    },

    ensureOverviewPanel() {
      if (document.getElementById('final-exam-readiness-overview')) return;
      const overview = document.getElementById('progress-v2-overview');
      if (!overview) return;
      const panel = document.createElement('section');
      panel.id = 'final-exam-readiness-overview';
      panel.className = 'progress-v2-panel final-readiness-panel';
      panel.innerHTML = `
        <div class="progress-v2-panel-heading">
          <div><p class="eyebrow">CURRENT FINAL EXAM READINESS</p><h3>What needs attention now</h3></div>
          <span id="final-readiness-overall-tp">Today: — TP</span>
        </div>
        <div id="final-readiness-overview-list" class="final-readiness-overview-list"></div>`;
      const existingPerformance = document.getElementById('progress-v2-subject-performance')?.closest('.progress-v2-panel');
      if (existingPerformance) existingPerformance.insertAdjacentElement('beforebegin', panel);
      else overview.appendChild(panel);
    },

    ensureSubjectPanel() {
      if (document.getElementById('final-exam-readiness-subject')) return;
      const subjectView = document.getElementById('progress-v2-subject');
      const hero = document.getElementById('progress-v2-subject-hero');
      if (!subjectView || !hero) return;
      const panel = document.createElement('section');
      panel.id = 'final-exam-readiness-subject';
      panel.className = 'progress-v2-panel final-readiness-panel';
      panel.innerHTML = `
        <div class="progress-v2-panel-heading compact">
          <div><p class="eyebrow">CURRENT READINESS</p><h3 id="final-readiness-subject-heading">Final Exam snapshot</h3></div>
          <span>Recent practice is separate from all-time results below</span>
        </div>
        <div id="final-readiness-subject-grid" class="final-readiness-grid"></div>`;
      hero.insertAdjacentElement('afterend', panel);
    },

    ensureUI() {
      this.ensureStyles();
      this.ensureOverviewPanel();
      this.ensureSubjectPanel();
    },

    renderOverview() {
      this.ensureOverviewPanel();
      const container = document.getElementById('final-readiness-overview-list');
      const tp = document.getElementById('final-readiness-overall-tp');
      if (tp) {
        const value = this.overallTP();
        tp.textContent = value === null ? 'Today: — TP' : `Today: ${value} / 30 TP`;
      }
      if (!container) return;
      container.innerHTML = this.subjects.map(subject => {
        const readiness = this.currentReadiness(subject);
        const trend = this.trend(subject);
        const weak = this.weakest(subject);
        const readinessLabel = readiness.percentage === null ? '—' : `${readiness.percentage}%`;
        const weakLabel = weak ? `${weak.label} · ${weak.percentage}%` : 'No scored weakness yet';
        return `
          <button type="button" class="final-readiness-overview-row" data-final-readiness-subject="${this.escapeHtml(subject)}">
            <strong>${this.escapeHtml(subject)}</strong>
            <span><strong>${readinessLabel}</strong><small>Current</small></span>
            <span><strong>${this.escapeHtml(`${trend.icon} ${trend.label}`)}</strong><small>Trend</small></span>
            <span><strong>${this.escapeHtml(this.mockLabel(subject))}</strong><small>Latest Mock</small></span>
            <span class="final-readiness-weak"><strong>${this.escapeHtml(weakLabel)}</strong><small>Weakest saved area</small></span>
          </button>`;
      }).join('');
      container.querySelectorAll('[data-final-readiness-subject]').forEach(button => {
        button.addEventListener('click', () => {
          if (typeof ProgressUIV2 !== 'undefined' && typeof ProgressUIV2.setView === 'function') {
            ProgressUIV2.setView(button.dataset.finalReadinessSubject);
          }
        });
      });
    },

    renderSubject(subject) {
      this.ensureSubjectPanel();
      const heading = document.getElementById('final-readiness-subject-heading');
      const grid = document.getElementById('final-readiness-subject-grid');
      if (!grid) return;
      if (heading) heading.textContent = `${subject} · Final Exam snapshot`;
      const readiness = this.currentReadiness(subject);
      const trend = this.trend(subject);
      const weak = this.weakest(subject);
      const tp = this.subjectTP(subject);
      const readinessLabel = readiness.percentage === null ? '—' : `${readiness.percentage}%`;
      const readinessNote = readiness.attempts ? `Latest ${readiness.attempts} normal scored attempt${readiness.attempts === 1 ? '' : 's'} · marks-weighted` : 'No normal scored attempts yet';
      const weakLabel = weak ? `${weak.label} · ${weak.percentage}%` : 'No scored weakness yet';
      const weakNote = weak ? `${weak.attempts} recent scored attempt${weak.attempts === 1 ? '' : 's'} in this area` : 'More saved practice is needed';
      grid.innerHTML = `
        <article class="final-readiness-card">
          <span>Current Readiness</span>
          <strong>${this.escapeHtml(readinessLabel)}</strong>
          <small>${this.escapeHtml(readinessNote)}</small>
        </article>
        <article class="final-readiness-card final-readiness-trend" data-status="${this.escapeHtml(trend.status)}">
          <span>Trend</span>
          <strong>${this.escapeHtml(`${trend.icon} ${trend.label}`)}</strong>
          <small>Latest 3 vs previous 3 normal attempts</small>
        </article>
        <article class="final-readiness-card">
          <span>Latest Full Mock</span>
          <strong>${this.escapeHtml(this.mockLabel(subject))}</strong>
          <small>Shown separately from normal Practice</small>
        </article>
        <article class="final-readiness-card">
          <span>Today's Training</span>
          <strong>${tp === null ? '—' : `${this.escapeHtml(tp)} TP`}</strong>
          <small>Subject-specific Training Points today</small>
        </article>
        <article class="final-readiness-card" style="grid-column:1/-1">
          <span>Weakest Saved Area</span>
          <strong>${this.escapeHtml(weakLabel)}</strong>
          <small>${this.escapeHtml(weakNote)}</small>
        </article>`;
    },

    render() {
      if (typeof ProgressUIV2 === 'undefined' || !ProgressUIV2.installed) return false;
      this.ensureUI();
      const view = ProgressUIV2.activeView;
      if (view === 'overview') this.renderOverview();
      else if (this.subjects.includes(view)) this.renderSubject(view);
      return true;
    },

    patchNavigation() {
      if (!this.pagesPatched && typeof Pages !== 'undefined' && typeof Pages.show === 'function') {
        const originalShow = Pages.show.bind(Pages);
        Pages.show = page => {
          const result = originalShow(page);
          if (page === 'statistics') {
            window.setTimeout(() => this.render(), 20);
            window.setTimeout(() => this.render(), 240);
          }
          return result;
        };
        this.pagesPatched = true;
      }
      if (!this.progressViewPatched && typeof ProgressUIV2 !== 'undefined' && typeof ProgressUIV2.setView === 'function') {
        const originalSetView = ProgressUIV2.setView.bind(ProgressUIV2);
        ProgressUIV2.setView = view => {
          const result = originalSetView(view);
          window.setTimeout(() => this.render(), 0);
          return result;
        };
        this.progressViewPatched = true;
      }
    },

    install() {
      if (this.installed) {
        this.render();
        return true;
      }
      if (
        typeof Pages === 'undefined'
        || typeof Storage === 'undefined'
        || typeof ProgressUIV2 === 'undefined'
        || !ProgressUIV2.installed
        || !document.getElementById('statistics-page')
      ) return false;
      this.installed = true;
      this.patchNavigation();
      this.render();
      window.addEventListener('storage', () => this.render());
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.render();
      });
      this.refreshTimer = window.setInterval(() => {
        if (Pages.current === 'statistics') this.render();
      }, 60000);
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 600) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Final Exam Progress v2 could not initialize. Existing Progress remains available.');
        }
      }, 50);
    }
  };

  FinalExamProgressV2.boot();
})();