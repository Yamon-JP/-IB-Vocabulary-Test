const Progress = {
  data: {
    questions: 0,
    correct: 0
  },

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
    if (this.data.questions === 0) return 0;
    return Math.round((this.data.correct / this.data.questions) * 100);
  },

  render() {
    const q = document.getElementById('questions');
    const a = document.getElementById('accuracy');
    if (q) q.textContent = this.data.questions;
    if (a) a.textContent = this.accuracy() + '%';
  }
};
