const Storage = {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load(key) {
    const value = localStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn(`Saved data could not be read: ${key}`, error);
      return null;
    }
  }
};

(() => {
  if (document.getElementById('biology-final-training-script')) return;
  const script = document.createElement('script');
  script.id = 'biology-final-training-script';
  script.src = 'js/biology-final-training.js?v=4';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('ess-final-training-script')) return;
  const script = document.createElement('script');
  script.id = 'ess-final-training-script';
  script.src = 'js/ess-final-training.js?v=3';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('ess-final-training-2-script')) return;
  const script = document.createElement('script');
  script.id = 'ess-final-training-2-script';
  script.src = 'js/ess-final-training-2.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-loader-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-loader-script';
  script.src = 'js/math-ai-sl-loader.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-ui-guard-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-ui-guard-script';
  script.src = 'js/math-ai-sl-ui-guard.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-batch2-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-batch2-script';
  script.src = 'js/math-ai-sl-batch2.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-ai-sl-final-audit-script')) return;
  const script = document.createElement('script');
  script.id = 'math-ai-sl-final-audit-script';
  script.src = 'js/math-ai-sl-final-audit.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('v1-audit-fixes-script')) return;
  const script = document.createElement('script');
  script.id = 'v1-audit-fixes-script';
  script.src = 'js/v1-audit-fixes.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (document.getElementById('math-home-icon-script')) return;
  const script = document.createElement('script');
  script.id = 'math-home-icon-script';
  script.src = 'js/math-home-icon.js?v=1';
  document.head.appendChild(script);
})();

(() => {
  if (!document.getElementById('home-ui-v2-style')) {
    const link = document.createElement('link');
    link.id = 'home-ui-v2-style';
    link.rel = 'stylesheet';
    link.href = 'css/home-ui-v2.css?v=1';
    document.head.appendChild(link);
  }

  if (!document.getElementById('home-ui-v2-script')) {
    const script = document.createElement('script');
    script.id = 'home-ui-v2-script';
    script.src = 'js/home-ui-v2.js?v=1';
    document.head.appendChild(script);
  }
})();

(() => {
  if (!document.getElementById('progress-ui-v2-style')) {
    const link = document.createElement('link');
    link.id = 'progress-ui-v2-style';
    link.rel = 'stylesheet';
    link.href = 'css/progress-ui-v2.css?v=1';
    document.head.appendChild(link);
  }

  if (document.getElementById('progress-ui-v2-script')) return;
  const script = document.createElement('script');
  script.id = 'progress-ui-v2-script';
  script.src = 'js/progress-ui-v2.js?v=1';
  script.onload = () => {
    const ui = window.ProgressUIV2;
    if (!ui) return;

    ui.renderOverviewSummary = function() {
      const grid = document.getElementById('progress-v2-summary-grid');
      if (!grid || typeof Progress === 'undefined') return;
      const currentStreak = typeof DailyChallenge !== 'undefined' && typeof DailyChallenge.getCurrentMissionStreak === 'function'
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
          <strong>${ui.escapeHtml(value)}</strong>
          <small>${ui.escapeHtml(label)}</small>
        </article>`).join('');
    };

    [0, 120, 350, 800, 1500].forEach(delay => {
      window.setTimeout(() => ui.attachLegacyPanels(), delay);
    });
  };
  document.head.appendChild(script);
})();

(() => {
  if (!document.getElementById('trophy-ui-v2-style')) {
    const link = document.createElement('link');
    link.id = 'trophy-ui-v2-style';
    link.rel = 'stylesheet';
    link.href = 'css/trophy-ui-v2.css?v=1';
    document.head.appendChild(link);
  }

  if (!document.getElementById('trophy-ui-v2-script')) {
    const script = document.createElement('script');
    script.id = 'trophy-ui-v2-script';
    script.src = 'js/trophy-ui-v2.js?v=1';
    document.head.appendChild(script);
  }
})();

(() => {
  if (!document.getElementById('navigation-ui-v2-style')) {
    const link = document.createElement('link');
    link.id = 'navigation-ui-v2-style';
    link.rel = 'stylesheet';
    link.href = 'css/navigation-ui-v2.css?v=1';
    document.head.appendChild(link);
  }

  if (!document.getElementById('navigation-ui-v2-script')) {
    const script = document.createElement('script');
    script.id = 'navigation-ui-v2-script';
    script.src = 'js/navigation-ui-v2.js?v=1';
    document.head.appendChild(script);
  }
})();
