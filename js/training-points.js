(() => {
  const TrainingPoints = window.TrainingPoints = {
    goal: 30,
    installed: false,
    refreshTimer: null,
    originalStorageSave: null,
    watchedKeys: new Set([
      'ib_daily',
      'ib_paper1_progress',
      'ib_paper2_progress',
      'ib_english_b_paper1_progress',
      'ib_english_b_paper2_reading_progress',
      'ib_english_b_paper2_listening_progress'
    ]),

    stores: [
      { key: 'ib_paper1_progress', subject: null },
      { key: 'ib_paper2_progress', subject: null },
      { key: 'ib_english_b_paper1_progress', subject: 'English B HL' },
      { key: 'ib_english_b_paper2_reading_progress', subject: 'English B HL' },
      { key: 'ib_english_b_paper2_listening_progress', subject: 'English B HL' }
    ],

    today() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    localDateKey(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    normalizeSubject(value, fallback = '') {
      const subject = String(value || fallback || '').trim();
      if (subject === 'Biology SL') return 'Biology SL';
      if (subject === 'English B HL') return 'English B HL';
      if (subject === 'ESS HL') return 'ESS HL';
      if (subject === 'Math AI SL') return 'Math AI SL';
      return null;
    },

    attemptTP(attempt) {
      const maxMarks = Number(attempt?.maxMarks);
      if (Number.isFinite(maxMarks) && maxMarks > 0) return maxMarks;
      const marks = Number(attempt?.marks);
      if (Number.isFinite(marks) && marks > 0) return marks;
      return 0;
    },

    loadAttempts(key) {
      if (typeof Storage === 'undefined') return [];
      const saved = Storage.load(key);
      return Array.isArray(saved?.attempts) ? saved.attempts : [];
    },

    attemptIdentity(attempt, storeKey, index) {
      if (attempt?.attemptId) return `${storeKey}:${attempt.attemptId}`;
      const parts = [
        storeKey,
        attempt?.sessionId || '',
        attempt?.questionId || attempt?.taskId || attempt?.setId || '',
        attempt?.assessmentTarget || attempt?.section || '',
        attempt?.createdAt || '',
        index
      ];
      return parts.join(':');
    },

    collectAttemptTP() {
      const today = this.today();
      const totals = {
        'Biology SL': 0,
        'English B HL': 0,
        'ESS HL': 0,
        'Math AI SL': 0
      };
      const seen = new Set();

      this.stores.forEach(store => {
        this.loadAttempts(store.key).forEach((attempt, index) => {
          if (this.localDateKey(attempt?.createdAt) !== today) return;
          const id = this.attemptIdentity(attempt, store.key, index);
          if (seen.has(id)) return;
          seen.add(id);

          const tp = this.attemptTP(attempt);
          if (!tp) return;
          const subject = this.normalizeSubject(attempt?.subject, store.subject);
          if (!subject) return;
          totals[subject] += tp;
        });
      });

      return totals;
    },

    vocabularyTP() {
      if (typeof Storage === 'undefined') return 0;
      const saved = Storage.load('ib_daily');
      if (!saved || saved.date !== this.today()) return 0;
      const questions = Number(saved.questions);
      return Number.isFinite(questions) && questions > 0 ? questions : 0;
    },

    summary() {
      const subjects = this.collectAttemptTP();
      const vocabulary = this.vocabularyTP();
      const total = Object.values(subjects).reduce((sum, value) => sum + value, 0) + vocabulary;
      return { total, vocabulary, subjects };
    },

    ensureStyles() {
      if (document.getElementById('training-points-styles')) return;
      const style = document.createElement('style');
      style.id = 'training-points-styles';
      style.textContent = `
        #overall-daily-training { margin: 18px 0 0; }
        .overall-daily-card {
          padding: 18px;
          border: 1px solid #e4e7ec;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(16, 24, 40, .06);
        }
        .overall-daily-card.complete { border-color: #a7d7b5; background: #f7fcf8; }
        .overall-daily-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .overall-daily-heading h3 { margin: 2px 0 4px; }
        .overall-daily-heading p { margin: 0; }
        .overall-daily-reset { color: #667085; font-size: .78rem; font-weight: 750; white-space: nowrap; }
        .overall-daily-score { display: flex; align-items: baseline; gap: 7px; margin: 18px 0 8px; }
        .overall-daily-score strong { font-size: 1.8rem; line-height: 1; }
        .overall-daily-score span { color: #667085; font-weight: 800; }
        .overall-daily-track { height: 10px; overflow: hidden; border-radius: 999px; background: #eaecf0; }
        .overall-daily-track span { display: block; width: 0; height: 100%; border-radius: inherit; background: currentColor; transition: width .25s ease; }
        .overall-daily-breakdown { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
        .overall-daily-chip { padding: 9px 8px; border: 1px solid #eaecf0; border-radius: 12px; background: #f9fafb; text-align: center; }
        .overall-daily-chip strong, .overall-daily-chip small { display: block; }
        .overall-daily-chip strong { font-size: .92rem; }
        .overall-daily-chip small { margin-top: 2px; color: #667085; font-size: .72rem; }
        .overall-daily-note { margin: 11px 0 0; color: #667085; font-size: .78rem; }
        @media (max-width: 720px) {
          .overall-daily-heading { flex-direction: column; gap: 5px; }
          .overall-daily-breakdown { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .overall-daily-chip:last-child { grid-column: 1 / -1; }
        }
      `;
      document.head.appendChild(style);
    },

    ensureUI() {
      if (document.getElementById('overall-daily-training')) return;
      const dashboard = document.querySelector('#home-page .home-dashboard');
      if (!dashboard) return;

      const section = document.createElement('section');
      section.id = 'overall-daily-training';
      section.setAttribute('aria-label', 'Overall daily training progress');
      section.innerHTML = `
        <article class="overall-daily-card">
          <div class="overall-daily-heading">
            <div>
              <p class="eyebrow">OVERALL DAILY TRAINING</p>
              <h3>Today's Training</h3>
              <p class="muted">All subjects and training modes count toward one daily target.</p>
            </div>
            <span class="overall-daily-reset">Resets daily</span>
          </div>
          <div class="overall-daily-score">
            <strong id="overall-daily-total">0 / ${this.goal} TP</strong>
            <span id="overall-daily-status">Start training</span>
          </div>
          <div class="overall-daily-track" role="progressbar" aria-valuemin="0" aria-valuemax="${this.goal}" aria-valuenow="0">
            <span id="overall-daily-bar"></span>
          </div>
          <div id="overall-daily-breakdown" class="overall-daily-breakdown"></div>
          <p class="overall-daily-note">1 TP = 1 mark worth of completed exam training. Vocabulary Quiz = 1 TP per answered question. TP measures training volume, not score.</p>
        </article>
      `;
      dashboard.insertAdjacentElement('afterend', section);
    },

    render() {
      this.ensureStyles();
      this.ensureUI();
      const panel = document.getElementById('overall-daily-training');
      if (!panel) return;

      const { total, vocabulary, subjects } = this.summary();
      const percentage = this.goal > 0 ? Math.min(100, Math.round((total / this.goal) * 100)) : 0;
      const complete = total >= this.goal;
      const card = panel.querySelector('.overall-daily-card');
      const totalElement = document.getElementById('overall-daily-total');
      const status = document.getElementById('overall-daily-status');
      const bar = document.getElementById('overall-daily-bar');
      const track = panel.querySelector('.overall-daily-track');
      const breakdown = document.getElementById('overall-daily-breakdown');

      if (card) card.classList.toggle('complete', complete);
      if (totalElement) totalElement.textContent = `${total} / ${this.goal} TP`;
      if (status) status.textContent = complete ? 'Daily target complete' : `${Math.max(0, this.goal - total)} TP to go`;
      if (bar) bar.style.width = `${percentage}%`;
      if (track) track.setAttribute('aria-valuenow', String(Math.min(total, this.goal)));

      if (breakdown) {
        const items = [
          ['Biology', subjects['Biology SL']],
          ['English B', subjects['English B HL']],
          ['ESS', subjects['ESS HL']],
          ['Math', subjects['Math AI SL']],
          ['Vocabulary', vocabulary]
        ];
        breakdown.innerHTML = items.map(([label, value]) => `
          <div class="overall-daily-chip">
            <strong>${this.escapeHtml(value)} TP</strong>
            <small>${this.escapeHtml(label)}</small>
          </div>
        `).join('');
      }
    },

    installStorageHook() {
      if (typeof Storage === 'undefined' || Storage.__trainingPointsHookInstalled) return;
      this.originalStorageSave = Storage.save.bind(Storage);
      Storage.save = (key, value) => {
        const result = this.originalStorageSave(key, value);
        if (this.watchedKeys.has(key)) window.setTimeout(() => this.render(), 0);
        return result;
      };
      Storage.__trainingPointsHookInstalled = true;
    },

    install() {
      if (this.installed) {
        this.render();
        return true;
      }
      if (typeof Storage === 'undefined' || !document.getElementById('home-page')) return false;
      this.installed = true;
      this.installStorageHook();
      this.render();
      window.addEventListener('storage', event => {
        if (!event.key || this.watchedKeys.has(event.key)) this.render();
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.render();
      });
      this.refreshTimer = window.setInterval(() => this.render(), 60000);
      return true;
    }
  };
})();
