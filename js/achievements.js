const Achievements = {
  data: {
    firstPractice: false,
    xp10: false,
    xp100: false,
    questions100: false,
    streak3: false,
    streak7: false,
    streak30: false,
    accuracy10: false,
    accuracy50: false,
    accuracy100: false,
    accuracy200: false
  },

  definitions: {
    firstPractice: { title: 'First Practice', description: 'Complete your first practice question', target: 1, type: 'questions' },
    xp10: { title: '10 XP Master', description: 'Earn your first 10 XP', target: 10, type: 'xp' },
    xp100: { title: '100 XP Learner', description: 'Reach 100 XP', target: 100, type: 'xp' },
    questions100: { title: '100 Questions', description: 'Complete 100 practice questions', target: 100, type: 'questions' },
    streak3: { title: 'First Streak', description: 'Study for 3 consecutive days', target: 3, type: 'streak' },
    streak7: { title: 'Weekly Warrior', description: 'Study for 7 consecutive days', target: 7, type: 'streak' },
    streak30: { title: 'Monthly Master', description: 'Study for 30 consecutive days', target: 30, type: 'streak' },
    accuracy10: { title: 'Sharp Learner', description: '10 correct answers in a row', target: 10, type: 'correctStreak' },
    accuracy50: { title: 'Precision Student', description: '50 correct answers in a row', target: 50, type: 'correctStreak' },
    accuracy100: { title: 'IB Accuracy Master', description: '100 correct answers in a row', target: 100, type: 'correctStreak' },
    accuracy200: { title: 'Perfect Streak', description: '200 correct answers in a row', target: 200, type: 'correctStreak' }
  },

  newlyUnlocked: [],
  notificationTimer: null,

  load() {
    const saved = Storage.load('ib_achievements');
    if (saved) this.data = { ...this.data, ...saved };
    this.render();
  },

  check(progress) {
    const before = { ...this.data };

    this.data.firstPractice ||= progress.questions > 0;
    this.data.xp10 ||= progress.xp >= 10;
    this.data.xp100 ||= progress.xp >= 100;
    this.data.questions100 ||= progress.questions >= 100;

    const streak = typeof Streak !== 'undefined' ? Streak.data.count : 0;
    this.data.streak3 ||= streak >= 3;
    this.data.streak7 ||= streak >= 7;
    this.data.streak30 ||= streak >= 30;

    const correctStreak = progress.correctStreak || 0;
    this.data.accuracy10 ||= correctStreak >= 10;
    this.data.accuracy50 ||= correctStreak >= 50;
    this.data.accuracy100 ||= correctStreak >= 100;
    this.data.accuracy200 ||= correctStreak >= 200;

    this.newlyUnlocked = Object.keys(this.data).filter(key => this.data[key] && !before[key]);

    Storage.save('ib_achievements', this.data);
    this.render();
    this.showNotification();
  },

  getProgress(item, progress) {
    const current = {
      questions: progress?.questions || 0,
      xp: progress?.xp || 0,
      streak: typeof Streak !== 'undefined' ? (Streak.data.count || 0) : 0,
      correctStreak: progress?.correctStreak || 0
    };
    return Math.min(current[item.type] || 0, item.target);
  },

  showNotification() {
    if (!this.newlyUnlocked.length) return;

    const names = this.newlyUnlocked
      .map(key => this.definitions[key]?.title)
      .filter(Boolean)
      .join(' · ');

    let toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.innerHTML = `🏆 Achievement Unlocked!<br><span>${names}</span>`;
    toast.style.display = 'block';

    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      toast.style.display = 'none';
      this.notificationTimer = null;
    }, 3000);

    this.newlyUnlocked = [];
  },

  render() {
    const progress = typeof Progress !== 'undefined' ? Progress.data : {};
    const fullArea = document.getElementById('achievement-list');
    const practiceArea = document.getElementById('practice-achievement-list');

    const fullHtml = Object.entries(this.definitions).map(([key, item]) => {
      const unlocked = Boolean(this.data[key]);
      return `
        <article class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
          <h3>${unlocked ? '🏆' : '🔒'} ${item.title}</h3>
          <p>${item.description}</p>
          <small>${unlocked ? 'Unlocked' : 'Locked'}</small>
        </article>`;
    }).join('');

    const practiceHtml = Object.entries(this.definitions).map(([key, item]) => {
      const unlocked = Boolean(this.data[key]);
      const current = this.getProgress(item, progress);
      const percent = Math.round((current / item.target) * 100);
      return `
        <article class="achievement-card achievement-progress-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-progress-header">
            <h3>${item.title}</h3>
            <strong>${current}/${item.target}</strong>
          </div>
          <div class="achievement-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${item.target}" aria-valuenow="${current}">
            <span style="width:${percent}%"></span>
          </div>
          <small>${unlocked ? 'Completed' : item.description}</small>
        </article>`;
    }).join('');

    if (fullArea) fullArea.innerHTML = fullHtml;
    if (practiceArea) practiceArea.innerHTML = practiceHtml;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Achievements !== 'undefined') Achievements.load();
});
