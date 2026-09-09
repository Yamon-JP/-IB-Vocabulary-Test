const Vocabulary = {
  allWords: [],
  words: [],

  normalizeDataset(data, file = 'unknown') {
    if (Array.isArray(data)) return data;

    if (data && Array.isArray(data.units)) {
      return data.units.flatMap(unit =>
        (unit.words || []).map(word => ({
          ...word,
          subject: word.subject || data.subject,
          chapter: word.chapter || data.chapter,
          chapterTitle: word.chapterTitle || data.chapterTitle,
          unit: word.unit || unit.unit,
          level: word.level || data.level
        }))
      );
    }

    throw new Error(`Unsupported vocabulary format: ${file}`);
  },

  async load() {
    try {
      const manifestResponse = await fetch('data/vocabulary/manifest.json');
      if (!manifestResponse.ok) throw new Error('Vocabulary manifest not found');

      const manifest = await manifestResponse.json();
      const files = Object.values(manifest.subjects || {}).flat().filter(Boolean);

      if (!files.length) throw new Error('Vocabulary manifest is empty');

      const datasets = await Promise.all(files.map(async file => {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Vocabulary file not found: ${file}`);
        const data = await response.json();
        return this.normalizeDataset(data, file);
      }));

      this.allWords = datasets.flat();
      this.words = [...this.allWords];

      console.log('Vocabulary loaded:', this.allWords.length);
      return true;
    } catch (error) {
      console.error('Vocabulary manifest load error:', error);

      // Safe fallback to the legacy single-file database.
      try {
        const response = await fetch('data/vocabulary.json');
        if (!response.ok) throw new Error('Legacy vocabulary file not found');

        const data = await response.json();
        this.allWords = this.normalizeDataset(data, 'data/vocabulary.json');
        this.words = [...this.allWords];

        console.warn('Vocabulary loaded from legacy fallback:', this.allWords.length);
        return true;
      } catch (fallbackError) {
        console.error('Vocabulary Load Error:', fallbackError);
        this.allWords = [];
        this.words = [];
        return false;
      }
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
