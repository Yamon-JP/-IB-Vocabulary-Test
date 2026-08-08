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
    accuracy200: false,
    chapterAchievements: {}
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

  chapterDefinitions: {
    starter: { title: 'Chapter Starter', targetQuestions: 10, targetAccuracy: 0, description: 'Answer 10 questions in a chapter' },
    learner: { title: 'Chapter Learner', targetQuestions: 30, targetAccuracy: 70, description: 'Answer 30 questions with at least 70% accuracy' },
    master: { title: 'Chapter Master', targetQuestions: 50, targetAccuracy: 85, description: 'Answer 50 questions with at least 85% accuracy' },
    expert: { title: 'Chapter Expert', targetQuestions: 100, targetAccuracy: 90, description: 'Answer 100 questions with at least 90% accuracy' }
  },

  newlyUnlocked: [],
  notificationTimer: null,

  load() {
    const saved = Storage.load('ib_achievements');
    if (saved) {
      this.data = {
        ...this.data,
        ...saved,
        chapterAchievements: saved.chapterAchievements || {}
      };
    }
    this.render();
  },

  check(progress) {
    const before = {
      ...this.data,
      chapterAchievements: JSON.parse(JSON.stringify(this.data.chapterAchievements || {}))
    };

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

    this.checkChapterAchievements(progress);

    const newlyUnlockedGlobal = Object.keys(this.definitions)
      .filter(key => this.data[key] && !before[key])
      .map(key => ({ type: 'global', key, title: this.definitions[key].title }));

    const newlyUnlockedChapter = [];
    Object.entries(this.data.chapterAchievements || {}).forEach(([subject, chapters]) => {
      Object.entries(chapters || {}).forEach(([chapter, achievements]) => {
        Object.keys(this.chapterDefinitions).forEach(key => {
          if (achievements[key] && !before.chapterAchievements?.[subject]?.[chapter]?.[key]) {
            newlyUnlockedChapter.push({
              type: 'chapter',
              key,
              title: this.chapterDefinitions[key].title,
              subject,
              chapter
            });
          }
        });
      });
    });

    this.newlyUnlocked = [...newlyUnlockedGlobal, ...newlyUnlockedChapter];

    Storage.save('ib_achievements', this.data);
    this.render();
    this.showNotification();
  },

  checkChapterAchievements(progress) {
    const chapterStats = progress?.chapterStats || {};

    Object.entries(chapterStats).forEach(([subject, chapters]) => {
      if (!this.data.chapterAchievements[subject]) this.data.chapterAchievements[subject] = {};

      Object.entries(chapters).forEach(([chapter, stats]) => {
        if (!this.data.chapterAchievements[subject][chapter]) {
          this.data.chapterAchievements[subject][chapter] = {};
        }

        const questions = stats.questions || 0;
        const accuracy = questions > 0 ? (stats.correct / questions) * 100 : 0;
        const earned = this.data.chapterAchievements[subject][chapter];

        Object.entries(this.chapterDefinitions).forEach(([key, definition]) => {
          if (earned[key]) return;
          const questionRequirementMet = questions >= definition.targetQuestions;
          const accuracyRequirementMet = accuracy >= definition.targetAccuracy;
          if (questionRequirementMet && accuracyRequirementMet) earned[key] = true;
        });
      });
    });
  },

  getChapterProgress(subject, chapter, progress = Progress.data) {
    const stats = progress?.chapterStats?.[subject]?.[chapter] || { questions: 0, correct: 0 };
    const accuracy = stats.questions > 0 ? Math.round((stats.correct / stats.questions) * 100) : 0;
    const achievements = this.data.chapterAchievements?.[subject]?.[chapter] || {};
    return { ...stats, accuracy, achievements };
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

    const globalNames = this.newlyUnlocked
      .filter(item => item.type === 'global')
      .map(item => item.title);

    const chapterItems = this.newlyUnlocked.filter(item => item.type === 'chapter');
    const lines = [];

    if (globalNames.length) lines.push(globalNames.join(' · '));
    chapterItems.forEach(item => lines.push(`${item.title} — ${item.subject} / ${item.chapter}`));

    let toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.innerHTML = `🏆 Achievement Unlocked!<br><span>${lines.join('<br>')}</span>`;
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

    const chapterHtml = Object.entries(progress.chapterStats || {}).map(([subject, chapters]) => {
      const chapterCards = Object.entries(chapters).map(([chapter, stats]) => {
        const current = this.getChapterProgress(subject, chapter, progress);
        const achievementCards = Object.entries(this.chapterDefinitions).map(([key, definition]) => {
          const unlocked = Boolean(current.achievements[key]);
          const percent = definition.targetAccuracy > 0
            ? Math.min(100, Math.round(Math.min(current.questions / definition.targetQuestions, 1) * 50 + Math.min(current.accuracy / definition.targetAccuracy, 1) * 50))
            : Math.min(100, Math.round((current.questions / definition.targetQuestions) * 100));
          return `<div class="chapter-achievement ${unlocked ? 'unlocked' : 'locked'}"><strong>${unlocked ? '🏆' : '🔒'} ${definition.title}</strong><span>${current.questions}/${definition.targetQuestions} · ${current.accuracy}%</span><small>${definition.description}</small><div class="achievement-progress-track"><span style="width:${percent}%"></span></div></div>`;
        }).join('');
        return `<article class="chapter-progress-card"><h4>${subject} — ${chapter}</h4><p><strong>${current.accuracy}%</strong> · ${current.correct}/${current.questions} correct</p>${achievementCards}</article>`;
      }).join('');
      return `<section class="chapter-progress-subject"><h3>${subject}</h3>${chapterCards}</section>`;
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

    if (fullArea) fullArea.innerHTML = fullHtml + (chapterHtml || '<p class="muted">No chapter achievements yet.</p>');
    if (practiceArea) practiceArea.innerHTML = practiceHtml;

    const chapterProgressArea = document.getElementById('chapter-progress-list');
    if (chapterProgressArea) chapterProgressArea.innerHTML = chapterHtml || '<p class="muted">No chapter progress yet.</p>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Achievements !== 'undefined') Achievements.load();
});
