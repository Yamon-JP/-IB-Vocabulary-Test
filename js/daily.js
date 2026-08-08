const DailyChallenge = {
  data: {
    date: null,
    questions: 0,
    correctAnswers: 0,
    currentCorrectStreak: 0,
    bestCorrectStreak: 0,
    claimed: { questions: false, correct: false, streak: false }
  },

  missions: {
    questions: { goal: 100, bonusXP: 50 },
    correct: { goal: 75, bonusXP: 30 },
    streak: { goal: 10, bonusXP: 20 }
  },

  today() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  freshData(date = this.today()) {
    return {
      date,
      questions: 0,
      correctAnswers: 0,
      currentCorrectStreak: 0,
      bestCorrectStreak: 0,
      claimed: { questions: false, correct: false, streak: false }
    };
  },

  normalize(saved, today) {
    if (!saved || saved.date !== today) return this.freshData(today);

    return {
      date: today,
      questions: saved.questions || 0,
      correctAnswers: saved.correctAnswers || 0,
      currentCorrectStreak: saved.currentCorrectStreak || 0,
      bestCorrectStreak: saved.bestCorrectStreak || 0,
      claimed: {
        questions: Boolean(saved.claimed?.questions && (saved.questions || 0) >= this.missions.questions.goal),
        correct: Boolean(saved.claimed?.correct),
        streak: Boolean(saved.claimed?.streak)
      }
    };
  },

  load() {
    const today = this.today();
    this.data = this.normalize(Storage.load('ib_daily'), today);
    this.save();
    this.render();
  },

  recordQuestion(correct = false) {
    this.data.questions++;

    if (correct) {
      this.data.correctAnswers++;
      this.data.currentCorrectStreak++;
      this.data.bestCorrectStreak = Math.max(this.data.bestCorrectStreak, this.data.currentCorrectStreak);
    } else {
      this.data.currentCorrectStreak = 0;
    }

    this.checkMissions();
    this.save();
    this.render();
  },

  missionValue(key) {
    if (key === 'questions') return this.data.questions;
    if (key === 'correct') return this.data.correctAnswers;
    if (key === 'streak') return this.data.bestCorrectStreak;
    return 0;
  },

  checkMissions() {
    Object.entries(this.missions).forEach(([key, mission]) => {
      if (this.data.claimed[key]) return;
      if (this.missionValue(key) < mission.goal) return;

      this.data.claimed[key] = true;
      this.awardBonus(key, mission.bonusXP);
    });
  },

  awardBonus(key, bonusXP) {
    if (typeof Progress !== 'undefined') {
      Progress.data.xp += bonusXP;
      Storage.save('ib_progress', Progress.data);
      Progress.render();

      if (typeof Achievements !== 'undefined') {
        Achievements.check(Progress.data);
      }
    }

    this.showBonus(key, bonusXP);
  },

  save() {
    Storage.save('ib_daily', this.data);
  },

  showBonus(key, bonusXP) {
    const labels = {
      questions: '100 Questions',
      correct: '75 Correct',
      streak: '10 in a Row'
    };

    let toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = `🎯 Mission Complete: ${labels[key]} · +${bonusXP} XP`;
    toast.style.display = 'block';
    setTimeout(() => { if (toast) toast.style.display = 'none'; }, 3000);

    const card = document.getElementById(`daily-mission-${key}`);
    if (card) {
      card.classList.remove('just-completed');
      void card.offsetWidth;
      card.classList.add('just-completed');
      setTimeout(() => card.classList.remove('just-completed'), 350);
    }
  },

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  },

  setProgress(key, current, goal) {
    const bar = document.getElementById(`daily-${key}-bar`);
    if (bar) bar.style.width = `${Math.min(100, Math.round((current / goal) * 100))}%`;
  },

  renderMission(key, progressId, statusId, defaultStatus) {
    const mission = this.missions[key];
    const current = this.missionValue(key);
    const complete = Boolean(this.data.claimed[key]);
    const displayCurrent = Math.min(current, mission.goal);

    this.setText(progressId, `${displayCurrent}/${mission.goal}`);
    this.setText(statusId, complete ? `Complete · +${mission.bonusXP} XP` : defaultStatus);
    this.setProgress(key === 'questions' ? 'questions' : key, current, mission.goal);

    const card = document.getElementById(`daily-mission-${key}`);
    if (card) card.classList.toggle('complete', complete);
  },

  render() {
    this.renderMission('questions', 'daily-progress', 'daily-questions-status', 'Build volume');
    this.renderMission('correct', 'daily-correct-progress', 'daily-correct-status', 'Build accuracy');
    this.renderMission('streak', 'daily-streak-progress', 'daily-streak-status', 'Build focus');

    const completed = Object.values(this.data.claimed).filter(Boolean).length;
    this.setText('daily-missions-summary', `${completed} / 3 complete`);

    const messages = [
      'Three ways to build momentum today.',
      'One down. Keep the rhythm going.',
      'Two complete. One final mission left.',
      'Daily set complete. Nice work.'
    ];
    this.setText('daily-mission-message', messages[completed]);

    const dashboard = document.querySelector('.home-dashboard');
    if (dashboard) dashboard.classList.toggle('missions-complete', completed === 3);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DailyChallenge !== 'undefined') DailyChallenge.load();
});
