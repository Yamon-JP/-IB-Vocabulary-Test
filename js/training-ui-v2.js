(() => {
  const TrainingUIV2 = window.TrainingUIV2 = {
    installed: false,
    pagesPatched: false,
    observer: null,
    renderTimer: null,
    eventHandlersInstalled: false,

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    state() {
      return typeof App !== 'undefined' ? (App.state || {}) : {};
    },

    subject() {
      return String(this.state().subject || 'Choose a subject');
    },

    subjectTheme() {
      return ({
        'English B HL': 'english',
        'Biology SL': 'biology',
        'ESS HL': 'ess',
        'Math AI SL': 'math'
      })[this.subject()] || 'general';
    },

    realStartButton() {
      return document.querySelector('#selection-page .selection-actions .primary-action');
    },

    isVisible(element) {
      if (!element) return false;
      if (element.hidden) return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    },

    activeFullMock() {
      return [
        window.BiologyPaper1FullMock,
        window.BiologyPaper2FullMock,
        window.EssPaper1FullMock,
        window.EssPaper2FullMock,
        window.MathAISLFullMock
      ].find(module => Boolean(module?.active)) || null;
    },

    confirmFullMockExit() {
      const module = this.activeFullMock();
      if (!module) return true;
      if (!window.confirm('End the current Full Mock? Unsaved answers will be lost.')) return false;
      if (typeof module.stop === 'function') module.stop();
      return true;
    },

    isFullMock() {
      const activeMock = [
        window.BiologyPaper1FullMock,
        window.BiologyPaper2FullMock,
        window.EssPaper1FullMock,
        window.EssPaper2FullMock,
        window.MathAISLFullMock
      ].some(module => Boolean(module?.active));
      if (activeMock) return true;

      const startText = String(this.realStartButton()?.textContent || '').toLowerCase();
      if (/full\s*(mock|paper)|mock\s*exam/.test(startText)) return true;
      return [...document.querySelectorAll('#selection-page button.active')]
        .filter(button => this.isVisible(button))
        .some(button => /full\s*(mock|paper)|mock\s*exam/.test(String(button.textContent || '').toLowerCase()));
    },

    isExamMode() {
      return this.isFullMock() || this.state().practiceType !== 'vocabulary';
    },

    modeLabel() {
      const state = this.state();
      const subject = this.subject();
      const type = state.practiceType || 'vocabulary';
      let label = 'Practice';

      if (type === 'vocabulary') {
        label = 'Vocabulary & Quiz';
      } else if (type === 'paper1') {
        if (subject === 'English B HL') label = 'Paper 1 Writing';
        else if (subject === 'Biology SL') label = state.paper1Section === 'paper1b' ? 'Paper 1B' : 'Paper 1A';
        else label = 'Paper 1';
      } else if (type === 'paper2') {
        if (subject === 'English B HL') {
          label = state.englishBPaper2Mode === 'listening' ? 'Paper 2 Listening' : 'Paper 2 Reading';
        } else if (subject === 'Biology SL') {
          label = state.paper2Section === 'paper2b' ? 'Paper 2B' : 'Paper 2A';
        } else if (subject === 'ESS HL') {
          label = state.paper2Section === 'ess2b' ? 'Paper 2 · Section B' : 'Paper 2 · Section A';
        } else {
          label = 'Paper 2';
        }
      }

      if (this.isFullMock() && !/full mock/i.test(label)) {
        const paper = type === 'paper2' ? 'Paper 2' : type === 'paper1' ? 'Paper 1' : label;
        label = `${paper} · Full Mock`;
      }
      return label;
    },

    scopeLabel() {
      const state = this.state();
      if (this.isFullMock()) return 'Learned Content';
      if (state.practiceScope === 'selected') {
        const count = Array.isArray(state.selectedChapters) ? state.selectedChapters.length : 0;
        return count ? `${count} selected` : 'Select chapters';
      }
      return 'All Chapters';
    },

    coverageInfo() {
      const subject = this.subject();
      if (
        typeof CourseCoverage === 'undefined'
        || typeof CourseCoverage.getSelected !== 'function'
        || typeof CourseCoverage.getProvider !== 'function'
      ) return null;

      const provider = CourseCoverage.getProvider(subject);
      if (!provider) return null;
      if (typeof CourseCoverage.isVisible === 'function' && !CourseCoverage.isVisible(subject)) return null;
      const selected = CourseCoverage.getSelected(subject);
      const noun = String(provider.itemNoun || 'items');
      return `${selected.length} learned ${noun}`;
    },

    selectionSummary() {
      const coverage = this.coverageInfo();
      return [
        { label: 'SUBJECT', value: this.subject() },
        { label: 'MODE', value: this.modeLabel() },
        { label: 'SCOPE', value: this.scopeLabel() },
        ...(coverage ? [{ label: 'COVERAGE', value: coverage }] : [])
      ];
    },

    ensureSelectionBar() {
      const panel = document.querySelector('#selection-page .selection-panel');
      const heading = panel?.querySelector('.selection-heading');
      if (!panel || !heading) return null;
      let bar = document.getElementById('training-v2-setup-summary');
      if (bar) return bar;

      bar = document.createElement('section');
      bar.id = 'training-v2-setup-summary';
      bar.className = 'training-v2-setup-summary';
      bar.setAttribute('aria-label', 'Current training setup');
      bar.innerHTML = `
        <div id="training-v2-setup-items" class="training-v2-setup-items"></div>
        <button type="button" id="training-v2-start" class="training-v2-start">Start Practice →</button>`;
      heading.insertAdjacentElement('afterend', bar);

      bar.querySelector('#training-v2-start')?.addEventListener('click', () => {
        const real = this.realStartButton();
        if (real && !real.disabled) real.click();
      });
      return bar;
    },

    ensurePracticeSummary() {
      const header = document.querySelector('#practice-page .practice-header');
      if (!header) return null;
      let summary = document.getElementById('training-v2-practice-summary');
      if (summary) return summary;

      summary = document.createElement('section');
      summary.id = 'training-v2-practice-summary';
      summary.className = 'training-v2-practice-summary';
      summary.setAttribute('aria-label', 'Current practice session');
      summary.innerHTML = `
        <div class="training-v2-practice-main">
          <span id="training-v2-practice-subject" class="training-v2-practice-subject"></span>
          <strong id="training-v2-practice-mode"></strong>
        </div>
        <div id="training-v2-practice-meta" class="training-v2-practice-meta"></div>`;
      header.insertAdjacentElement('afterend', summary);
      return summary;
    },

    renderSelection() {
      const bar = this.ensureSelectionBar();
      if (!bar) return false;
      const page = document.getElementById('selection-page');
      const theme = this.subjectTheme();
      const items = bar.querySelector('#training-v2-setup-items');
      const start = bar.querySelector('#training-v2-start');
      const realStart = this.realStartButton();

      bar.dataset.subjectTheme = theme;
      if (page) page.dataset.subjectTheme = theme;

      if (items) {
        items.innerHTML = this.selectionSummary().map(item => `
          <div class="training-v2-setup-item">
            <span>${this.escapeHtml(item.label)}</span>
            <strong>${this.escapeHtml(item.value)}</strong>
          </div>`).join('');
      }
      if (start) {
        start.textContent = String(realStart?.textContent || 'Start Practice →').trim() || 'Start Practice →';
        start.disabled = Boolean(realStart?.disabled);
      }
      return true;
    },

    updatePracticeStatsContext() {
      const exam = this.isExamMode();
      const stats = document.querySelector('#practice-page .practice-mini-stats');
      if (stats) {
        stats.setAttribute('aria-label', exam ? 'Vocabulary quiz stats shown during exam training' : 'Vocabulary quiz practice stats');
        const labels = stats.querySelectorAll(':scope > div > span');
        const text = exam ? ['Quiz Questions', 'Quiz Accuracy', 'Quiz XP'] : ['Questions', 'Accuracy', 'XP'];
        labels.forEach((label, index) => {
          if (text[index]) label.textContent = text[index];
        });
      }

      const daily = document.getElementById('practice-daily-panel');
      if (!daily) return;
      const eyebrow = daily.querySelector('.practice-daily-eyebrow');
      const reset = daily.querySelector('.practice-daily-reset');
      const questions = daily.querySelector('#practice-daily-row-questions .practice-daily-row-copy span');
      const correct = daily.querySelector('#practice-daily-row-correct .practice-daily-row-copy span');
      const streak = daily.querySelector('#practice-daily-row-streak .practice-daily-row-copy span');

      if (eyebrow) eyebrow.textContent = exam ? 'VOCABULARY QUIZ MISSION' : "TODAY'S MISSION";
      if (reset) reset.textContent = exam ? 'Quiz only · resets daily' : 'Resets daily';
      if (questions) questions.textContent = exam ? '⚡ 100 Quiz Questions' : '⚡ 100 Questions';
      if (correct) correct.textContent = exam ? '🎯 75 Quiz Correct' : '🎯 75 Correct';
      if (streak) streak.textContent = exam ? '🔥 10 Quiz in a Row' : '🔥 10 in a Row';
      daily.setAttribute('aria-label', exam ? "Today's vocabulary quiz mission progress" : "Today's daily mission progress");
    },

    renderPractice() {
      const summary = this.ensurePracticeSummary();
      if (!summary) return false;
      const page = document.getElementById('practice-page');
      const theme = this.subjectTheme();
      const exam = this.isExamMode();
      const subject = summary.querySelector('#training-v2-practice-subject');
      const mode = summary.querySelector('#training-v2-practice-mode');
      const meta = summary.querySelector('#training-v2-practice-meta');
      const coverage = this.coverageInfo();

      summary.dataset.subjectTheme = theme;
      if (page) {
        page.dataset.subjectTheme = theme;
        page.dataset.trainingContext = exam ? 'exam' : 'vocabulary';
      }

      if (subject) subject.textContent = this.subject();
      if (mode) mode.textContent = this.modeLabel();
      if (meta) {
        const values = [this.scopeLabel(), coverage].filter(Boolean);
        meta.innerHTML = values.map(value => `<span>${this.escapeHtml(value)}</span>`).join('');
      }
      this.updatePracticeStatsContext();
      return true;
    },

    observe() {
      if (typeof MutationObserver === 'undefined') return;
      if (!this.observer) {
        this.observer = new MutationObserver(() => this.scheduleRender());
      }
      this.observer.disconnect();
      const root = document.getElementById('selection-page');
      if (!root) return;
      this.observer.observe(root, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'disabled']
      });
    },

    render() {
      if (!this.installed) return false;
      if (this.observer) this.observer.disconnect();
      const selectionReady = this.renderSelection();
      const practiceReady = this.renderPractice();
      if (selectionReady) document.getElementById('selection-page')?.classList.add('training-ui-v2-ready');
      if (practiceReady) document.getElementById('practice-page')?.classList.add('training-ui-v2-ready');
      this.observe();
      return selectionReady && practiceReady;
    },

    scheduleRender() {
      if (!this.installed) return;
      if (this.renderTimer) window.clearTimeout(this.renderTimer);
      this.renderTimer = window.setTimeout(() => {
        this.renderTimer = null;
        this.render();
      }, 20);
    },

    patchPages() {
      if (this.pagesPatched || typeof Pages === 'undefined' || typeof Pages.show !== 'function') return;
      const original = Pages.show.bind(Pages);
      const self = this;
      Pages.show = function(page) {
        if (page !== 'practice' && self.activeFullMock() && !self.confirmFullMockExit()) return false;
        const result = original(page);
        if (page === 'selection' || page === 'practice') window.setTimeout(() => self.render(), 0);
        return result;
      };
      this.pagesPatched = true;
    },

    installEventHandlers() {
      if (this.eventHandlersInstalled) return;
      const handler = event => {
        const practiceBack = event.target?.closest?.('#practice-page .back-button');
        const subjectChoice = event.target?.closest?.('#home-page .subject-card');
        if ((practiceBack || subjectChoice) && !this.confirmFullMockExit()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (event.target?.closest?.('#selection-page')) this.scheduleRender();
      };
      document.addEventListener('click', handler, true);
      document.addEventListener('change', handler, true);
      this.eventHandlersInstalled = true;
    },

    install() {
      if (this.installed) return true;
      if (
        typeof App === 'undefined'
        || typeof Pages === 'undefined'
        || !document.getElementById('selection-page')
        || !document.getElementById('practice-page')
      ) return false;

      this.installed = true;
      this.patchPages();
      this.installEventHandlers();
      const ready = this.render();
      if (!ready) {
        this.installed = false;
        document.getElementById('selection-page')?.classList.remove('training-ui-v2-ready');
        document.getElementById('practice-page')?.classList.remove('training-ui-v2-ready');
        return false;
      }
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 400) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Training UI v2 could not initialize. Existing Selection and Practice remain available.');
        }
      }, 50);
    }
  };

  TrainingUIV2.boot();
})();