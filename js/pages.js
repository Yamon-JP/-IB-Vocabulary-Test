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

      // Keep the global bottom navigation visible on every page,
      // including Practice. Practice also has its dedicated Back button.
      document.body.classList.remove('practice-active');

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
