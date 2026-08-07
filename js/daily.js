const DailyChallenge = {
  data: {
    date: null,
    questions: 0,
    bonusClaimed: false
  },

  goal: 10,
  bonusXP: 20,

  load() {
    const saved = Storage.load('ib_daily');
    const today = new Date().toISOString().slice(0, 10);

    if (saved && saved.date === today) {
      this.data = saved;
    } else {
      this.data = {
        date: today,
        questions: 0,
        bonusClaimed: false
      };
      this.save();
    }

    this.render();
  },

  recordQuestion() {
    this.data.questions++;

    if (this.data.questions >= this.goal && !this.data.bonusClaimed) {
      this.data.bonusClaimed = true;
      Progress.data.xp += this.bonusXP;
      Storage.save('ib_progress', Progress.data);
      this.showBonus();
    }

    this.save();
    this.render();
  },

  save() {
    Storage.save('ib_daily', this.data);
  },

  showBonus() {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.textContent = `🎯 Daily Challenge Complete! +${this.bonusXP} XP`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  },

  render() {
    const element = document.getElementById('daily-progress');
    if (element) {
      element.textContent = `${this.data.questions}/${this.goal}`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DailyChallenge !== 'undefined') DailyChallenge.load();
});
