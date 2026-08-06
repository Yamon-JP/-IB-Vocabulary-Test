const Quiz = {
  questions: [],
  current: null,

  init() {
    if (!Vocabulary || Vocabulary.words.length === 0) return;
    this.questions = Vocabulary.words;
    this.next();
  },

  next() {
    const index = Math.floor(Math.random() * this.questions.length);
    this.current = this.questions[index];
    return this.current;
  },

  check(answer) {
    return answer === this.current.meaning;
  }
};
