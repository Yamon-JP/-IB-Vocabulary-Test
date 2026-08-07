const Progress = {
  data: { questions: 0, correct: 0, xp: 0 },

  load() {
    const saved = Storage.load('ib_progress');
    if (saved) {
      this.data = {
        questions: saved.questions || 0,
        correct: saved.correct || 0,
        xp: saved.xp || ((saved.correct || 0) * 10)
      };
    }
    this.render();

    if (typeof Achievements !== 'undefined') {
      Achievements.check(this.data);
    }
  },

  record(correct) {
    this.data.questions++;
    if (correct) {
      this.data.correct++;
      this.data.xp += 10;
    }

    Storage.save('ib_progress', this.data);
    this.render();

    if (typeof Achievements !== 'undefined') {
      Achievements.check(this.data);
    }
  },

  reset() {
    this.data = { questions: 0, correct: 0, xp: 0 };
    Storage.save('ib_progress', this.data);
    this.render();
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
