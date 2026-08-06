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
    }
  },

  init() {
    this.show('home');
  }
};
