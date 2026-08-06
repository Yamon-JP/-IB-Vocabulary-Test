const Quiz = {
  questions: [],
  current: null,
  selected: null,
  answered: false,

  init() {
    if (!Vocabulary || !Vocabulary.words || Vocabulary.words.length === 0) return;
    this.questions = Vocabulary.words;
    this.syncWithFlashcard();
  },

  syncWithFlashcard() {
    if (typeof Flashcard !== 'undefined' && Flashcard.current()) {
      this.current = Flashcard.current();
    } else {
      this.current = this.questions[0];
    }

    if (typeof Flashcard !== 'undefined' && this.current) {
      Flashcard.setWord(this.current);
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
    const result = document.getElementById('quiz-result');
    if (!result || this.answered) return;
    if (!this.selected) {
      result.textContent = 'Please select an answer.';
      return;
    }

    const correct = this.check(this.selected);
    result.textContent = correct ? '🟢 Correct!' : `🔴 Incorrect. Answer: ${this.current.meaning}`;
    result.className = correct ? 'correct' : 'incorrect';

    if (typeof Progress !== 'undefined') Progress.record(correct);
    this.answered = true;
  },

  nextQuestion() {
    if (!this.questions.length) return;

    const nextWord = this.questions[Math.floor(Math.random() * this.questions.length)];
    this.current = nextWord;

    if (typeof Flashcard !== 'undefined') {
      Flashcard.setWord(nextWord);
    }

    this.render();
  },

  check(answer) {
    return this.current && answer === this.current.meaning;
  }
};
