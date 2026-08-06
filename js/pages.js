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
