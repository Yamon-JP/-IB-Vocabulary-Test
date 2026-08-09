const DailyChallenge = {
  data: {
    date: null,
    questions: 0,
    correctAnswers: 0,
    currentCorrectStreak: 0,
    bestCorrectStreak: 0,
    claimed: { questions: false, correct: false, streak: false }
  },

  history: {
    startedDate: null,
    completedDates: {}
  },

  missionStreakMilestones: [3, 7, 14, 30],

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

  dateToKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  parseDateKey(key) {
    const [year, month, day] = String(key || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  },

  offsetDateKey(key, amount) {
    const date = this.parseDateKey(key);
    if (!date) return key;
    date.setDate(date.getDate() + amount);
    return this.dateToKey(date);
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

  normalizeHistory(saved, today) {
    const completedDates = {};
    if (saved?.completedDates && typeof saved.completedDates === 'object') {
      Object.entries(saved.completedDates).forEach(([date, complete]) => {
        if (complete === true && /^\d{4}-\d{2}-\d{2}$/.test(date)) completedDates[date] = true;
      });
    }

    const validStart = saved?.startedDate && /^\d{4}-\d{2}-\d{2}$/.test(saved.startedDate)
      ? saved.startedDate
      : today;

    return {
      startedDate: validStart > today ? today : validStart,
      completedDates
    };
  },

  load() {
    this.ensureSupplementalUI();
    const today = this.today();
    this.data = this.normalize(Storage.load('ib_daily'), today);
    this.history = this.normalizeHistory(Storage.load('ib_daily_history'), today);
    this.syncTodayCompletion();
    this.save();
    this.saveHistory();
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
    this.syncTodayCompletion();
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

  saveHistory() {
    Storage.save('ib_daily_history', this.history);
  },

  isDailySetComplete() {
    return Object.values(this.data.claimed).every(Boolean);
  },

  syncTodayCompletion() {
    if (!this.isDailySetComplete()) return false;

    const today = this.today();
    if (this.history.completedDates[today]) return false;

    this.history.completedDates[today] = true;
    this.saveHistory();
    return true;
  },

  getCurrentMissionStreak() {
    const today = this.today();
    let cursor = this.history.completedDates[today] ? today : this.offsetDateKey(today, -1);
    let streak = 0;

    while (cursor >= this.history.startedDate && this.history.completedDates[cursor]) {
      streak++;
      cursor = this.offsetDateKey(cursor, -1);
    }

    return streak;
  },

  getBestMissionStreak() {
    const dates = Object.keys(this.history.completedDates)
      .filter(date => this.history.completedDates[date] && date >= this.history.startedDate)
      .sort();

    let best = 0;
    let current = 0;
    let previous = null;

    dates.forEach(date => {
      if (previous && this.offsetDateKey(previous, 1) === date) {
        current++;
      } else {
        current = 1;
      }
      best = Math.max(best, current);
      previous = date;
    });

    return best;
  },

  getNextMissionMilestone(streak = this.getCurrentMissionStreak()) {
    const next = this.missionStreakMilestones.find(target => streak < target);
    if (next) return { target: next, complete: false };
    return { target: this.missionStreakMilestones[this.missionStreakMilestones.length - 1], complete: true };
  },

  getCurrentMonthStats() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDay = now.getDate();
    const monthStartKey = this.dateToKey(new Date(year, month, 1, 12));
    const monthEndKey = this.dateToKey(new Date(year, month + 1, 0, 12));
    const trackingStartKey = this.history.startedDate > monthStartKey ? this.history.startedDate : monthStartKey;
    const trackingStart = this.parseDateKey(trackingStartKey);
    const eligibleStartDay = trackingStart && trackingStart.getMonth() === month && trackingStart.getFullYear() === year
      ? trackingStart.getDate()
      : 1;
    const eligibleDays = trackingStartKey > this.today() ? 0 : Math.max(0, todayDay - eligibleStartDay + 1);
    const completed = Object.keys(this.history.completedDates).filter(date => {
      return this.history.completedDates[date]
        && date >= trackingStartKey
        && date <= this.today()
        && date >= monthStartKey
        && date <= monthEndKey;
    }).length;

    return {
      year,
      month,
      todayDay,
      eligibleStartDay,
      eligibleDays,
      completed,
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      firstWeekday: new Date(year, month, 1).getDay()
    };
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

  setBar(id, current, goal) {
    const bar = document.getElementById(id);
    if (!bar) return;
    const percent = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
    bar.style.width = `${percent}%`;
  },

  setProgress(key, current, goal) {
    this.setBar(`daily-${key}-bar`, current, goal);
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

  ensureSupplementalUI() {
    if (!document.getElementById('daily-progress-styles')) {
      const link = document.createElement('link');
      link.id = 'daily-progress-styles';
      link.rel = 'stylesheet';
      link.href = 'css/daily-progress.css';
      document.head.appendChild(link);
    }

    const practiceStats = document.querySelector('#practice-page .practice-mini-stats');
    if (practiceStats && !document.getElementById('practice-daily-panel')) {
      practiceStats.insertAdjacentHTML('afterend', `
        <section id="practice-daily-panel" class="practice-daily-panel" aria-label="Today's daily mission progress">
          <div class="practice-daily-heading">
            <div>
              <span class="practice-daily-eyebrow">TODAY'S MISSION</span>
              <strong id="practice-daily-summary">0 / 3 complete</strong>
            </div>
            <span class="practice-daily-reset">Resets daily</span>
          </div>
          <div class="practice-daily-missions">
            <div id="practice-daily-row-questions" class="practice-daily-row">
              <div class="practice-daily-row-copy"><span>⚡ 100 Questions</span><strong id="practice-daily-questions-progress">0/100</strong></div>
              <div class="practice-daily-track"><span id="practice-daily-questions-bar"></span></div>
            </div>
            <div id="practice-daily-row-correct" class="practice-daily-row">
              <div class="practice-daily-row-copy"><span>🎯 75 Correct</span><strong id="practice-daily-correct-progress">0/75</strong></div>
              <div class="practice-daily-track"><span id="practice-daily-correct-bar"></span></div>
            </div>
            <div id="practice-daily-row-streak" class="practice-daily-row">
              <div class="practice-daily-row-copy"><span>🔥 10 in a Row</span><strong id="practice-daily-streak-progress">0/10</strong></div>
              <div class="practice-daily-track"><span id="practice-daily-streak-bar"></span></div>
            </div>
          </div>
          <div class="practice-daily-streakline">
            <span>Daily Mission Streak</span>
            <strong id="practice-daily-completion-streak">0 days</strong>
            <span id="practice-daily-next">Next: 3 days</span>
          </div>
          <div class="practice-daily-milestone-track"><span id="practice-daily-milestone-bar"></span></div>
        </section>
      `);
    }

    const statisticsHeading = document.querySelector('#statistics-page .page-heading');
    if (statisticsHeading && !document.getElementById('daily-history-panel')) {
      statisticsHeading.insertAdjacentHTML('afterend', `
        <section id="daily-history-panel" class="progress-panel daily-history-panel" aria-label="Monthly daily mission progress">
          <div class="daily-history-heading">
            <div>
              <p class="eyebrow">DAILY MISSION HISTORY</p>
              <h3 id="daily-history-month-label">This Month</h3>
              <p id="daily-history-month-summary" class="muted">0 / 0 days complete</p>
            </div>
            <div class="daily-history-stats">
              <div><span>Current Streak</span><strong id="daily-history-current-streak">0 days</strong></div>
              <div><span>Best Streak</span><strong id="daily-history-best-streak">0 days</strong></div>
            </div>
          </div>
          <div class="daily-history-milestone">
            <div><span>Next streak milestone</span><strong id="daily-history-next-milestone">3 days</strong></div>
            <div class="daily-history-milestone-track"><span id="daily-history-milestone-bar"></span></div>
          </div>
          <div class="daily-history-weekdays" aria-hidden="true">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          <div id="daily-history-calendar" class="daily-history-calendar"></div>
          <p id="daily-history-start-note" class="daily-history-start-note muted"></p>
        </section>
      `);
    }
  },

  renderPracticePanel() {
    const completed = Object.values(this.data.claimed).filter(Boolean).length;
    this.setText('practice-daily-summary', `${completed} / 3 complete`);

    Object.keys(this.missions).forEach(key => {
      const mission = this.missions[key];
      const current = this.missionValue(key);
      const displayCurrent = Math.min(current, mission.goal);
      this.setText(`practice-daily-${key}-progress`, `${displayCurrent}/${mission.goal}`);
      this.setBar(`practice-daily-${key}-bar`, current, mission.goal);
      const row = document.getElementById(`practice-daily-row-${key}`);
      if (row) row.classList.toggle('complete', Boolean(this.data.claimed[key]));
    });

    const currentStreak = this.getCurrentMissionStreak();
    const milestone = this.getNextMissionMilestone(currentStreak);
    this.setText('practice-daily-completion-streak', `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`);
    this.setText('practice-daily-next', milestone.complete ? '30-day milestone complete' : `Next: ${milestone.target} days`);
    this.setBar('practice-daily-milestone-bar', milestone.complete ? milestone.target : currentStreak, milestone.target);
  },

  renderHistoryPanel() {
    const stats = this.getCurrentMonthStats();
    const currentStreak = this.getCurrentMissionStreak();
    const bestStreak = this.getBestMissionStreak();
    const milestone = this.getNextMissionMilestone(currentStreak);
    const monthDate = new Date(stats.year, stats.month, 1);
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    this.setText('daily-history-month-label', monthLabel);
    this.setText('daily-history-month-summary', `${stats.completed} / ${stats.eligibleDays} tracked days complete`);
    this.setText('daily-history-current-streak', `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`);
    this.setText('daily-history-best-streak', `${bestStreak} ${bestStreak === 1 ? 'day' : 'days'}`);
    this.setText('daily-history-next-milestone', milestone.complete ? '30-day milestone complete' : `${currentStreak} / ${milestone.target} days`);
    this.setBar('daily-history-milestone-bar', milestone.complete ? milestone.target : currentStreak, milestone.target);

    const startDate = this.parseDateKey(this.history.startedDate);
    if (startDate) {
      const label = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      this.setText('daily-history-start-note', `Daily Mission history tracking started ${label}. Earlier days are not counted.`);
    }

    const calendar = document.getElementById('daily-history-calendar');
    if (!calendar) return;

    const cells = [];
    for (let i = 0; i < stats.firstWeekday; i++) {
      cells.push('<span class="daily-history-day spacer" aria-hidden="true"></span>');
    }

    for (let day = 1; day <= stats.daysInMonth; day++) {
      const date = new Date(stats.year, stats.month, day, 12);
      const key = this.dateToKey(date);
      const complete = Boolean(this.history.completedDates[key]);
      const beforeTracking = key < this.history.startedDate;
      const future = key > this.today();
      const today = key === this.today();
      const classes = ['daily-history-day'];
      if (complete) classes.push('complete');
      else if (beforeTracking) classes.push('untracked');
      else if (future) classes.push('future');
      else classes.push('missed');
      if (today) classes.push('today');

      const state = complete ? 'complete' : beforeTracking ? 'not tracked' : future ? 'future' : today ? 'in progress' : 'not complete';
      cells.push(`<span class="${classes.join(' ')}" aria-label="${monthLabel} ${day}: ${state}"><strong>${day}</strong>${complete ? '<small>✓</small>' : ''}</span>`);
    }

    calendar.innerHTML = cells.join('');
  },

  render() {
    this.ensureSupplementalUI();
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

    this.renderPracticePanel();
    this.renderHistoryPanel();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DailyChallenge !== 'undefined') DailyChallenge.load();
});
