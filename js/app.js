const App = {
  state: {
    currentPage: 'home',
    subject: null,
    user: {
      xp: 0,
      streak: 0
    }
  },

  init() {
    this.loadState();
    console.log('IB Master Trainer Version 1.0 initialized');
    UI.render(`Current Page: ${this.state.currentPage}`);
  },

  navigate(page) {
    this.state.currentPage = page;
    this.saveState();
    UI.render(`Navigate: ${page}`);
  },

  loadState() {
    const saved = Storage.load('ib_master_trainer_state');
    if (saved) {
      this.state = saved;
    }
  },

  saveState() {
    Storage.save('ib_master_trainer_state', this.state);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
