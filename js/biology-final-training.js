// Additive Biology SL Final Exam Training data loader.
// Existing Paper 1 / Paper 2 logic remains untouched; extra questions are merged by unique id.
(() => {
  const BiologyFinalTraining = window.BiologyFinalTraining = {
    paper1Loaded: false,
    paper2Loaded: false,
    structuredPaper1BInstalled: false,
    running: false,

    unitAliases: {
      'D1.3 Mutations and gene editing': 'D1.3 Mutation and gene editing',
      'D4.2 Sustainability and change': 'D4.2 Stability and change'
    },

    legacyAssessmentTargets: {
      'BIO-P2-A1-002': 'paper2a',
      'BIO-P2-A2-001': 'paper2b',
      'BIO-P2-A2-002': 'paper2a',
      'BIO-P2-A2-003': 'paper2b',
      'BIO-P2-B1-003': 'paper2a',
      'BIO-P2-B3-001': 'paper2a',
      'BIO-P2-B3-002': 'paper2a',
      'BIO-P2-B3-003': 'paper2b',
      'BIO-P2-B4-003': 'paper2a',
      'BIO-P2-D1-002': 'paper2a',
      'BIO-P2-D2-002': 'paper2a',
      'BIO-P2-D3-003': 'paper2a'
    },

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('Biology Final Training extra data could not be loaded.', error);
        return [];
      }
    },

    normalizeUnit(unit) {
      if (typeof unit !== 'string') return unit;
      return this.unitAliases[unit] || unit;
    },

    normalizeQuestion(question) {
      if (!question || typeof question !== 'object') return question;

      if (typeof question.unit === 'string') {
        question.unit = this.normalizeUnit(question.unit);
      }
      if (typeof question.primaryUnit === 'string') {
        question.primaryUnit = this.normalizeUnit(question.primaryUnit);
      }
      if (Array.isArray(question.requiredUnits)) {
        question.requiredUnits = [...new Set(
          question.requiredUnits
            .filter(unit => typeof unit === 'string' && unit.trim())
            .map(unit => this.normalizeUnit(unit.trim()))
        )];
      }
      if (question.id && this.legacyAssessmentTargets[question.id]) {
        question.assessmentTarget = this.legacyAssessmentTargets[question.id];
      }
      return question;
    },

    mergeUnique(existing = [], additions = []) {
      const merged = (Array.isArray(existing) ? existing : [])
        .map(item => this.normalizeQuestion(item));
      const ids = new Set(merged.map(item => item?.id).filter(Boolean));
      (Array.isArray(additions) ? additions : []).forEach(rawItem => {
        const item = this.normalizeQuestion(rawItem);
        if (!item || !item.id || ids.has(item.id)) return;
        ids.add(item.id);
        merged.push(item);
      });
      return merged;
    },

    installStructuredPaper1B() {
      if (this.structuredPaper1BInstalled || typeof Paper1 === 'undefined') return false;

      const originalRenderPaper1B = Paper1.renderPaper1B;
      const originalSubmitPaper1B = Paper1.submitPaper1B;
      const originalUpdateSelfMarkScore = Paper1.updateSelfMarkScore;
      const originalSavePaper1BAttempt = Paper1.savePaper1BAttempt;

      const ensureStyles = () => {
        if (document.getElementById('paper1b-structured-styles')) return;
        const style = document.createElement('style');
        style.id = 'paper1b-structured-styles';
        style.textContent = `
          .paper1b-structured-intro {
            margin: 0 0 12px;
            color: #475467;
            font-weight: 750;
          }
          .paper1b-part-list {
            display: grid;
            gap: 12px;
            margin-top: 14px;
          }
          .paper1b-part {
            padding: 14px;
            border: 1px solid #dfe5ee;
            border-radius: 13px;
            background: #fbfcfe;
          }
          .paper1b-part-heading,
          .paper1b-part-feedback-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
          }
          .paper1b-part-heading strong,
          .paper1b-part-feedback-heading strong {
            color: #344054;
          }
          .paper1b-part-heading span,
          .paper1b-part-feedback-heading span {
            color: #667085;
            font-size: .78rem;
            font-weight: 800;
          }
          .paper1b-part-question {
            margin: 0 0 10px;
            color: #1d2939;
            font-weight: 700;
            line-height: 1.6;
          }
          .paper1b-part textarea {
            display: block;
            width: 100%;
            min-height: 105px;
            padding: 12px;
            border: 1px solid var(--border-strong);
            border-radius: 12px;
            background: #fff;
            color: var(--text);
            line-height: 1.55;
            resize: vertical;
          }
          .paper1b-part-feedback {
            margin-top: 12px;
            padding: 12px;
            border: 1px solid #e4e7ec;
            border-radius: 12px;
            background: #fbfcfe;
          }
          .paper1b-part-model {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e4e7ec;
          }
          .paper1b-part-model strong,
          .paper1b-part-model p {
            display: block;
          }
          @media (max-width: 720px) {
            .paper1b-part-heading,
            .paper1b-part-feedback-heading {
              flex-direction: column;
              gap: 3px;
            }
          }
        `;
        document.head.appendChild(style);
      };

      Paper1.isStructuredPaper1B = function(question = this.current) {
        return question?.assessmentTarget === 'paper1b'
          && Array.isArray(question?.parts)
          && question.parts.length > 0;
      };

      Paper1.getStructuredPaper1BMarkscheme = function(question = this.current) {
        if (!this.isStructuredPaper1B(question)) return [];
        return question.parts.flatMap(part =>
          Array.isArray(part?.markscheme) ? part.markscheme : []
        );
      };

      Paper1.renderPaper1B = function() {
        const legacyAnswer = document.getElementById('paper1b-answer');
        const legacyLabel = document.querySelector('label[for="paper1b-answer"]');

        if (!this.isStructuredPaper1B()) {
          if (legacyAnswer) legacyAnswer.style.display = '';
          if (legacyLabel) legacyLabel.style.display = '';
          return originalRenderPaper1B.call(this);
        }

        ensureStyles();

        const question = document.getElementById('paper1b-question');
        const marks = document.getElementById('paper1b-marks');
        const command = document.getElementById('paper1b-command');
        const feedback = document.getElementById('paper1b-feedback');
        if (!question) return;

        if (legacyAnswer) {
          legacyAnswer.value = '';
          legacyAnswer.style.display = 'none';
        }
        if (legacyLabel) legacyLabel.style.display = 'none';

        const parts = this.current.parts;
        const partsHtml = parts.map((part, index) => `
          <section class="paper1b-part">
            <div class="paper1b-part-heading">
              <strong>${this.escapeHtml(part.label || `Part ${index + 1}`)} · ${this.escapeHtml(part.commandTerm || 'Respond')}</strong>
              <span>${this.escapeHtml(part.marks ?? '—')} mark${Number(part.marks) === 1 ? '' : 's'}</span>
            </div>
            <p class="paper1b-part-question">${this.escapeHtml(part.question || '')}</p>
            <textarea
              rows="4"
              data-paper1b-part-answer="${index}"
              aria-label="${this.escapeHtml(part.label || `Part ${index + 1}`)} answer"
              placeholder="Write your answer for ${this.escapeHtml(part.label || `Part ${index + 1}`)}..."
            ></textarea>
          </section>
        `).join('');

        question.innerHTML = `
          ${this.renderStimulus(this.current.stimulus)}
          <p class="paper1b-structured-intro">${this.escapeHtml(this.current.question || 'Answer all parts.')}</p>
          <div class="paper1b-part-list">${partsHtml}</div>
        `;
        if (marks) marks.textContent = this.current.marks ?? parts.reduce((sum, part) => sum + (Number(part?.marks) || 0), 0);
        if (command) command.textContent = 'Multiple';
        if (feedback) feedback.innerHTML = '';
      };

      Paper1.submitPaper1B = function() {
        if (!this.isStructuredPaper1B()) {
          return originalSubmitPaper1B.call(this);
        }
        if (!this.current || this.section !== 'paper1b' || this.attemptSaved) return;

        const feedback = document.getElementById('paper1b-feedback');
        if (!feedback) return;

        const answers = [...document.querySelectorAll('[data-paper1b-part-answer]')];
        if (!answers.length || answers.some(answer => !answer.value.trim())) {
          feedback.innerHTML = '<div class="paper1-feedback-card"><strong>Attempt every part first.</strong><p>Write an answer for each part before revealing the markscheme.</p></div>';
          return;
        }

        let globalIndex = 0;
        const partFeedback = this.current.parts.map((part, partIndex) => {
          const markscheme = Array.isArray(part?.markscheme) ? part.markscheme : [];
          const markschemeJa = Array.isArray(part?.markschemeJa) ? part.markschemeJa : [];
          const points = markscheme.map((point, localIndex) => {
            const index = globalIndex;
            globalIndex += 1;
            const japanese = markschemeJa[localIndex]
              ? `<span class="paper1-markscheme-ja" lang="ja">日本語：${this.escapeHtml(markschemeJa[localIndex])}</span>`
              : '';
            return `
              <li class="paper1-self-mark-point">
                <label>
                  <input
                    type="checkbox"
                    data-paper1b-mark-point="${index}"
                    data-paper1b-part-index="${partIndex}"
                    onchange="Paper1.updateSelfMarkScore()"
                  >
                  <span class="paper1-self-mark-copy">
                    <span>${this.escapeHtml(point)}</span>
                    ${japanese}
                  </span>
                </label>
              </li>
            `;
          }).join('');

          const modelAnswer = part?.modelAnswer
            ? `<div class="paper1b-part-model"><strong>Model Answer</strong><p>${this.escapeHtml(part.modelAnswer)}</p>${part.modelAnswerJa ? `<p class="paper1-feedback-ja" lang="ja">日本語：${this.escapeHtml(part.modelAnswerJa)}</p>` : ''}</div>`
            : '';

          return `
            <section class="paper1b-part-feedback">
              <div class="paper1b-part-feedback-heading">
                <strong>${this.escapeHtml(part.label || `Part ${partIndex + 1}`)} · ${this.escapeHtml(part.commandTerm || 'Respond')}</strong>
                <span id="paper1b-part-score-${partIndex}">0 / ${this.escapeHtml(part.marks ?? markscheme.length)}</span>
              </div>
              <ol class="paper1-markscheme-list">${points}</ol>
              ${modelAnswer}
            </section>
          `;
        }).join('');

        const maxMarks = Number(this.current.marks)
          || this.current.parts.reduce((sum, part) => sum + (Number(part?.marks) || 0), 0);

        this.attemptSaved = false;
        feedback.innerHTML = `
          <div class="paper1-feedback-card">
            <strong>Markscheme</strong>
            <p>Self-mark each part separately, then save the total score.</p>
            ${partFeedback}
            ${this.renderSelfMarkPanel(maxMarks)}
          </div>
        `;
        this.updateSelfMarkScore();
      };

      Paper1.updateSelfMarkScore = function() {
        if (!this.isStructuredPaper1B()) {
          return originalUpdateSelfMarkScore.call(this);
        }

        const maxMarks = Number(this.current?.marks) || 0;
        const selected = document.querySelectorAll('#paper1b-feedback input[data-paper1b-mark-point]:checked').length;
        const score = Math.min(selected, maxMarks || selected);
        const total = document.getElementById('paper1b-self-score');
        if (total) total.textContent = `${score} / ${maxMarks}`;

        this.current.parts.forEach((part, partIndex) => {
          const partMax = Number(part?.marks) || 0;
          const partSelected = document.querySelectorAll(
            `#paper1b-feedback input[data-paper1b-part-index="${partIndex}"]:checked`
          ).length;
          const partScore = document.getElementById(`paper1b-part-score-${partIndex}`);
          if (partScore) partScore.textContent = `${Math.min(partSelected, partMax || partSelected)} / ${partMax}`;
        });
      };

      Paper1.savePaper1BAttempt = function() {
        if (!this.isStructuredPaper1B()) {
          return originalSavePaper1BAttempt.call(this);
        }

        const originalMarkscheme = this.current.markscheme;
        this.current.markscheme = this.getStructuredPaper1BMarkscheme();
        try {
          return originalSavePaper1BAttempt.call(this);
        } finally {
          if (typeof originalMarkscheme === 'undefined') delete this.current.markscheme;
          else this.current.markscheme = originalMarkscheme;
        }
      };

      ensureStyles();
      this.structuredPaper1BInstalled = true;
      return true;
    },

    async extendPaper1() {
      if (this.paper1Loaded) return true;
      if (typeof Paper1 === 'undefined' || !Paper1.initialized) return false;

      this.installStructuredPaper1B();

      const [paper1aBatch1, paper1bBatch1, paper1aBatch2, paper1bBatch2, paper1bBatch3, structuredPaper1B] = await Promise.all([
        this.fetchArray('data/paper1/biology-final-training-extra.json?v=3'),
        this.fetchArray('data/paper2/biology-final-data-extra.json?v=3'),
        this.fetchArray('data/paper1/biology-final-training-extra-2.json?v=3'),
        this.fetchArray('data/paper2/biology-final-data-extra-2.json?v=3'),
        this.fetchArray('data/paper2/biology-final-data-extra-3.json?v=3'),
        this.fetchArray('data/paper1/biology-paper1b-structured-v1.json?v=3')
      ]);
      const paper1aExtra = [...paper1aBatch1, ...paper1aBatch2];
      const paper1bExtra = [...paper1bBatch1, ...paper1bBatch2, ...paper1bBatch3, ...structuredPaper1B];

      Paper1.paper1aQuestions = this.mergeUnique(
        Paper1.paper1aQuestions,
        paper1aExtra.filter(question => question?.assessmentTarget === 'paper1a')
      );
      Paper1.paper1bQuestions = this.mergeUnique(
        Paper1.paper1bQuestions,
        paper1bExtra.filter(question => question?.assessmentTarget === 'paper1b')
      );
      this.paper1Loaded = true;

      if (typeof Paper1.renderLearnedUnitSelector === 'function') {
        Paper1.renderLearnedUnitSelector();
      }
      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    async extendPaper2() {
      if (this.paper2Loaded) return true;
      if (typeof Paper2 === 'undefined' || !Array.isArray(Paper2.allQuestions) || !Paper2.allQuestions.length) return false;

      const [batch1, batch2, batch3] = await Promise.all([
        this.fetchArray('data/paper2/biology-final-response-extra.json?v=3'),
        this.fetchArray('data/paper2/biology-final-response-extra-2.json?v=3'),
        this.fetchArray('data/paper2/biology-final-response-extra-3.json?v=3')
      ]);
      const extra = [...batch1, ...batch2, ...batch3];
      Paper2.allQuestions = this.mergeUnique(
        Paper2.allQuestions,
        extra.filter(question => ['paper2a', 'paper2b'].includes(question?.assessmentTarget))
      );
      this.paper2Loaded = true;

      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    start() {
      if (this.running) return;
      this.running = true;
      let attempts = 0;
      const tryExtend = async () => {
        attempts += 1;
        await this.extendPaper2();
        await this.extendPaper1();
        if ((this.paper1Loaded && this.paper2Loaded) || attempts >= 300) {
          window.clearInterval(timer);
          this.running = false;
        }
      };
      const timer = window.setInterval(tryExtend, 50);
      tryExtend();
    }
  };

  BiologyFinalTraining.start();
})();
