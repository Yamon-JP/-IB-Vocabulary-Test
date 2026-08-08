const Quiz = {
  questions: [],
  current: null,
  selected: null,
  answered: false,
  xpAwarded: false,
  correctStreak: 0,
  mode: 'word-definition',

  init() {
    if (!Vocabulary || !Vocabulary.words || !Vocabulary.words.length) return;
    this.questions = Vocabulary.words;
    this.bindModeSelector();
    this.syncWithPracticeWord();
  },

  bindModeSelector() {
    document.querySelectorAll('input[name="quiz-mode"]').forEach(selector => {
      selector.onchange = () => {
        this.mode = selector.value;
        if (this.questions.length) {
          this.current = this.questions[Math.floor(Math.random() * this.questions.length)];
          if (typeof App !== 'undefined') App.setPracticeWord(this.current);
        }
        this.render();
      };
    });
  },

  syncWithPracticeWord() {
    if (typeof App !== 'undefined' && App.getPracticeWord()) {
      this.current = App.getPracticeWord();
    }
    this.render();
  },

  generateChoices(correct) {
    const pool = this.mode === 'definition-word'
      ? this.questions.map(word => word.word)
      : this.questions.map(word => word.definition).filter(Boolean);

    const uniqueWrongChoices = [...new Set(pool.filter(value => value !== correct))]
      .sort(() => Math.random() - 0.5);

    const choices = [correct, ...uniqueWrongChoices];
    while (choices.length < 4) choices.push('No option');
    return choices.slice(0, 4).sort(() => Math.random() - 0.5);
  },

  render() {
    if (!this.current) return;
    const question = document.getElementById('quiz-question');
    const choices = document.getElementById('quiz-choices');
    const result = document.getElementById('quiz-result');
    if (!question || !choices || !result) return;

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
      button.textContent = answer;
      button.className = 'quiz-choice';
      button.onclick = () => {
        if (this.answered) return;
        this.selected = answer;
        document.querySelectorAll('.quiz-choice').forEach(item => item.classList.remove('selected'));
        button.classList.add('selected');
      };
      choices.appendChild(button);
    });
  },

  submit() {
    if (this.answered || !this.selected || this.xpAwarded) return;
    const correct = this.check(this.selected);
    this.answered = true;
    this.xpAwarded = true;

    document.querySelectorAll('.quiz-choice').forEach(button => {
      if (button.textContent === this.getAnswer()) button.classList.add('correct');
      if (button.textContent === this.selected && !correct) button.classList.add('incorrect');
    });

    const correctAnswer = this.getAnswer();
    const resultHtml = correct
      ? `<div class="answer-card correct"><h3>✅ Correct! +10 XP</h3><p>Word</p><strong>${this.current.word}</strong><p>Definition</p><span>${this.current.definition}</span><p>Japanese</p><span>${this.current.japanese || 'Not available'}</span></div>`
      : `<div class="answer-card incorrect"><h3>❌ Incorrect</h3><p>Correct Answer</p><strong class="correct-answer">${correctAnswer}</strong><p>Word</p><strong>${this.current.word}</strong><p>Definition</p><span>${this.current.definition}</span><p>Japanese</p><span>${this.current.japanese || 'Not available'}</span></div>`;

    if (typeof Flashcard !== 'undefined' && Flashcard.showAnswer) Flashcard.showAnswer(resultHtml);
    if (typeof Progress !== 'undefined') Progress.record(correct);
    if (typeof DailyChallenge !== 'undefined' && DailyChallenge.recordQuestion) DailyChallenge.recordQuestion();
    if (typeof Streak !== 'undefined' && Streak.updateStudyStatus) {
      Streak.updateStudyStatus();
      Streak.render();
    }
  },

  nextQuestion() {
    if (!this.answered || !this.questions.length) return;
    this.current = this.questions[Math.floor(Math.random() * this.questions.length)];
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
