const Progress = {
  data: { questions: 0, correct: 0 },

  load() {
    const saved = Storage.load('ib_progress');
    if (saved) this.data = saved;
    this.render();
  },

  record(correct) {
    this.data.questions++;
    if (correct) this.data.correct++;
    Storage.save('ib_progress', this.data);
    this.render();
  },

  reset() {
    this.data = { questions: 0, correct: 0 };
    Storage.save('ib_progress', this.data);
    this.render();
  },

  accuracy() {
    return this.data.questions === 0 ? 0 : Math.round((this.data.correct / this.data.questions) * 100);
  },

  render() {
    const xp = this.data.correct * 10;
    const values = {
      questions: this.data.questions,
      'practice-questions': this.data.questions,
      accuracy: this.accuracy() + '%',
      'practice-accuracy': this.accuracy() + '%',
      xp: xp
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
