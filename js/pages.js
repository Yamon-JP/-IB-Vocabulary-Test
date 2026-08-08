const Pages = {
  current: 'home',

  show(page) {
    document.querySelectorAll('.page').forEach(section => {
      section.style.display = 'none';
    });

    const target = document.getElementById(`${page}-page`);
    if (target) {
      target.style.display = 'block';
      this.current = page;

      // Practice has its own Back button, so hide the global bottom navigation
      // while the learner is answering a question.
      document.body.classList.toggle('practice-active', page === 'practice');

      // Refresh progress display after page becomes visible
      if (typeof Progress !== 'undefined') {
        Progress.render();
      }
    }
  },

  init() {
    this.show('home');
  }
};
