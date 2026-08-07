const Achievements = {
  data: {
    firstPractice: false,
    xp10: false,
    xp100: false,
    questions100: false
  },

  definitions: {
    firstPractice: { title: 'First Practice', description: 'Complete your first practice question' },
    xp10: { title: '10 XP Master', description: 'Earn your first 10 XP' },
    xp100: { title: '100 XP Learner', description: 'Reach 100 XP' },
    questions100: { title: '100 Questions', description: 'Complete 100 practice questions' }
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

    area.innerHTML = Object.entries(this.definitions)
      .map(([key, item]) => {
        const unlocked = this.data[key];
        return `
          <article class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
            <h3>${unlocked ? '🏆' : '🔒'} ${item.title}</h3>
            <p>${item.description}</p>
          </article>`;
      })
      .join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Achievements !== 'undefined') Achievements.load();
});
