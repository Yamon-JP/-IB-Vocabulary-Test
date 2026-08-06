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

  accuracy() {
    return this.data.questions === 0 ? 0 : Math.round((this.data.correct / this.data.questions) * 100);
  },

  render() {
    const accuracy = this.accuracy() + '%';
    const ids = {
      questions: this.data.questions,
      'practice-questions': this.data.questions,
      accuracy: accuracy,
      'practice-accuracy': accuracy
    };
    Object.keys(ids).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = ids[id];
    });
  }
};
