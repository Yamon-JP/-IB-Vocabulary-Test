const Achievements = {
  data: {
    firstPractice: false,
    xp10: false,
    xp100: false,
    questions100: false
  },

  load() {
    const saved = Storage.load('ib_achievements');
    if (saved) this.data = saved;
    this.render();
  },

  check(progress) {
    this.data.firstPractice ||= progress.questions > 0;
    this.data.xp10 ||= progress.xp >= 10;
    this.data.xp100 ||= progress.xp >= 100;
    this.data.questions100 ||= progress.questions >= 100;

    Storage.save('ib_achievements', this.data);
    this.render();
  },

  render() {
    const area = document.getElementById('achievement-list');
    if (!area) return;

    area.innerHTML = Object.entries(this.data)
      .map(([key, value]) => `<p>${value ? '🏆' : '🔒'} ${key}</p>`)
      .join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Achievements !== 'undefined') Achievements.load();
});
