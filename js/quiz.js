const Quiz = {
  questions: [],
  current: null,
  selected: null,
  answered: false,

  init() {
    if (!Vocabulary || !Vocabulary.words || Vocabulary.words.length === 0) return;
    this.questions = Vocabulary.words;
    this.syncWithPracticeWord();
  },

  syncWithPracticeWord() {
    if (typeof App !== 'undefined' && App.getPracticeWord()) {
      this.current = App.getPracticeWord();
    }
    this.render();
  },

  render() {
    if (!this.current) return;
    const q = document.getElementById('quiz-question');
    const choices = document.getElementById('quiz-choices');
    const result = document.getElementById('quiz-result');
    if (!q || !choices || !result) return;

    q.textContent = `What does "${this.current.word}" mean?`;
    choices.innerHTML = '';
    result.textContent = '';
    result.className = '';
    this.selected = null;
    this.answered = false;

    const answers = this.questions.map(w => w.meaning).sort(() => Math.random() - 0.5);
    answers.forEach(answer => {
      const button = document.createElement('button');
      button.textContent = answer;
      button.onclick = () => {
        if (this.answered) return;
        this.selected = answer;
        [...choices.children].forEach(b => b.classList.remove('selected'));
        button.classList.add('selected');
      };
      choices.appendChild(button);
    });
  },

  submit() {
    if (this.answered || !this.selected) return;

    const correct = this.check(this.selected);
    const result = document.getElementById('quiz-result');
    if (result) {
      result.textContent = correct ? '🟢 Correct!' : `🔴 Incorrect. Answer: ${this.current.meaning}`;
      result.className = correct ? 'correct' : 'incorrect';
    }

    this.answered = true;

    if (typeof Progress !== 'undefined') {
      Progress.record(correct);
    }

    if (typeof DailyChallenge !== 'undefined' && typeof DailyChallenge.recordQuestion === 'function') {
      DailyChallenge.recordQuestion();
    }

    setTimeout(() => this.nextQuestion(), 1000);
  },

  nextQuestion() {
    if (!this.questions.length || !this.current) return;

    const currentIndex = this.questions.findIndex(w => w.word === this.current.word);
    const nextWord = this.questions[(currentIndex + 1) % this.questions.length];

    this.current = nextWord;

    if (typeof App !== 'undefined') {
      App.setPracticeWord(nextWord);
    }

    if (typeof Flashcard !== 'undefined') {
      Flashcard.setWord(nextWord);
    }

    this.render();
  },

  check(answer) {
    return this.current && answer === this.current.meaning;
  }
};
