const Quiz = {
  questions: [],
  current: null,
  selected: null,

  init() {
    if (!Vocabulary || Vocabulary.words.length === 0) return;
    this.questions = Vocabulary.words;
    this.next();
  },

  render() {
    const q = document.getElementById('quiz-question');
    const choices = document.getElementById('quiz-choices');
    const result = document.getElementById('quiz-result');
    if (!q || !choices) return;

    q.textContent = `What does "${this.current.word}" mean?`;
    choices.innerHTML = '';
    result.textContent = '';
    this.selected = null;

    const answers = this.questions.map(w => w.meaning);
    answers.sort(() => Math.random() - 0.5);

    answers.forEach(answer => {
      const button = document.createElement('button');
      button.textContent = answer;
      button.onclick = () => {
        this.selected = answer;
      };
      choices.appendChild(button);
    });
  },

  submit() {
    const result = document.getElementById('quiz-result');
    if (!this.selected) {
      result.textContent = 'Please select an answer.';
      return;
    }
    result.textContent = this.check(this.selected) ? 'Correct!' : 'Incorrect';
  },

  next() {
    const index = Math.floor(Math.random() * this.questions.length);
    this.current = this.questions[index];
    this.render();
  },

  check(answer) {
    return answer === this.current.meaning;
  }
};
