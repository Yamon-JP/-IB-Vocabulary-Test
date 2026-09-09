// ESS HL Final Exam Training: final balance extension.
// Additive only: waits for the stable ESS foundation and first training batch.
// Paper 1 UI labels show Case Study 1, 2, ... using the loaded case-study order.
(() => {
  const Extension = window.EssFinalTraining2 = {
    loaded: false,
    running: false,
    numberingInstalled: false,

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('ESS final balance data could not be loaded.', error);
        return [];
      }
    },

    mergeUnique(existing = [], additions = []) {
      const merged = Array.isArray(existing) ? [...existing] : [];
      const ids = new Set(merged.map(item => item?.id).filter(Boolean));
      for (const item of additions) {
        if (!item?.id || ids.has(item.id)) continue;
        ids.add(item.id);
        merged.push(item);
      }
      return merged;
    },

    installCaseStudyNumbering() {
      if (this.numberingInstalled || typeof EssExam === 'undefined' || typeof EssExam.renderCaseStudy !== 'function') {
        return;
      }

      const originalRenderCaseStudy = EssExam.renderCaseStudy.bind(EssExam);
      EssExam.renderCaseStudy = caseStudy => {
        const html = originalRenderCaseStudy(caseStudy);
        if (!caseStudy || !html) return html;

        const index = Array.isArray(EssExam.caseStudies)
          ? EssExam.caseStudies.findIndex(item => item?.id === caseStudy.id)
          : -1;
        if (index < 0) return html;

        return html.replace(
          'ESS PAPER 1 CASE STUDY',
          `ESS PAPER 1 · CASE STUDY ${index + 1}`
        );
      };

      this.numberingInstalled = true;
    },

    async extend() {
      if (this.loaded) return true;
      if (
        typeof EssExam === 'undefined' || !EssExam.dataLoaded ||
        typeof EssFinalTraining === 'undefined' || !EssFinalTraining.loaded ||
        typeof Paper1 === 'undefined' || typeof Paper2 === 'undefined'
      ) return false;

      const sources = [
        'data/paper1/ess-case-study-9.json?v=2',
        'data/paper1/ess-paper1-case9-part1.json?v=1',
        'data/paper1/ess-paper1-case9-part2.json?v=1',
        'data/paper1/ess-paper1-case9-part3.json?v=1',
        'data/paper2/ess-section-a-final-extra-2-part1.json?v=1',
        'data/paper2/ess-section-a-final-extra-2-part2.json?v=1',
        'data/paper2/ess-section-a-final-extra-2-part3.json?v=1',
        'data/paper2/ess-section-b-set10-a.json?v=1',
        'data/paper2/ess-section-b-set10-b.json?v=1',
        'data/paper2/ess-section-b-set10-c.json?v=1',
        'data/paper2/ess-section-b-set11-a.json?v=1',
        'data/paper2/ess-section-b-set11-b.json?v=1',
        'data/paper2/ess-section-b-set11-c.json?v=1'
      ];
      const loaded = await Promise.all(sources.map(source => this.fetchArray(source)));
      const [caseStudies, p1a, p1b, p1c, sA1, sA2, sA3, ...sectionBParts] = loaded;

      EssExam.caseStudies = this.mergeUnique(EssExam.caseStudies, caseStudies);
      EssExam.paper1Questions = this.mergeUnique(
        EssExam.paper1Questions,
        [...p1a, ...p1b, ...p1c].filter(q => q?.subject === 'ESS HL' && q?.assessmentTarget === 'ess-paper1')
      );

      const normalize = q => typeof EssExam.normalizeEssPaper2Question === 'function'
        ? EssExam.normalizeEssPaper2Question(q)
        : q;
      EssExam.paper2SectionAQuestions = this.mergeUnique(
        EssExam.paper2SectionAQuestions,
        [...sA1, ...sA2, ...sA3]
          .filter(q => q?.subject === 'ESS HL' && q?.assessmentTarget === 'ess2a')
          .map(normalize)
      );
      EssExam.paper2SectionBQuestions = this.mergeUnique(
        EssExam.paper2SectionBQuestions,
        sectionBParts.flat()
          .filter(q => q?.subject === 'ESS HL' && q?.assessmentTarget === 'ess2b')
          .map(normalize)
      );

      this.installCaseStudyNumbering();
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
        if (done || attempts >= 400) {
          clearInterval(timer);
          this.running = false;
        }
      };
      const timer = setInterval(tryExtend, 50);
      tryExtend();
    }
  };

  Extension.start();
})();
