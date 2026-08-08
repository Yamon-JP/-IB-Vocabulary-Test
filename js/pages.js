const Pages = {
  current: 'home',

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
    this.show('home');
  }
};