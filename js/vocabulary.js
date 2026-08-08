const Vocabulary = {
  allWords: [],
  words: [],

  async load() {
    try {
      const response = await fetch('data/vocabulary.json');
      if (!response.ok) throw new Error('Vocabulary file not found');

      this.allWords = await response.json();
      this.words = [...this.allWords];

      console.log('Vocabulary loaded:', this.allWords.length);
      return true;
    } catch (error) {
      console.error('Vocabulary Load Error:', error);
      this.allWords = [];
      this.words = [];
      return false;
    }
  },

  subjects() {
    return [...new Set(this.allWords.map(word => word.subject).filter(Boolean))];
  },

  chapters(subject) {
    return [...new Set(
      this.allWords
        .filter(word => !subject || word.subject === subject)
        .map(word => word.chapter || word.topic)
        .filter(Boolean)
    )];
  },

  filter(subject, chapters = []) {
    this.words = this.allWords.filter(word => {
      if (subject && word.subject !== subject) return false;
      if (chapters.length === 0) return true;
      const chapter = word.chapter || word.topic;
      return chapters.includes(chapter);
    });
    return this.words;
  },

  count() {
    return this.words.length;
  }
};
