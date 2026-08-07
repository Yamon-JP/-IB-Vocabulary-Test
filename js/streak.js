const Streak = {
  data: {
    lastStudyDate: null,
    count: 0
  },

  load() {
    const saved = Storage.load('ib_streak');
    if (saved) this.data = saved;
    this.updateStudyStatus();
    this.render();
  },

  updateStudyStatus() {
    const today = new Date().toISOString().slice(0, 10);

    if (this.data.lastStudyDate === today) return;

    if (this.data.lastStudyDate) {
      const last = new Date(this.data.lastStudyDate);
      const now = new Date(today);
      const diff = Math.floor((now - last) / 86400000);

      if (diff === 1) {
        this.data.count++;
      } else if (diff > 1) {
        this.data.count = 1;
      }
    } else {
      this.data.count = 1;
    }

    this.data.lastStudyDate = today;
    Storage.save('ib_streak', this.data);
  },

  render() {
    const element = document.getElementById('streak');
    if (element) {
      const days = this.data.count;
      element.textContent = days === 1 ? `${days} day` : `${days} days`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Streak !== 'undefined') Streak.load();
});
