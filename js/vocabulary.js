const Vocabulary = {
  words: [],

  async load() {
    try {
      const response = await fetch('data/vocabulary.json');

      if (!response.ok) {
        throw new Error('Vocabulary file not found');
      }

      this.words = await response.json();

      console.log('Vocabulary loaded:', this.words.length);
      return true;

    } catch (error) {
      console.error('Vocabulary Load Error:', error);
      return false;
    }
  },

  count() {
    return this.words.length;
  }
};
