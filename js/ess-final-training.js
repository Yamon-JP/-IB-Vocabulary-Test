// Additive ESS HL Final Exam Training loader.
// Existing ESS exam logic remains untouched; extra questions are merged by unique id.
(() => {
  const EssFinalTraining = window.EssFinalTraining = {
    loaded: false,
    running: false,

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('ESS Final Training extra data could not be loaded.', error);
        return [];
      }
    },

    mergeUnique(existing = [], additions = [], normalize = item => item) {
      const merged = Array.isArray(existing) ? [...existing] : [];
      const ids = new Set(merged.map(item => item?.id).filter(Boolean));
      (Array.isArray(additions) ? additions : []).forEach(rawItem => {
        const item = normalize(rawItem);
        if (!item || !item.id || ids.has(item.id)) return;
        ids.add(item.id);
        merged.push(item);
      });
      return merged;
    },

    async extend() {
      if (this.loaded) return true;
      if (
        typeof EssExam === 'undefined'
        || !EssExam.dataLoaded
        || typeof Paper1 === 'undefined'
        || typeof Paper2 === 'undefined'
      ) return false;

      const [paper1Extra, sectionAExtra, sectionBExtra] = await Promise.all([
        this.fetchArray('data/paper1/ess-paper1-final-extra.json?v=1'),
        this.fetchArray('data/paper2/ess-section-a-final-extra.json?v=1'),
        this.fetchArray('data/paper2/ess-section-b-set-9.json?v=1')
      ]);

      EssExam.paper1Questions = this.mergeUnique(
        EssExam.paper1Questions,
        paper1Extra.filter(question =>
          question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess-paper1'
        )
      );

      const normalizePaper2 = question =>
        typeof EssExam.normalizeEssPaper2Question === 'function'
          ? EssExam.normalizeEssPaper2Question(question)
          : question;

      EssExam.paper2SectionAQuestions = this.mergeUnique(
        EssExam.paper2SectionAQuestions,
        sectionAExtra.filter(question =>
          question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess2a'
        ),
        normalizePaper2
      );

      EssExam.paper2SectionBQuestions = this.mergeUnique(
        EssExam.paper2SectionBQuestions,
        sectionBExtra.filter(question =>
          question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess2b'
        ),
        normalizePaper2
      );

      if (typeof EssExam.attachData === 'function') EssExam.attachData();

      this.loaded = true;
      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    start() {
      if (this.running || this.loaded) return;
      this.running = true;
      let attempts = 0;

      const tryExtend = async () => {
        attempts += 1;
        const done = await this.extend();
        if (done || attempts >= 300) {
          window.clearInterval(timer);
          this.running = false;
        }
      };

      const timer = window.setInterval(tryExtend, 50);
      tryExtend();
    }
  };

  EssFinalTraining.start();
})();
