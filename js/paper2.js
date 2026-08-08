const Paper2 = {
  allQuestions: [],
  questions: [],
  current: null,

  async init() {
    try {
      const response = await fetch('data/paper2.json');
      if (!response.ok) throw new Error('Paper 2 data not found');
      this.allQuestions = await response.json();
    } catch (error) {
      console.warn('Paper 2 data is not available yet.');
      this.allQuestions = [];
    }
    this.renderEmptyState();
  },

  loadForSelection(subject, chapters = []) {
    this.questions = this.allQuestions.filter(question => {
      if (question.subject !== subject) return false;
      if (!chapters.length) return true;
      const chapter = question.chapter || question.topic;
      return chapters.includes(chapter);
    });
    this.current = this.questions.length
      ? this.questions[Math.floor(Math.random() * this.questions.length)]
      : null;
    this.render();
  },

  setQuestions(questions = []) {
    this.questions = questions;
    this.current = questions.length
      ? questions[Math.floor(Math.random() * questions.length)]
      : null;
    this.render();
  },

  renderEmptyState() {
    const question = document.getElementById('paper2-question');
    if (!question) return;
    question.innerHTML = '<p class="muted">Paper 2 question data will be added after the question database is prepared.</p>';
  },

  render() {
    const question = document.getElementById('paper2-question');
    const marks = document.getElementById('paper2-marks');
    const command = document.getElementById('paper2-command');
    const answer = document.getElementById('paper2-answer');
    const feedback = document.getElementById('paper2-feedback');
    if (!question) return;

    if (!this.current) {
      this.renderEmptyState();
      if (marks) marks.textContent = '—';
      if (command) command.textContent = '—';
      if (answer) answer.value = '';
      if (feedback) feedback.innerHTML = '';
      return;
    }

    question.textContent = this.current.question || '';
    if (marks) marks.textContent = this.current.marks ?? '—';
    if (command) command.textContent = this.current.commandTerm || '—';
    if (answer) answer.value = '';
    if (feedback) feedback.innerHTML = '';
  },

  submit() {
    if (!this.current) return;
    const feedback = document.getElementById('paper2-feedback');
    const answer = document.getElementById('paper2-answer');
    if (!feedback || !answer) return;

    feedback.innerHTML = '<div class="paper2-feedback-card"><strong>Answer recorded.</strong><p>Markscheme and feedback will appear here when this question has been added to the Paper 2 database.</p></div>';
  },

  next() {
    if (!this.questions.length) return;
    this.current = this.questions[Math.floor(Math.random() * this.questions.length)];
    this.render();
  }
};
