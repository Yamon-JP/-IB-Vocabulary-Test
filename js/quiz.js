const Quiz = {
  questions: [],
  current: null,
  selected: null,
  answered: false,
  xpAwarded: false,
  correctStreak: 0,
  mode: 'word-definition',
  questionIndex: 1,

  init() {
    if (typeof Vocabulary === 'undefined' || !Vocabulary.words || !Vocabulary.words.length) return;
    this.questions = Vocabulary.words;
    this.questionIndex = 1;
    this.syncModeSelector();
    this.bindModeSelector();
    this.syncWithPracticeWord();
  },

  syncModeSelector() {
    const selector = document.querySelector(`input[name="quiz-mode"][value="${this.mode}"]`);
    if (selector) selector.checked = true;
  },

  bindModeSelector() {
    document.querySelectorAll('input[name="quiz-mode"]').forEach(selector => {
      selector.onchange = () => {
        this.mode = selector.value;
        this.syncModeSelector();

        // Switching quiz mode starts a fresh question intentionally.
        // This prevents using the same word in the opposite direction
        // to infer/reveal the answer and farm the question.
        if (this.questions.length) {
          const candidates = this.questions.length > 1
            ? this.questions.filter(word => !this.current || word.id !== this.current.id)
            : this.questions;
          this.current = candidates[Math.floor(Math.random() * candidates.length)];

          if (typeof App !== 'undefined') App.setPracticeWord(this.current);
          if (typeof Flashcard !== 'undefined') Flashcard.setWord(this.current);
          this.render();
        }
      };
    });
  },

  syncWithPracticeWord() {
    if (typeof App !== 'undefined' && App.getPracticeWord()) {
      this.current = App.getPracticeWord();
    }
    this.render();
  },

  updateProgressDisplay() {
    const progress = document.getElementById('quiz-progress-question');
    const chapter = document.getElementById('quiz-progress-chapter');
    if (progress) progress.textContent = `Question ${this.questionIndex} / ${Math.max(this.questions.length, 1)}`;
    if (chapter) {
      const currentChapter = this.current && (this.current.chapter || this.current.topic);
      chapter.textContent = currentChapter ? currentChapter : '';
    }
  },

  generateChoices(correct) {
    const pool = this.mode === 'definition-word'
      ? this.questions.map(word => word.word).filter(Boolean)
      : this.questions.map(word => word.definition).filter(Boolean);

    const uniqueWrongChoices = [...new Set(pool.filter(value => value !== correct))]
      .sort(() => Math.random() - 0.5);

    const choices = [correct, ...uniqueWrongChoices].slice(0, 4);

    // Keep the four-choice layout even when the database contains
    // fewer than four real alternatives. Placeholder options are disabled.
    while (choices.length < 4) choices.push(null);

    return choices.sort(() => Math.random() - 0.5);
  },

  render() {
    if (!this.current) return;

    const question = document.getElementById('quiz-question');
    const choices = document.getElementById('quiz-choices');
    const result = document.getElementById('quiz-result');
    if (!question || !choices || !result) return;

    this.updateProgressDisplay();

    question.innerHTML = this.mode === 'definition-word'
      ? `Which word matches this definition?<br><br>${this.current.definition}`
      : `What does "${this.current.word}" mean?`;

    choices.innerHTML = '';
    result.innerHTML = '';
    result.className = '';
    this.selected = null;
    this.answered = false;
    this.xpAwarded = false;

    this.generateChoices(this.getAnswer()).forEach(answer => {
      const button = document.createElement('button');
      button.className = 'quiz-choice';

      if (answer === null) {
        button.textContent = '—';
        button.disabled = true;
        button.classList.add('placeholder-choice');
      } else {
        button.textContent = answer;
        button.onclick = () => {
          if (this.answered) return;
          this.selected = answer;
          document.querySelectorAll('.quiz-choice').forEach(item => item.classList.remove('selected'));
          button.classList.add('selected');
        };
      }

      choices.appendChild(button);
    });
  },

  submit() {
    if (this.answered || !this.selected || this.xpAwarded) return;

    const correct = this.check(this.selected);
    this.answered = true;
    this.xpAwarded = true;

    document.querySelectorAll('.quiz-choice').forEach(button => {
      button.disabled = true;
      if (button.textContent === this.getAnswer()) button.classList.add('correct');
      if (button.textContent === this.selected && !correct) button.classList.add('incorrect');
      if (button.textContent !== this.getAnswer() && button.textContent !== this.selected) {
        button.classList.add('answer-disabled');
      }
    });

    const correctAnswer = this.getAnswer();
    const resultHtml = correct
      ? `<div class="answer-card correct"><h3>✅ Correct! +10 XP</h3><p>Word</p><strong>${this.current.word}</strong><p>Definition</p><span>${this.current.definition}</span><p>Japanese</p><span>${this.current.japanese || 'Not available'}</span></div>`
      : `<div class="answer-card incorrect"><h3>❌ Incorrect</h3><p>Correct Answer</p><strong class="correct-answer">${correctAnswer}</strong><p>Word</p><strong>${this.current.word}</strong><p>Definition</p><span>${this.current.definition}</span><p>Japanese</p><span>${this.current.japanese || 'Not available'}</span></div>`;

    if (typeof Flashcard !== 'undefined' && Flashcard.showAnswer) Flashcard.showAnswer(resultHtml);
    if (typeof Progress !== 'undefined') Progress.record(correct, this.current);
    if (typeof DailyChallenge !== 'undefined' && DailyChallenge.recordQuestion) DailyChallenge.recordQuestion();
    if (typeof Streak !== 'undefined' && Streak.updateStudyStatus) {
      Streak.updateStudyStatus();
      Streak.render();
    }
  },

  nextQuestion() {
    if (!this.answered || !this.questions.length) return;
    this.current = this.questions[Math.floor(Math.random() * this.questions.length)];
    this.questionIndex = this.questionIndex >= this.questions.length ? 1 : this.questionIndex + 1;
    if (typeof App !== 'undefined') App.setPracticeWord(this.current);
    this.render();
  },

  check(answer) {
    return answer === this.getAnswer();
  },

  getAnswer() {
    return this.mode === 'definition-word' ? this.current.word : this.current.definition;
  }
};
