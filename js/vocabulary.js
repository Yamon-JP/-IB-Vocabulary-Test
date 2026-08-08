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
    const selectedChapters = Array.isArray(chapters) ? chapters.filter(Boolean) : [];

    this.words = this.allWords.filter(word => {
      // Subject is always applied first so vocabulary from another subject
      // can never enter the active practice set.
      if (subject && word.subject !== subject) return false;

      // An empty chapter selection means all chapters for the selected subject.
      if (selectedChapters.length === 0) return true;

      const chapter = word.chapter || word.topic;
      return Boolean(chapter) && selectedChapters.includes(chapter);
    });

    return this.words;
  },

  count() {
    return this.words.length;
  }
};
