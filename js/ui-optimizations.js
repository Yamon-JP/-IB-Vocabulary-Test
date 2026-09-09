const UIOptimizations = {
  installed: false,

  install() {
    if (this.installed) return;
    this.installed = true;

    this.ensureStyles();
    this.patchPages();
    this.patchQuiz();
    this.patchAchievements();
    this.applyAll();
  },

  ensureStyles() {
    if (document.getElementById('ui-optimizations-styles')) return;
    const link = document.createElement('link');
    link.id = 'ui-optimizations-styles';
    link.rel = 'stylesheet';
    link.href = 'css/ui-optimizations.css';
    document.head.appendChild(link);
  },

  patchPages() {
    if (typeof Pages === 'undefined' || Pages.__uiOptimizedShow) return;

    const originalShow = Pages.show;
    Pages.show = function(page) {
      const result = originalShow.call(this, page);
      UIOptimizations.updateNavigation(page);
      return result;
    };
    Pages.__uiOptimizedShow = true;
  },

  updateNavigation(page) {
    const labels = {
      home: 'Home',
      selection: 'Study',
      practice: 'Study',
      statistics: 'Progress',
      achievements: 'Trophies'
    };
    const activeLabel = labels[page] || null;

    document.querySelectorAll('.bottom-nav.navigation button').forEach(button => {
      const active = Boolean(activeLabel && button.getAttribute('aria-label') === activeLabel);
      button.classList.toggle('ui-nav-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  },

  patchQuiz() {
    if (typeof Quiz === 'undefined' || Quiz.__uiOptimizedRender) return;

    const originalRender = Quiz.render;
    Quiz.render = function(...args) {
      const result = originalRender.apply(this, args);
      UIOptimizations.updateVocabularyPrompt();
      return result;
    };
    Quiz.__uiOptimizedRender = true;
  },

  updateVocabularyPrompt() {
    if (typeof Quiz === 'undefined') return;

    const question = document.getElementById('quiz-question');
    if (question) {
      question.textContent = Quiz.mode === 'definition-word'
        ? 'Choose the matching term.'
        : 'Choose the correct definition.';
    }

    const promptLabel = document.querySelector('#vocabulary-practice-panel .prompt-label');
    if (promptLabel) {
      promptLabel.textContent = Quiz.mode === 'definition-word' ? 'DEFINITION' : 'TERM';
    }
  },

  patchAchievements() {
    if (typeof Achievements === 'undefined' || Achievements.__uiOptimizedRender) return;

    const originalRender = Achievements.render;
    Achievements.render = function(...args) {
      const result = originalRender.apply(this, args);
      UIOptimizations.optimizePracticeAchievements();
      return result;
    };
    Achievements.__uiOptimizedRender = true;
  },

  achievementProgress(card) {
    const value = card.querySelector('.achievement-progress-header strong')?.textContent || '';
    const match = value.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return { percent: 0, remaining: Number.MAX_SAFE_INTEGER, target: Number.MAX_SAFE_INTEGER };

    const current = Number(match[1]);
    const target = Math.max(1, Number(match[2]));
    return {
      percent: Math.min(100, (current / target) * 100),
      remaining: Math.max(0, target - current),
      target
    };
  },

  optimizePracticeAchievements() {
    const list = document.getElementById('practice-achievement-list');
    if (!list) return;

    const cards = [...list.querySelectorAll('.achievement-card')];
    if (!cards.length) return;

    const locked = cards
      .filter(card => !card.classList.contains('unlocked'))
      .map(card => ({ card, ...this.achievementProgress(card) }))
      .sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        if (a.remaining !== b.remaining) return a.remaining - b.remaining;
        return a.target - b.target;
      });

    const keep = locked.slice(0, 2).map(item => item.card);
    if (keep.length < 2) {
      const completed = cards.filter(card => card.classList.contains('unlocked'));
      keep.push(...completed.slice(-1 * (2 - keep.length)));
    }

    cards.forEach(card => {
      card.hidden = !keep.includes(card);
    });

    const heading = document.querySelector('#practice-achievements .compact-section-heading h3');
    const note = document.querySelector('#practice-achievements .compact-section-heading > .muted');
    if (heading) heading.textContent = locked.length ? 'Next Achievements' : 'Achievement Progress';
    if (note) note.textContent = locked.length ? 'Closest goals' : 'All complete';
  },

  applyAll() {
    const currentPage = typeof Pages !== 'undefined' ? Pages.current : 'home';
    this.updateNavigation(currentPage);
    this.updateVocabularyPrompt();
    this.optimizePracticeAchievements();
  }
};

UIOptimizations.install();
