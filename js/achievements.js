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

  newlyUnlocked: [],

  load() {
    const saved = Storage.load('ib_achievements');
    if (saved) this.data = saved;
    this.render();
  },

  check(progress) {
    const before = { ...this.data };

    this.data.firstPractice ||= progress.questions > 0;
    this.data.xp10 ||= progress.xp >= 10;
    this.data.xp100 ||= progress.xp >= 100;
    this.data.questions100 ||= progress.questions >= 100;

    this.newlyUnlocked = Object.keys(this.data).filter(
      key => this.data[key] && !before[key]
    );

    Storage.save('ib_achievements', this.data);
    this.render();
    this.showNotification();
  },

  showNotification() {
    if (!this.newlyUnlocked.length) return;

    const names = this.newlyUnlocked
      .map(key => this.definitions[key]?.title)
      .join(', ');

    let toast = document.getElementById('achievement-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.style.position = 'fixed';
      toast.style.top = '20px';
      toast.style.right = '20px';
      toast.style.padding = '15px';
      toast.style.borderRadius = '8px';
      toast.style.background = '#222';
      toast.style.color = '#fff';
      toast.style.zIndex = '9999';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `🏆 Achievement Unlocked!<br>${names}`;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);

    this.newlyUnlocked = [];
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
            <small>${unlocked ? 'Unlocked' : 'Locked'}</small>
          </article>`;
      })
      .join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Achievements !== 'undefined') Achievements.load();
});
