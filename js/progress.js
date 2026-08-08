const Progress = {
  data: { questions: 0, correct: 0, xp: 0, correctStreak: 0, chapterStats: {} },

  load() {
    const saved = Storage.load('ib_progress');
    if (saved) {
      this.data = {
        questions: saved.questions || 0,
        correct: saved.correct || 0,
        xp: saved.xp || ((saved.correct || 0) * 10),
        correctStreak: saved.correctStreak || 0,
        chapterStats: saved.chapterStats || {}
      };
    }
    this.render();

    if (typeof Achievements !== 'undefined') {
      Achievements.check(this.data);
    }
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

    // Keep the existing overall progress untouched while additionally
    // recording chapter-level statistics when the question has metadata.
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

    Storage.save('ib_progress', this.data);
    this.render();

    if (typeof Achievements !== 'undefined') {
      Achievements.check(this.data);
    }
  },

  reset() {
    this.data = { questions: 0, correct: 0, xp: 0, correctStreak: 0, chapterStats: {} };
    Storage.save('ib_progress', this.data);
    this.render();

    if (typeof Achievements !== 'undefined') {
      Achievements.check(this.data);
    }
  },

  accuracy() {
    return this.data.questions === 0 ? 0 : Math.round((this.data.correct / this.data.questions) * 100);
  },

  xp() {
    return this.data.xp || 0;
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
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Progress !== 'undefined') Progress.load();
});
