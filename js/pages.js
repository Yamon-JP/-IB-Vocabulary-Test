const Pages = {
  current: 'home',

  ensureEssExamModule() {
    if (typeof EssExam !== 'undefined') {
      EssExam.init();
      return;
    }

    if (document.getElementById('ess-exam-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-exam-script';
    script.src = 'js/ess-exam.js';
    script.onload = () => {
      if (typeof EssExam !== 'undefined') EssExam.init();
    };
    script.onerror = () => {
      console.warn('ESS exam foundation module could not be loaded.');
    };
    document.body.appendChild(script);
  },

  ensureEssPaper1FullMock() {
    if (typeof EssPaper1FullMock !== 'undefined') {
      EssPaper1FullMock.install();
      return;
    }
    if (document.getElementById('ess-paper1-full-mock-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-paper1-full-mock-script';
    script.async = false;
    script.src = 'js/ess-paper1-full-mock.js?v=1';
    script.onload = () => {
      if (typeof EssPaper1FullMock !== 'undefined') EssPaper1FullMock.install();
    };
    script.onerror = () => {
      console.warn('ESS Paper 1 Full Mock module could not be loaded. Existing ESS Paper 1 Practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssPaper2FullMock() {
    if (typeof EssPaper2FullMock !== 'undefined') {
      EssPaper2FullMock.install();
      return;
    }
    if (document.getElementById('ess-paper2-full-mock-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-paper2-full-mock-script';
    script.async = false;
    script.src = 'js/ess-paper2-full-mock.js?v=1';
    script.onload = () => {
      if (typeof EssPaper2FullMock !== 'undefined') EssPaper2FullMock.install();
    };
    script.onerror = () => {
      console.warn('ESS Paper 2 Full Mock module could not be loaded. Existing ESS Paper 2 Practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBStructured() {
    if (typeof Paper2 !== 'undefined' && typeof Paper2.isStructuredEssSectionB === 'function') return;
    if (document.getElementById('ess-section-b-structured-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-structured-script';
    script.src = 'js/ess-section-b-structured.js';
    script.onerror = () => {
      console.warn('ESS Section B structured-marking extension could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBStructuredSets() {
    const sources = [
      ['ess-section-b-structured-sets-1-3-script', 'js/ess-section-b-structured-sets-1-3.js'],
      ['ess-section-b-structured-sets-4-5-script', 'js/ess-section-b-structured-sets-4-5.js'],
      ['ess-section-b-structured-sets-6-7-script', 'js/ess-section-b-structured-sets-6-7.js']
    ];

    sources.forEach(([id, src]) => {
      if (document.getElementById(id)) return;
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.onerror = () => {
        console.warn(`ESS Section B structured definitions could not be loaded: ${src}`);
      };
      document.body.appendChild(script);
    });
  },

  ensureEssJapaneseLocalization() {
    if (typeof Paper2 !== 'undefined' && Paper2.essJapaneseLocalizationInstalled) return;
    if (document.getElementById('ess-japanese-localization-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-japanese-localization-script';
    script.src = 'js/ess-japanese-localization.js?v=3';
    script.onerror = () => {
      console.warn('ESS Japanese localization layer could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseAudit() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseAuditInstalled) return;
    if (document.getElementById('ess-section-b-japanese-audit-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-audit-script';
    script.src = 'js/ess-section-b-japanese-audit.js';
    script.onerror = () => {
      console.warn('ESS Section B Japanese audit layer could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseFinalPass() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseFinalPassV2Installed) return;
    if (document.getElementById('ess-section-b-japanese-final-pass-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-final-pass-script';
    script.src = 'js/ess-section-b-japanese-final-pass-v2.js?v=2';
    script.onerror = () => {
      console.warn('ESS Section B final Japanese cleanup v2 could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseRenderGuard() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseRenderGuardInstalled) return;
    if (document.getElementById('ess-section-b-japanese-render-guard-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-render-guard-script';
    script.src = 'js/ess-section-b-japanese-render-guard.js?v=1';
    script.onerror = () => {
      console.warn('ESS Section B Japanese render guard could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBZeroBareEnglish() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBZeroBareEnglishInstalled) return;
    if (document.getElementById('ess-section-b-zero-bare-english-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-zero-bare-english-script';
    script.src = 'js/ess-section-b-japanese-zero-bare-english.js?v=1';
    script.onerror = () => {
      console.warn('ESS Section B final bare-English cleanup could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBFinalJapaneseAudit() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBFinalJapaneseAuditInstalled) return;
    if (document.getElementById('ess-section-b-final-japanese-audit-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-final-japanese-audit-script';
    script.src = 'js/ess-section-b-japanese-final-audit.js?v=1';
    script.onerror = () => {
      console.warn('ESS Section B final Japanese audit could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEssSectionBJapaneseDomSweep() {
    if (typeof Paper2 !== 'undefined' && Paper2.essSectionBJapaneseDomSweepInstalled) return;
    if (document.getElementById('ess-section-b-japanese-dom-sweep-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-section-b-japanese-dom-sweep-script';
    script.src = 'js/ess-section-b-japanese-dom-sweep.js?v=2';
    script.onerror = () => {
      console.warn('ESS Section B Japanese DOM sweep could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEnglishBPaper1() {
    if (typeof EnglishBPaper1 !== 'undefined') {
      EnglishBPaper1.init();
      return;
    }
    if (document.getElementById('english-b-paper1-script')) return;

    const script = document.createElement('script');
    script.id = 'english-b-paper1-script';
    script.async = false;
    script.src = 'js/english-b-paper1.js?v=1';
    script.onerror = () => {
      console.warn('English B Paper 1 Writing module could not be loaded. Existing practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEnglishBPaper2Reading() {
    if (typeof EnglishBPaper2Reading !== 'undefined') {
      EnglishBPaper2Reading.init();
      return;
    }
    if (document.getElementById('english-b-paper2-reading-script')) return;

    const script = document.createElement('script');
    script.id = 'english-b-paper2-reading-script';
    script.async = false;
    script.src = 'js/english-b-paper2-reading.js?v=1';
    script.onerror = () => {
      console.warn('English B Paper 2 Reading module could not be loaded. Existing practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEnglishBPaper2Listening() {
    if (typeof EnglishBPaper2Listening !== 'undefined') {
      EnglishBPaper2Listening.init();
      return;
    }
    if (document.getElementById('english-b-paper2-listening-script')) return;

    const script = document.createElement('script');
    script.id = 'english-b-paper2-listening-script';
    script.async = false;
    script.src = 'js/english-b-paper2-listening.js?v=1';
    script.onerror = () => {
      console.warn('English B Paper 2 Listening module could not be loaded. Existing Listening practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureEnglishBPaper2ListeningVoice() {
    if (typeof EnglishBPaper2Listening !== 'undefined' && EnglishBPaper2Listening.voiceAccentExtensionInstalled) return;
    if (document.getElementById('english-b-paper2-listening-voice-script')) return;

    const script = document.createElement('script');
    script.id = 'english-b-paper2-listening-voice-script';
    script.async = false;
    script.src = 'js/english-b-paper2-listening-voice.js?v=3';
    script.onerror = () => {
      console.warn('English B Paper 2 Listening voice selector could not be loaded. Existing Listening practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureUIOptimizations() {
    if (typeof UIOptimizations !== 'undefined') {
      UIOptimizations.install();
      return;
    }

    if (document.getElementById('ui-optimizations-script')) return;

    const script = document.createElement('script');
    script.id = 'ui-optimizations-script';
    script.src = 'js/ui-optimizations.js';
    script.onerror = () => {
      console.warn('UI optimization layer could not be loaded.');
    };
    document.body.appendChild(script);
  },

  ensureCourseCoverage() {
    if (typeof CourseCoverage !== 'undefined') {
      CourseCoverage.install();
      return;
    }

    if (document.getElementById('course-coverage-script')) return;

    const script = document.createElement('script');
    script.id = 'course-coverage-script';
    script.src = 'js/course-coverage.js';
    script.onload = () => {
      if (typeof CourseCoverage !== 'undefined') CourseCoverage.install();
    };
    script.onerror = () => {
      console.warn('Course Coverage module could not be loaded. Existing learned-unit controls remain available.');
    };
    document.body.appendChild(script);
  },

  ensureEssCourseCoverage() {
    if (typeof EssCourseCoverage !== 'undefined') {
      EssCourseCoverage.start();
      return;
    }

    if (document.getElementById('ess-course-coverage-script')) return;

    const script = document.createElement('script');
    script.id = 'ess-course-coverage-script';
    script.src = 'js/ess-course-coverage.js';
    script.onload = () => {
      if (typeof EssCourseCoverage !== 'undefined') EssCourseCoverage.start();
    };
    script.onerror = () => {
      console.warn('ESS Course Coverage extension could not be loaded. Existing ESS practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureBiologyPaper1BMock() {
    if (typeof BiologyPaper1BMock !== 'undefined') {
      BiologyPaper1BMock.install();
      return;
    }
    if (document.getElementById('biology-paper1b-mock-script')) return;

    const script = document.createElement('script');
    script.id = 'biology-paper1b-mock-script';
    script.async = false;
    script.src = 'js/biology-paper1b-mock.js?v=2';
    script.onload = () => {
      if (typeof BiologyPaper1BMock !== 'undefined') BiologyPaper1BMock.install();
    };
    script.onerror = () => {
      console.warn('Biology Paper 1B Mock module could not be loaded. Existing Paper 1B Practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureBiologyPaper1FullMock() {
    if (typeof BiologyPaper1FullMock !== 'undefined') {
      BiologyPaper1FullMock.install();
      return;
    }
    if (document.getElementById('biology-paper1-full-mock-script')) return;

    const script = document.createElement('script');
    script.id = 'biology-paper1-full-mock-script';
    script.async = false;
    script.src = 'js/biology-paper1-full-mock.js?v=1';
    script.onload = () => {
      if (typeof BiologyPaper1FullMock !== 'undefined') BiologyPaper1FullMock.install();
    };
    script.onerror = () => {
      console.warn('Biology Paper 1 Full Mock module could not be loaded. Existing Paper 1 Practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureBiologyPaper2FullMock() {
    if (typeof BiologyPaper2FullMock !== 'undefined') {
      BiologyPaper2FullMock.install();
      return;
    }
    if (document.getElementById('biology-paper2-full-mock-script')) return;

    const script = document.createElement('script');
    script.id = 'biology-paper2-full-mock-script';
    script.async = false;
    script.src = 'js/biology-paper2-full-mock.js?v=1';
    script.onload = () => {
      if (typeof BiologyPaper2FullMock !== 'undefined') BiologyPaper2FullMock.install();
    };
    script.onerror = () => {
      console.warn('Biology Paper 2 Full Mock module could not be loaded. Existing Paper 2 Practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureAdaptiveTraining() {
    if (typeof AdaptiveTraining !== 'undefined') {
      AdaptiveTraining.install();
      return;
    }
    if (document.getElementById('adaptive-training-script')) return;

    const script = document.createElement('script');
    script.id = 'adaptive-training-script';
    script.async = false;
    script.src = 'js/adaptive-training.js?v=1';
    script.onload = () => {
      if (typeof AdaptiveTraining !== 'undefined') AdaptiveTraining.install();
    };
    script.onerror = () => {
      console.warn('Adaptive Training module could not be loaded. Existing practice remains available.');
    };
    document.body.appendChild(script);
  },

  ensureTrainingPoints() {
    if (typeof TrainingPoints !== 'undefined') {
      TrainingPoints.install();
      return;
    }
    if (document.getElementById('training-points-script')) return;

    const script = document.createElement('script');
    script.id = 'training-points-script';
    script.async = false;
    script.src = 'js/training-points.js?v=1';
    script.onload = () => {
      if (typeof TrainingPoints !== 'undefined') TrainingPoints.install();
    };
    script.onerror = () => {
      console.warn('Overall Daily Training module could not be loaded. Existing Daily Missions remain available.');
    };
    document.body.appendChild(script);
  },

  ensureFinalExamProgressV2() {
    if (typeof FinalExamProgressV2 !== 'undefined') {
      FinalExamProgressV2.install();
      return;
    }
    if (document.getElementById('final-exam-progress-v2-script')) return;

    const script = document.createElement('script');
    script.id = 'final-exam-progress-v2-script';
    script.async = false;
    script.src = 'js/final-exam-progress-v2.js?v=1';
    script.onload = () => {
      if (typeof FinalExamProgressV2 !== 'undefined') FinalExamProgressV2.install();
    };
    script.onerror = () => {
      console.warn('Final Exam Progress v2 could not be loaded. Existing Progress remains available.');
    };
    document.body.appendChild(script);
  },

  ensurePaper2ProgressView() {
    if (typeof Paper2ProgressView !== 'undefined') {
      Paper2ProgressView.render();
      return;
    }

    if (document.getElementById('paper2-progress-view-script')) return;

    const script = document.createElement('script');
    script.id = 'paper2-progress-view-script';
    script.src = 'js/paper2-progress-view.js';
    script.onload = () => {
      if (typeof Paper2ProgressView !== 'undefined') Paper2ProgressView.render();
    };
    script.onerror = () => {
      console.warn('Paper 2 progress view could not be loaded.');
    };
    document.body.appendChild(script);
  },

  show(page) {
    document.querySelectorAll('.page').forEach(section => {
      section.style.display = 'none';
    });

    const target = document.getElementById(`${page}-page`);
    if (target) {
      target.style.display = 'block';
      this.current = page;

      document.body.classList.remove('practice-active');

      if (typeof Progress !== 'undefined') {
        Progress.render();
      }

      if (page === 'statistics') {
        this.ensurePaper2ProgressView();
      }
    }
  },

  init() {
    this.ensureEssExamModule();
    this.ensureEssPaper1FullMock();
    this.ensureEssPaper2FullMock();
    this.ensureEssSectionBStructured();
    this.ensureEssSectionBStructuredSets();
    this.ensureEssJapaneseLocalization();
    this.ensureEssSectionBJapaneseAudit();
    this.ensureEssSectionBJapaneseFinalPass();
    this.ensureEssSectionBJapaneseRenderGuard();
    this.ensureEssSectionBZeroBareEnglish();
    this.ensureEssSectionBFinalJapaneseAudit();
    this.ensureEssSectionBJapaneseDomSweep();
    this.ensureEnglishBPaper1();
    this.ensureEnglishBPaper2Reading();
    this.ensureEnglishBPaper2Listening();
    this.ensureEnglishBPaper2ListeningVoice();
    this.ensureUIOptimizations();
    this.ensureCourseCoverage();
    this.ensureEssCourseCoverage();
    this.ensureBiologyPaper1BMock();
    this.ensureBiologyPaper1FullMock();
    this.ensureBiologyPaper2FullMock();
    this.ensureAdaptiveTraining();
    this.ensureTrainingPoints();
    this.ensureFinalExamProgressV2();
    this.show('home');
  }
};