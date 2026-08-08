const Paper2 = {
  allQuestions: [],
  questions: [],
  current: null,

  async init() {
    try {
      const response = await fetch('data/paper2.json');
      if (!response.ok) throw new Error('Paper 2 data not found');
      const data = await response.json();
      this.allQuestions = Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Paper 2 data is not available yet.', error);
      this.allQuestions = [];
    }
    this.renderEmptyState();
  },

  pickQuestion(excludeId = null) {
    if (!this.questions.length) return null;
    const candidates = excludeId && this.questions.length > 1
      ? this.questions.filter(question => question.id !== excludeId)
      : this.questions;
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  },

  loadForSelection(subject, chapters = []) {
    this.questions = this.allQuestions.filter(question => {
      if (question.subject !== subject) return false;
      if (!chapters.length) return true;
      const chapter = question.chapter || question.topic;
      return chapters.includes(chapter);
    });
    this.current = this.pickQuestion();
    this.render();
  },

  setQuestions(questions = []) {
    this.questions = Array.isArray(questions) ? questions : [];
    this.current = this.pickQuestion();
    this.render();
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  renderEmptyState() {
    const question = document.getElementById('paper2-question');
    if (!question) return;
    question.innerHTML = '<p class="muted">No Paper 2 questions are available for this selection yet.</p>';
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

    if (!answer.value.trim()) {
      feedback.innerHTML = '<div class="paper2-feedback-card"><strong>Write an answer first.</strong><p>Attempt the question before revealing the markscheme.</p></div>';
      return;
    }

    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const markschemeJa = Array.isArray(this.current.markschemeJa) ? this.current.markschemeJa : [];
    const markschemeHtml = markscheme.length
      ? `<ol class="paper2-markscheme-list">${markscheme.map((point, index) => {
          const japanese = markschemeJa[index]
            ? `<div class="paper2-markscheme-ja" lang="ja">日本語：${this.escapeHtml(markschemeJa[index])}</div>`
            : '';
          return `<li><div>${this.escapeHtml(point)}</div>${japanese}</li>`;
        }).join('')}</ol>`
      : '<p class="muted">No markscheme is available for this question.</p>';
    const modelAnswer = this.current.modelAnswer
      ? `<div class="paper2-model-answer"><h4>Model Answer</h4><p>${this.escapeHtml(this.current.modelAnswer)}</p></div>`
      : '';
    const modelAnswerJa = this.current.modelAnswerJa
      ? `<div class="paper2-model-answer paper2-model-answer-ja" lang="ja"><h4>日本語訳</h4><p>${this.escapeHtml(this.current.modelAnswerJa)}</p></div>`
      : '';

    feedback.innerHTML = `
      <div class="paper2-feedback-card">
        <div class="paper2-feedback-heading">
          <strong>Self-mark your answer</strong>
          <span>${this.escapeHtml(this.current.marks ?? '—')} marks</span>
        </div>
        <p>Compare your response with the marking points below. Award a mark only when your answer clearly communicates the required idea.</p>
        <h4>Markscheme</h4>
        ${markschemeHtml}
        ${modelAnswer}
        ${modelAnswerJa}
      </div>`;
  },

  next() {
    if (!this.questions.length) return;
    const previousId = this.current && this.current.id;
    this.current = this.pickQuestion(previousId);
    this.render();
  }
};
