const Streak = {
  data: {
    lastStudyDate: null,
    count: 0
  },

  today() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  dateIndex(key) {
    const [year, month, day] = String(key || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  },

  load() {
    const saved = Storage.load('ib_streak');
    if (saved) this.data = saved;
    this.updateStudyStatus();
    this.render();
  },

  updateStudyStatus() {
    const today = this.today();

    if (this.data.lastStudyDate === today) return;

    if (this.data.lastStudyDate) {
      const last = this.dateIndex(this.data.lastStudyDate);
      const now = this.dateIndex(today);
      const diff = Number.isFinite(last) && Number.isFinite(now) ? now - last : null;

      if (diff === 1) {
        this.data.count++;
      } else if (diff === null || diff > 1 || diff < 0) {
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
