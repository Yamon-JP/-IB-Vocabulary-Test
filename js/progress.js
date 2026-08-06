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

  xp() {
    return this.data.correct * 10;
  },

  render() {
    const xp = this.xp();

    const values = {
      questions: this.data.questions,
      'practice-questions': this.data.questions,
      accuracy: this.accuracy() + '%',
      'practice-accuracy': this.accuracy() + '%',
      xp: xp,
      'practice-xp': xp
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });

    const practicePanel = document.querySelector('#practice-page .progress-panel');
    if (practicePanel && !document.getElementById('practice-xp')) {
      const p = document.createElement('p');
      p.innerHTML = 'XP: <span id="practice-xp">' + xp + '</span>';
      practicePanel.appendChild(p);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Progress !== 'undefined') Progress.load();
});
