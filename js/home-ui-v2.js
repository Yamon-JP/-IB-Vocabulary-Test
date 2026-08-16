(() => {
  const HomeUIV2 = window.HomeUIV2 = {
    installed: false,
    pagesPatched: false,
    dailyPatched: false,

    subjectClass(subject) {
      return ({
        'English B HL': 'english',
        'Biology SL': 'biology',
        'ESS HL': 'ess',
        'Math AI SL': 'math'
      })[subject] || 'general';
    },

    practiceLabel(state = {}) {
      if (state.practiceType === 'vocabulary') return 'Vocabulary';
      if (state.practiceType === 'paper1') {
        if (state.subject === 'Biology SL') return state.paper1Section === 'paper1b' ? 'Paper 1B' : 'Paper 1A';
        return 'Paper 1';
      }
      if (state.practiceType === 'paper2') {
        if (state.subject === 'Biology SL') return state.paper2Section === 'paper2b' ? 'Paper 2B' : 'Paper 2A';
        if (state.subject === 'ESS HL') return state.paper2Section === 'ess2b' ? 'Paper 2B' : 'Paper 2A';
        return 'Paper 2';
      }
      return 'Training';
    },

    greeting() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good morning. Ready to train?';
      if (hour < 18) return 'Good afternoon. Ready to train?';
      return 'Good evening. Ready to train?';
    },

    restructure() {
      const home = document.getElementById('home-page');
      const dashboard = home?.querySelector('.home-dashboard');
      const subjectSection = home?.querySelector('.subject-section');
      const missionDeck = dashboard?.querySelector('.mission-deck');
      const statsGrid = dashboard?.querySelector('.home-stat-grid');
      if (!home || !dashboard || !subjectSection || !missionDeck || !statsGrid) return false;
      if (home.dataset.homeUiV2 === 'ready') return true;

      home.dataset.homeUiV2 = 'ready';
      home.classList.add('home-ui-v2');
      dashboard.classList.add('home-ui-v2-dashboard');

      const topLine = dashboard.querySelector('.mission-topline');
      const heading = topLine?.querySelector('h2');
      const streakPill = topLine?.querySelector('.streak-pill');
      if (heading) {
        heading.id = 'home-greeting-heading';
        heading.textContent = this.greeting();
      }
      if (topLine && streakPill) {
        const status = document.createElement('div');
        status.className = 'home-status-pills';
        streakPill.parentNode.insertBefore(status, streakPill);
        status.appendChild(streakPill);
        const xpPill = document.createElement('div');
        xpPill.className = 'home-xp-pill';
        xpPill.innerHTML = '<span aria-hidden="true">⚡</span><strong id="home-xp-summary">0</strong><small>XP</small>';
        status.appendChild(xpPill);
      }

      const compactMission = document.createElement('section');
      compactMission.className = 'home-compact-mission';
      compactMission.setAttribute('aria-label', 'Daily Mission summary');
      compactMission.innerHTML = `
        <div class="home-compact-mission-copy">
          <span>Daily Missions</span>
          <strong id="home-mission-count">0 / 3</strong>
        </div>
        <div class="home-compact-mission-track" aria-hidden="true"><span id="home-mission-bar"></span></div>
        <strong id="home-mission-state" class="home-mission-state">Start today's missions</strong>`;
      missionDeck.parentNode.insertBefore(compactMission, missionDeck);

      const continueCard = document.createElement('section');
      continueCard.className = 'home-continue-card';
      continueCard.innerHTML = `
        <div class="home-continue-copy">
          <span class="home-continue-kicker">NEXT SESSION</span>
          <strong id="home-continue-title">Choose your first subject</strong>
          <small id="home-continue-meta">Start a focused training session.</small>
        </div>
        <button type="button" id="home-continue-button" class="home-continue-button">Choose Subject →</button>`;
      compactMission.insertAdjacentElement('afterend', continueCard);

      const details = document.createElement('details');
      details.className = 'home-mission-details';
      details.innerHTML = '<summary><span>Daily Mission details</span><small>View all 3</small></summary>';
      missionDeck.parentNode.insertBefore(details, missionDeck);
      details.appendChild(missionDeck);

      const focusSection = document.createElement('section');
      focusSection.id = 'home-focus-next';
      focusSection.className = 'home-focus-section';
      focusSection.innerHTML = `
        <div class="home-section-title">
          <div><p class="eyebrow">FOCUS NEXT</p><h2>Recommended focus</h2></div>
          <span>Based on quiz history</span>
        </div>
        <article id="home-focus-card" class="home-focus-card is-empty">
          <div class="home-focus-icon" aria-hidden="true">◎</div>
          <div class="home-focus-copy">
            <span id="home-focus-subject">Build your history</span>
            <strong id="home-focus-chapter">Complete some practice to reveal your focus area.</strong>
            <small id="home-focus-reason">Your lowest chapter accuracy will appear here.</small>
          </div>
          <button type="button" id="home-focus-button" disabled>Practice →</button>
        </article>`;
      subjectSection.parentNode.insertBefore(focusSection, subjectSection);

      const subjectEyebrow = subjectSection.querySelector('.eyebrow');
      const subjectNote = subjectSection.querySelector('.section-note');
      if (subjectEyebrow) subjectEyebrow.textContent = 'TRAIN BY SUBJECT';
      if (subjectNote) subjectNote.textContent = 'Choose a subject for Final Exam Training or focused practice.';

      const overall = document.createElement('section');
      overall.className = 'home-overall-section';
      overall.innerHTML = `
        <div class="home-section-title compact">
          <div><p class="eyebrow">YOUR TRAINING</p><h2>Overall</h2></div>
          <span>Quiz + exam activity</span>
        </div>`;
      subjectSection.insertAdjacentElement('afterend', overall);
      overall.appendChild(statsGrid);

      document.getElementById('home-continue-button')?.addEventListener('click', () => {
        if (typeof App === 'undefined') return;
        if (App.state?.subject) {
          App.openPractice();
          return;
        }
        subjectSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => document.querySelector('#subject-list .subject-card:not(:disabled)')?.focus(), 350);
      });

      document.getElementById('home-focus-button')?.addEventListener('click', () => {
        const button = document.getElementById('home-focus-button');
        const subject = button?.dataset.subject;
        if (!subject || typeof App === 'undefined') return;
        App.selectSubject(subject);
      });

      return true;
    },

    updateMission() {
      if (typeof DailyChallenge === 'undefined') return;
      const claimed = DailyChallenge.data?.claimed || {};
      const completed = Object.values(claimed).filter(Boolean).length;
      const count = document.getElementById('home-mission-count');
      const bar = document.getElementById('home-mission-bar');
      const state = document.getElementById('home-mission-state');
      if (count) count.textContent = `${completed} / 3`;
      if (bar) bar.style.width = `${Math.round(completed / 3 * 100)}%`;
      if (state) {
        state.classList.toggle('secured', completed >= 2);
        state.classList.toggle('complete', completed === 3);
        state.textContent = completed === 3
          ? '✓ Daily set complete'
          : completed >= 2
            ? '🔥 Streak secured!'
            : completed === 1
              ? 'One complete. Keep going.'
              : 'Start today’s missions';
      }
    },

    updateContinue() {
      if (typeof App === 'undefined') return;
      const title = document.getElementById('home-continue-title');
      const meta = document.getElementById('home-continue-meta');
      const button = document.getElementById('home-continue-button');
      const state = App.state || {};
      if (!title || !meta || !button) return;

      if (!state.subject) {
        title.textContent = 'Choose your first subject';
        meta.textContent = 'Start a focused training session.';
        button.textContent = 'Choose Subject →';
        return;
      }

      title.textContent = 'Continue Training';
      meta.textContent = `${state.subject} · ${this.practiceLabel(state)}`;
      button.textContent = 'Continue →';
    },

    updateFocus() {
      const card = document.getElementById('home-focus-card');
      const subjectEl = document.getElementById('home-focus-subject');
      const chapterEl = document.getElementById('home-focus-chapter');
      const reasonEl = document.getElementById('home-focus-reason');
      const button = document.getElementById('home-focus-button');
      if (!card || !subjectEl || !chapterEl || !reasonEl || !button || typeof Progress === 'undefined') return;

      const candidates = [];
      Object.entries(Progress.data?.chapterStats || {}).forEach(([subject, chapters]) => {
        Object.entries(chapters || {}).forEach(([chapter, stats]) => {
          const questions = Number(stats?.questions || 0);
          const correct = Number(stats?.correct || 0);
          if (questions < 5) return;
          candidates.push({ subject, chapter, questions, accuracy: Math.round(correct / questions * 100) });
        });
      });
      candidates.sort((a, b) => a.accuracy - b.accuracy || b.questions - a.questions || a.chapter.localeCompare(b.chapter));
      const focus = candidates[0];

      card.className = 'home-focus-card';
      if (!focus) {
        card.classList.add('is-empty');
        card.removeAttribute('data-subject-theme');
        subjectEl.textContent = 'Build your history';
        chapterEl.textContent = 'Complete some practice to reveal your focus area.';
        reasonEl.textContent = 'At least 5 quiz questions in a chapter are used for this recommendation.';
        button.disabled = true;
        delete button.dataset.subject;
        return;
      }

      card.dataset.subjectTheme = this.subjectClass(focus.subject);
      subjectEl.textContent = focus.subject;
      chapterEl.textContent = focus.chapter;
      reasonEl.textContent = `${focus.accuracy}% accuracy · ${focus.questions} quiz questions`;
      button.disabled = false;
      button.dataset.subject = focus.subject;
    },

    updateStats() {
      const xp = document.getElementById('home-xp-summary');
      if (xp && typeof Progress !== 'undefined') xp.textContent = String(Number(Progress.data?.xp || 0));
    },

    render() {
      if (!this.restructure()) return false;
      const heading = document.getElementById('home-greeting-heading');
      if (heading) heading.textContent = this.greeting();
      this.updateMission();
      this.updateContinue();
      this.updateFocus();
      this.updateStats();
      return true;
    },

    patchPages() {
      if (this.pagesPatched || typeof Pages === 'undefined') return;
      const original = Pages.show.bind(Pages);
      const self = this;
      Pages.show = function(page) {
        const result = original(page);
        if (page === 'home') window.setTimeout(() => self.render(), 0);
        return result;
      };
      this.pagesPatched = true;
    },

    patchDaily() {
      if (this.dailyPatched || typeof DailyChallenge === 'undefined') return;
      const original = DailyChallenge.render.bind(DailyChallenge);
      const self = this;
      DailyChallenge.render = function(...args) {
        const result = original(...args);
        window.setTimeout(() => self.render(), 0);
        return result;
      };
      this.dailyPatched = true;
    },

    install() {
      if (this.installed) return true;
      if (
        typeof App === 'undefined'
        || typeof Pages === 'undefined'
        || typeof DailyChallenge === 'undefined'
        || typeof Progress === 'undefined'
        || !document.getElementById('home-page')
      ) return false;

      if (!this.restructure()) return false;
      this.patchPages();
      this.patchDaily();
      this.installed = true;
      this.render();
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 400) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Home UI v2 could not initialize. Existing Home remains available.');
        }
      }, 50);
    }
  };

  HomeUIV2.boot();
})();
