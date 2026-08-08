const Progress = {
  data: { questions: 0, correct: 0, xp: 0, correctStreak: 0, chapterStats: {}, wordStats: {} },

  load() {
    const saved = Storage.load('ib_progress');
    if (saved) {
      this.data = {
        questions: saved.questions || 0,
        correct: saved.correct || 0,
        xp: saved.xp || ((saved.correct || 0) * 10),
        correctStreak: saved.correctStreak || 0,
        chapterStats: saved.chapterStats || {},
        wordStats: saved.wordStats || {}
      };
    }
    this.render();

    if (typeof Achievements !== 'undefined') Achievements.check(this.data);
  },

  getWordKey(word) {
    if (!word) return null;
    return String(word.id || word.word || '');
  },

  record(correct, word = null) {
    this.data.questions++;

    if (correct) {
      this.data.correct++;
      this.data.xp += 10;
      this.data.correctStreak++;
    } else {
      this.data.correctStreak = 0;
    }

    const subject = word && word.subject;
    const chapter = word && (word.chapter || word.topic);
    if (subject && chapter) {
      if (!this.data.chapterStats[subject]) this.data.chapterStats[subject] = {};
      if (!this.data.chapterStats[subject][chapter]) {
        this.data.chapterStats[subject][chapter] = { questions: 0, correct: 0 };
      }
      const stats = this.data.chapterStats[subject][chapter];
      stats.questions++;
      if (correct) stats.correct++;
    }

    const wordKey = this.getWordKey(word);
    if (wordKey) {
      if (!this.data.wordStats[wordKey]) this.data.wordStats[wordKey] = { questions: 0, correct: 0 };
      const wordStats = this.data.wordStats[wordKey];
      wordStats.questions++;
      if (correct) wordStats.correct++;
    }

    Storage.save('ib_progress', this.data);
    this.render();
    if (typeof Achievements !== 'undefined') Achievements.check(this.data);
  },

  reset() {
    this.data = { questions: 0, correct: 0, xp: 0, correctStreak: 0, chapterStats: {}, wordStats: {} };
    Storage.save('ib_progress', this.data);
    this.render();
    if (typeof Achievements !== 'undefined') Achievements.check(this.data);
  },

  accuracy() {
    return this.data.questions === 0 ? 0 : Math.round((this.data.correct / this.data.questions) * 100);
  },

  xp() {
    return this.data.xp || 0;
  },

  renderChapterProgress() {
    const container = document.getElementById('chapter-progress-list');
    if (!container) return;
    const subjects = Object.entries(this.data.chapterStats || {});
    if (!subjects.length) {
      container.innerHTML = '<p class="muted">No chapter progress yet.</p>';
      return;
    }
    container.innerHTML = subjects.map(([subject, chapters]) => {
      const chapterEntries = Object.entries(chapters || {});
      return `<div class="chapter-progress-subject"><h4>${subject}</h4>${chapterEntries.map(([chapter, stats]) => {
        const questions = stats.questions || 0;
        const correct = stats.correct || 0;
        const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
        return `<div class="chapter-progress-row"><span>${chapter}</span><strong>${accuracy}%</strong><small>${correct} / ${questions} correct</small></div>`;
      }).join('')}</div>`;
    }).join('');
  },

  render() {
    const values = {
      questions: this.data.questions,
      'practice-questions': this.data.questions,
      accuracy: this.accuracy() + '%',
      'practice-accuracy': this.accuracy() + '%',
      xp: this.xp(),
      'practice-xp': this.xp()
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    this.renderChapterProgress();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Progress !== 'undefined') Progress.load();
});
