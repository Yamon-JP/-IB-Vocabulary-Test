// ESS HL Paper 2 Section B AI Instructor frontend.
// Phase 8A: AI grading only. Progress storage remains unchanged.
(() => {
  const EssAIInstructor = window.EssAIInstructor = {
    installed: false,
    grading: false,
    endpointKey: 'ib_ai_instructor_endpoint',
    observer: null,

    endpoint() {
      const configured = String(window.IB_AI_INSTRUCTOR_ENDPOINT || '').trim();
      if (configured) return configured.replace(/\/$/, '');
      try {
        return String(localStorage.getItem(this.endpointKey) || '').trim().replace(/\/$/, '');
      } catch (_) {
        return '';
      }
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    isEligible() {
      if (typeof Paper2 === 'undefined' || !Paper2.current) return false;
      if (typeof Paper2.isEssSectionB === 'function') return Boolean(Paper2.isEssSectionB());
      return Paper2.current.subject === 'ESS HL' && Paper2.current.assessmentTarget === 'ess2b';
    },

    install() {
      if (this.installed) return true;
      if (typeof Paper2 === 'undefined' || typeof Paper2.render !== 'function') return false;

      const originalRender = Paper2.render.bind(Paper2);
      Paper2.render = (...args) => {
        const result = originalRender(...args);
        this.mountControls(true);
        return result;
      };

      this.installed = true;
      this.mountControls(false);
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      return true;
    },

    mountControls(resetResult = false) {
      const actions = document.querySelector('#paper2-practice-panel .paper2-actions');
      if (!actions) return;

      const existingButton = document.getElementById('ess-ai-grade-button');
      const existingResult = document.getElementById('ess-ai-result');

      if (!this.isEligible()) {
        existingButton?.remove();
        existingResult?.remove();
        return;
      }

      let button = existingButton;
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.id = 'ess-ai-grade-button';
        button.className = 'ess-ai-grade-button';
        button.textContent = 'Grade with AI Instructor';
        button.addEventListener('click', () => this.grade());
        actions.insertBefore(button, actions.firstChild);
      }

      let result = existingResult;
      if (!result) {
        result = document.createElement('section');
        result.id = 'ess-ai-result';
        result.className = 'ess-ai-result';
        result.setAttribute('aria-live', 'polite');
        actions.insertAdjacentElement('afterend', result);
      } else if (resetResult) {
        result.innerHTML = '';
      }

      this.setBusy(this.grading);
    },

    setBusy(isBusy) {
      this.grading = Boolean(isBusy);
      const button = document.getElementById('ess-ai-grade-button');
      if (!button) return;
      button.disabled = this.grading;
      button.textContent = this.grading ? 'AI Instructor is grading…' : 'Grade with AI Instructor';
    },

    showMessage(title, message, kind = 'info') {
      const result = document.getElementById('ess-ai-result');
      if (!result) return;
      result.innerHTML = `
        <div class="ess-ai-message ${this.escapeHtml(kind)}">
          <strong>${this.escapeHtml(title)}</strong>
          <p>${this.escapeHtml(message)}</p>
        </div>`;
    },

    countWords(text) {
      return (String(text || '').match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || []).length;
    },

    buildPayload() {
      if (!this.isEligible()) return null;
      const task = Paper2.current;
      const answerElement = document.getElementById('paper2-answer');
      if (!task || !answerElement) return null;
      const answer = String(answerElement.value || '').trim();
      const rubricGroups = (Array.isArray(task.rubricGroups) ? task.rubricGroups : []).map(group => ({
        title: String(group?.title || ''),
        titleJa: String(group?.titleJa || ''),
        start: Number(group?.start) || 0,
        count: Number(group?.count) || 0
      }));

      return {
        task: {
          id: task.id || null,
          chapter: task.chapter || task.topic || '',
          unit: task.unit || '',
          prompt: task.question || '',
          commandTerm: task.commandTerm || '',
          marks: Number(task.marks) || 20,
          requiredUnits: Array.isArray(task.requiredUnits) ? task.requiredUnits : [],
          rubricGroups,
          referencePoints: Array.isArray(task.markscheme) ? task.markscheme : []
        },
        answer,
        wordCount: this.countWords(answer)
      };
    },

    validateCriterion(value) {
      if (!value || typeof value !== 'object') return null;
      const score = Number(value.score);
      if (!Number.isInteger(score) || score < 0 || score > 4) return null;
      const rationale = String(value.rationale || '').trim();
      const rationaleJa = String(value.rationaleJa || '').trim();
      const explanationJa = String(value.explanationJa || '').trim();
      const strengths = Array.isArray(value.strengths) ? value.strengths.map(String).filter(Boolean).slice(0, 3) : [];
      const strengthsJa = Array.isArray(value.strengthsJa) ? value.strengthsJa.map(String).filter(Boolean).slice(0, 3) : [];
      const improvements = Array.isArray(value.improvements) ? value.improvements.map(String).filter(Boolean).slice(0, 3) : [];
      const improvementsJa = Array.isArray(value.improvementsJa) ? value.improvementsJa.map(String).filter(Boolean).slice(0, 3) : [];
      if (!rationale) return null;
      return {
        score,
        rationale,
        rationaleJa,
        explanationJa,
        strengths,
        strengthsJa,
        improvements,
        improvementsJa
      };
    },

    normalizeGrading(payload) {
      const grading = payload?.grading;
      if (!grading || typeof grading !== 'object') return null;
      const knowledgeTerminology = this.validateCriterion(grading.knowledgeTerminology);
      const applicationExamples = this.validateCriterion(grading.applicationExamples);
      const analysisSystems = this.validateCriterion(grading.analysisSystems);
      const evaluationTradeoffs = this.validateCriterion(grading.evaluationTradeoffs);
      const synthesisJudgement = this.validateCriterion(grading.synthesisJudgement);
      if (!knowledgeTerminology || !applicationExamples || !analysisSystems || !evaluationTradeoffs || !synthesisJudgement) return null;

      const topImprovements = Array.isArray(grading.topImprovements)
        ? grading.topImprovements.map(String).filter(Boolean).slice(0, 3)
        : [];
      const topImprovementsJa = Array.isArray(grading.topImprovementsJa)
        ? grading.topImprovementsJa.map(String).filter(Boolean).slice(0, 3)
        : [];

      return {
        knowledgeTerminology,
        applicationExamples,
        analysisSystems,
        evaluationTradeoffs,
        synthesisJudgement,
        total: knowledgeTerminology.score
          + applicationExamples.score
          + analysisSystems.score
          + evaluationTradeoffs.score
          + synthesisJudgement.score,
        topImprovements,
        topImprovementsJa,
        nextStep: String(grading.nextStep || '').trim(),
        nextStepJa: String(grading.nextStepJa || '').trim(),
        overallComment: String(grading.overallComment || '').trim(),
        overallCommentJa: String(grading.overallCommentJa || '').trim(),
        meta: payload?.meta || {}
      };
    },

    bilingualListHtml(title, items, itemsJa) {
      if (!items.length) return '';
      return `
        <div class="ess-ai-list">
          <strong>${this.escapeHtml(title)}</strong>
          <ul>${items.map((item, index) => `
            <li>
              ${this.escapeHtml(item)}
              ${itemsJa[index] ? `<div class="ess-ai-ja">🇯🇵 ${this.escapeHtml(itemsJa[index])}</div>` : ''}
            </li>`).join('')}
          </ul>
        </div>`;
    },

    criterionHtml(label, criterion) {
      return `
        <article class="ess-ai-criterion">
          <div class="ess-ai-criterion-head">
            <strong>${this.escapeHtml(label)}</strong>
            <span>${criterion.score} / 4</span>
          </div>
          <p>${this.escapeHtml(criterion.rationale)}</p>
          ${criterion.rationaleJa ? `<p class="ess-ai-ja"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(criterion.rationaleJa)}</p>` : ''}
          ${criterion.explanationJa ? `<p class="ess-ai-ja"><strong>🇯🇵 簡単解説：</strong>${this.escapeHtml(criterion.explanationJa)}</p>` : ''}
          ${this.bilingualListHtml('Strengths', criterion.strengths, criterion.strengthsJa)}
          ${this.bilingualListHtml('Improve', criterion.improvements, criterion.improvementsJa)}
        </article>`;
    },

    renderGrading(grading) {
      const result = document.getElementById('ess-ai-result');
      if (!result) return;
      const model = String(grading.meta?.model || '').trim();
      const rubricVersion = String(grading.meta?.rubricVersion || 'ess-paper2b-v1').trim();
      result.innerHTML = `
        <section class="ess-ai-panel">
          <div class="ess-ai-header">
            <div>
              <p class="eyebrow">AI INSTRUCTOR</p>
              <h4>ESS HL · Paper 2 Section B feedback</h4>
              <p class="muted">20-mark training assessment across five essay skills. This is not an official IB grade.</p>
              <p class="muted">英語の評価の直後に、日本語訳と短い解説を表示します。</p>
            </div>
            <div class="ess-ai-total"><strong>${grading.total}</strong><span>/ 20</span></div>
          </div>
          <div class="ess-ai-criteria">
            ${this.criterionHtml('Knowledge & terminology', grading.knowledgeTerminology)}
            ${this.criterionHtml('Application & relevant examples', grading.applicationExamples)}
            ${this.criterionHtml('Analysis / systems / HL-lens connections', grading.analysisSystems)}
            ${this.criterionHtml('Evaluation / perspectives / trade-offs', grading.evaluationTradeoffs)}
            ${this.criterionHtml('Synthesis / justified judgement', grading.synthesisJudgement)}
          </div>
          <div class="ess-ai-priority">
            <strong>Top 3 Improvements</strong>
            ${grading.topImprovements.length
              ? `<ol>${grading.topImprovements.map((item, index) => `
                <li>
                  ${this.escapeHtml(item)}
                  ${grading.topImprovementsJa[index] ? `<div class="ess-ai-ja">🇯🇵 ${this.escapeHtml(grading.topImprovementsJa[index])}</div>` : ''}
                </li>`).join('')}</ol>`
              : '<p class="muted">No priority list was returned.</p>'}
          </div>
          ${grading.nextStep ? `
            <div class="ess-ai-next">
              <strong>Next step</strong>
              <p>${this.escapeHtml(grading.nextStep)}</p>
              ${grading.nextStepJa ? `<p class="ess-ai-ja"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(grading.nextStepJa)}</p>` : ''}
            </div>` : ''}
          ${grading.overallComment ? `
            <div class="ess-ai-overall">
              <strong>Instructor comment</strong>
              <p>${this.escapeHtml(grading.overallComment)}</p>
              ${grading.overallCommentJa ? `<p class="ess-ai-ja"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(grading.overallCommentJa)}</p>` : ''}
            </div>` : ''}
          <div class="ess-ai-meta">Rubric ${this.escapeHtml(rubricVersion)}${model ? ` · ${this.escapeHtml(model)}` : ''} · Phase 8A training result only; not saved to Progress.</div>
        </section>`;
    },

    async grade() {
      if (this.grading) return;
      const payload = this.buildPayload();
      if (!payload) {
        this.showMessage('AI Instructor unavailable', 'Open an ESS HL Paper 2 Section B question first.', 'error');
        return;
      }
      if (!payload.answer) {
        this.showMessage('Write an answer first', 'Enter your ESS Section B essay before asking the AI Instructor to grade it.', 'warning');
        return;
      }

      const endpoint = this.endpoint();
      if (!endpoint) {
        this.showMessage(
          'AI Instructor setup required',
          'The secure AI grading endpoint has not been configured yet. Your existing self-mark remains available.',
          'warning'
        );
        return;
      }

      this.setBusy(true);
      this.showMessage('AI Instructor', 'Reviewing your essay across the five ESS training-rubric areas…');
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 75000);

      try {
        const response = await fetch(`${endpoint}/grade/ess-paper2b`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) {
          throw new Error(data?.error || `AI grading request failed (${response.status})`);
        }
        const grading = this.normalizeGrading(data);
        if (!grading) throw new Error('AI Instructor returned an invalid ESS grading result.');
        this.renderGrading(grading);
      } catch (error) {
        const timedOut = error?.name === 'AbortError';
        const message = timedOut
          ? 'The grading request timed out. Your essay is still on this page, so you can try again.'
          : (error?.message || 'The secure AI grading service is unavailable or returned an invalid response.');
        this.showMessage('AI grading could not be completed', message, 'error');
        console.warn('ESS AI Instructor request failed.', error);
      } finally {
        window.clearTimeout(timeout);
        this.setBusy(false);
      }
    },

    boot() {
      if (this.install()) return;
      this.observer = new MutationObserver(() => {
        this.install();
      });
      this.observer.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener('load', () => this.install(), { once: true });
    }
  };

  EssAIInstructor.boot();
})();
