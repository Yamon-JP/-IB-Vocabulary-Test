const Pages = {
  current: 'home',

  ensureEssExamModule() {
    if (typeof EssExam !== 'undefined') {
      EssExam.init();
      return;
    }

    if (document.getElementById('ess-exam-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-exam-script';
    script.src = 'js/ess-exam.js';
    script.onload = () => {
      if (typeof EssExam !== 'undefined') EssExam.init();
    };
    script.onerror = () => {
      console.warn('ESS exam foundation module could not be loaded.');
    };
    document.body.appendChild(script);
  },

  ensureUIOptimizations() {
    if (typeof UIOptimizations !== 'undefined') {
      UIOptimizations.install();
      return;
    }

    if (document.getElementById('ui-optimizations-script')) return;

    const script = document.createElement('script');
    script.id = 'ui-optimizations-script';
    script.src = 'js/ui-optimizations.js';
    script.onerror = () => {
      console.warn('UI optimization layer could not be loaded.');
    };
    document.body.appendChild(script);
  },

  ensurePaper2ProgressView() {
    if (typeof Paper2ProgressView !== 'undefined') {
      Paper2ProgressView.render();
      return;
    }

    if (document.getElementById('paper2-progress-view-script')) return;

    const script = document.createElement('script');
    script.id = 'paper2-progress-view-script';
    script.src = 'js/paper2-progress-view.js';
    script.onload = () => {
      if (typeof Paper2ProgressView !== 'undefined') Paper2ProgressView.render();
    };
    script.onerror = () => {
      console.warn('Paper 2 progress view could not be loaded.');
    };
    document.body.appendChild(script);
  },

  show(page) {
    document.querySelectorAll('.page').forEach(section => {
      section.style.display = 'none';
    });

    const target = document.getElementById(`${page}-page`);
    if (target) {
      target.style.display = 'block';
      this.current = page;

      // Keep the global bottom navigation visible on every page,
      // including Practice. Practice also has its dedicated Back button.
      document.body.classList.remove('practice-active');

      // Refresh progress display after page becomes visible
      if (typeof Progress !== 'undefined') {
        Progress.render();
      }

      if (page === 'statistics') {
        this.ensurePaper2ProgressView();
      }
    }
  },

  init() {
    this.ensureEssExamModule();
    this.ensureUIOptimizations();
    this.show('home');
  }
};