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
    if (typeof Pages !== 'undefined') {
      Pages.init();
    }
  },

  navigate(page) {
    this.state.currentPage = page;
    this.saveState();
    if (typeof Pages !== 'undefined') {
      Pages.show(page);
    }
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
