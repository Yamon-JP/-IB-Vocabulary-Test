// ESS HL Paper 2 Section B AI Instructor frontend.
// Phase 8B-1: AI grading with Progress integration and duplicate prevention.
(() => {
  const EssAIInstructor = window.EssAIInstructor = {
    installed: false,
    grading: false,
    endpointKey: 'ib_ai_instructor_endpoint',
    progressStoreKey: 'ib_paper2_progress',
    observer: null,
    mountQueued: false,
    selfMarkPatched: false,
    selfMarkClickGuardInstalled: false,

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

    answerFingerprint(payload) {
      const source = [payload?.task?.id || '', payload?.answer || ''].join('|');
      let hash = 2166136261;
      for (let index = 0; index < source.length; index += 1) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
    },

    feedbackSnapshot(grading) {
      const criterion = value => ({
        score: value.score,
        rationale: value.rationale,
        rationaleJa: value.rationaleJa,
        explanationJa: value.explanationJa,
        strengths: [...value.strengths],
        strengthsJa: [...value.strengthsJa],
        improvements: [...value.improvements],
        improvementsJa: [...value.improvementsJa]
      });
      return {
        knowledgeTerminology: criterion(grading.knowledgeTerminology),
        applicationExamples: criterion(grading.applicationExamples),
        analysisSystems: criterion(grading.analysisSystems),
        evaluationTradeoffs: criterion(grading.evaluationTradeoffs),
        synthesisJudgement: criterion(grading.synthesisJudgement),
        topImprovements: [...grading.topImprovements],
        topImprovementsJa: [...grading.topImprovementsJa],
        nextStep: grading.nextStep,
        nextStepJa: grading.nextStepJa,
        overallComment: grading.overallComment,
        overallCommentJa: grading.overallCommentJa
      };
    },

    compactHistoryItem(item) {
      const scores = item?.scores || {};
      const keys = ['knowledgeTerminology', 'applicationExamples', 'analysisSystems', 'evaluationTradeoffs', 'synthesisJudgement'];
      const normalizedScores = {};
      for (const key of keys) {
        const value = Number(scores[key]);
        if (!Number.isFinite(value)) return null;
        normalizedScores[key] = value;
      }
      const score = Number(item?.score);
      if (!Number.isFinite(score)) return null;
      return {
        gradedAt: item?.gradedAt || item?.updatedAt || item?.createdAt || new Date().toISOString(),
        score,
        maxMarks: Number(item?.maxMarks) || 20,
        scores: normalizedScores
      };
    },

    previousGradeSnapshot(attempt) {
      if (!attempt || attempt.gradingSource !== 'ai-instructor') return null;
      return this.compactHistoryItem({
        gradedAt: attempt.updatedAt || attempt.createdAt,
        score: attempt.score,
        maxMarks: attempt.maxMarks,
        scores: attempt.scores
      });
    },

    compactStoredHistory() {
      if (typeof Storage === 'undefined') return;
      const saved = Storage.load(this.progressStoreKey);
      if (!Array.isArray(saved?.attempts)) return;
      let changed = false;
      const attempts = saved.attempts.map(attempt => {
        if (!Array.isArray(attempt?.aiHistory)) return attempt;
        const compact = attempt.aiHistory
          .map(item => this.compactHistoryItem(item))
          .filter(Boolean)
          .slice(-10);
        if (JSON.stringify(compact) === JSON.stringify(attempt.aiHistory)) return attempt;
        changed = true;
        return { ...attempt, aiHistory: compact };
      });
      if (changed) Storage.save(this.progressStoreKey, { ...saved, attempts });
    },

    tagLatestSelfMark(payload) {
      if (typeof Storage === 'undefined' || !payload?.task?.id) return;
      const saved = Storage.load(this.progressStoreKey) || {};
      const attempts = Array.isArray(saved.attempts) ? [...saved.attempts] : [];
      if (!attempts.length) return;
      const lastIndex = attempts.length - 1;
      const lastAttempt = attempts[lastIndex];
      if (
        lastAttempt?.gradingSource === 'ai-instructor'
        || lastAttempt?.questionId !== payload.task.id
        || lastAttempt?.assessmentTarget !== 'ess2b'
      ) return;
      const fingerprint = this.answerFingerprint(payload);
      if (lastAttempt?.answerFingerprint === fingerprint) return;
      attempts[lastIndex] = {
        ...lastAttempt,
        answerFingerprint: fingerprint,
        wordCount: Number(payload.wordCount) || 0
      };
      Storage.save(this.progressStoreKey, { ...saved, attempts });
    },

    findSavedAttempt(payload) {
      if (typeof Storage === 'undefined' || !payload?.task?.id) return null;
      const saved = Storage.load(this.progressStoreKey) || {};
      const attempts = Array.isArray(saved.attempts) ? saved.attempts : [];
      const fingerprint = this.answerFingerprint(payload);
      return [...attempts].reverse().find(attempt =>
        attempt?.questionId === payload.task.id
        && attempt?.answerFingerprint === fingerprint
      ) || null;
    },

    showDuplicateSelfMark(existing) {
      if (!existing || typeof Paper2 === 'undefined') return;
      Paper2.attemptSaved = true;
      document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]').forEach(input => {
        input.disabled = true;
      });
      const markbandSelect = document.getElementById('paper2-markband-score');
      if (markbandSelect) markbandSelect.disabled = true;
      const saveButton = document.getElementById('paper2-save-score');
      const status = document.getElementById('paper2-save-status');
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = existing.gradingSource === 'ai-instructor' ? 'AI Score Saved' : 'Score Saved';
      }
      if (status) {
        status.textContent = existing.gradingSource === 'ai-instructor'
          ? `This exact response already has an AI score (${Number(existing.score) || 0} / ${Number(existing.maxMarks) || 20}) in Progress.`
          : `This exact response is already saved (${Number(existing.score) || 0} / ${Number(existing.maxMarks) || 20}).`;
      }
    },

    installSelfMarkClickGuard() {
      if (this.selfMarkClickGuardInstalled) return;
      document.addEventListener('click', event => {
        const button = event.target?.closest?.('#paper2-save-score');
        if (!button || !this.isEligible()) return;
        const payload = this.buildPayload();
        if (!payload) return;
        const existing = this.findSavedAttempt(payload);
        if (existing) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          this.showDuplicateSelfMark(existing);
          return;
        }
        window.setTimeout(() => {
          if (typeof Paper2 !== 'undefined' && Paper2.attemptSaved) this.tagLatestSelfMark(payload);
        }, 0);
      }, true);
      this.selfMarkClickGuardInstalled = true;
    },

    updateSelfMarkUi(attempt) {
      if (!attempt) return;
      document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]').forEach(input => {
        input.disabled = true;
      });
      const markbandSelect = document.getElementById('paper2-markband-score');
      if (markbandSelect) markbandSelect.disabled = true;
      const saveButton = document.getElementById('paper2-save-score');
      const status = document.getElementById('paper2-save-status');
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'AI Score Saved';
      }
      if (status) status.textContent = `${Number(attempt.score) || 0} / ${Number(attempt.maxMarks) || 20} AI score saved to Progress.`;
    },

    saveProgress(grading, payload) {
      if (typeof Storage === 'undefined' || !payload?.task?.id) return null;
      const saved = Storage.load(this.progressStoreKey) || {};
      const attempts = Array.isArray(saved.attempts) ? [...saved.attempts] : [];
      const fingerprint = this.answerFingerprint(payload);
      const now = new Date().toISOString();
      const maxMarks = Number(payload.task.marks) || 20;
      const scores = {
        knowledgeTerminology: grading.knowledgeTerminology.score,
        applicationExamples: grading.applicationExamples.score,
        analysisSystems: grading.analysisSystems.score,
        evaluationTradeoffs: grading.evaluationTradeoffs.score,
        synthesisJudgement: grading.synthesisJudgement.score
      };
      const aiAttempt = {
        schemaVersion: Number(saved.schemaVersion) || 1,
        attemptId: `AI-${payload.task.id}-${Date.now()}`,
        questionId: payload.task.id,
        subject: 'ESS HL',
        assessmentTarget: 'ess2b',
        chapter: payload.task.chapter || null,
        unit: payload.task.unit || null,
        commandTerm: payload.task.commandTerm || null,
        questionType: 'written',
        wordCount: Number(payload.wordCount) || 0,
        scores,
        score: grading.total,
        maxMarks,
        percentage: maxMarks ? Math.round((grading.total / maxMarks) * 100) : 0,
        evaluator: { type: 'ai-instructor', version: 1 },
        gradingSource: 'ai-instructor',
        answerFingerprint: fingerprint,
        aiFeedback: this.feedbackSnapshot(grading),
        aiMeta: {
          provider: String(grading.meta?.provider || ''),
          model: String(grading.meta?.model || ''),
          rubricVersion: String(grading.meta?.rubricVersion || 'ess-paper2b-v1')
        },
        aiHistory: [],
        firstGradedAt: now,
        createdAt: now,
        updatedAt: now
      };

      let replaceIndex = -1;
      for (let index = attempts.length - 1; index >= 0; index -= 1) {
        const attempt = attempts[index];
        if (attempt?.questionId === payload.task.id && attempt?.answerFingerprint === fingerprint) {
          replaceIndex = index;
          break;
        }
      }

      if (replaceIndex >= 0) {
        const previous = attempts[replaceIndex];
        aiAttempt.attemptId = previous.attemptId || aiAttempt.attemptId;
        if (previous.gradingSource === 'ai-instructor') {
          aiAttempt.firstGradedAt = previous.firstGradedAt || previous.createdAt || now;
          const history = Array.isArray(previous.aiHistory)
            ? previous.aiHistory.map(item => this.compactHistoryItem(item)).filter(Boolean).slice(-9)
            : [];
          const previousGrade = this.previousGradeSnapshot(previous);
          if (previousGrade) history.push(previousGrade);
          aiAttempt.aiHistory = history.slice(-10);
        }
        attempts[replaceIndex] = aiAttempt;
      } else {
        attempts.push(aiAttempt);
      }

      Storage.save(this.progressStoreKey, {
        schemaVersion: Number(saved.schemaVersion) || 1,
        attempts
      });

      this.updateSelfMarkUi(aiAttempt);
      if (typeof FinalExamProgressV2 !== 'undefined' && typeof FinalExamProgressV2.render === 'function') {
        FinalExamProgressV2.render();
      }
      return aiAttempt;
    },

    isEligible() {
      if (typeof Paper2 === 'undefined' || !Paper2.current) return false;
      if (typeof Paper2.isEssSectionB === 'function') return Boolean(Paper2.isEssSectionB());
      return Paper2.current.subject === 'ESS HL' && Paper2.current.assessmentTarget === 'ess2b';
    },

    install() {
      if (typeof Paper2 === 'undefined' || typeof Paper2.render !== 'function') return false;

      this.installSelfMarkClickGuard();

      if (!this.selfMarkPatched && typeof Paper2.saveSelfMarkAttempt === 'function') {
        const originalSaveSelfMarkAttempt = Paper2.saveSelfMarkAttempt.bind(Paper2);
        Paper2.saveSelfMarkAttempt = (...args) => {
          if (!this.isEligible()) return originalSaveSelfMarkAttempt(...args);
          const payload = this.buildPayload();
          if (payload && typeof Storage !== 'undefined') {
            const existing = this.findSavedAttempt(payload);
            if (existing) {
              this.showDuplicateSelfMark(existing);
              return existing;
            }
          }

          const result = originalSaveSelfMarkAttempt(...args);
          if (payload && Paper2.attemptSaved) this.tagLatestSelfMark(payload);
          return result;
        };
        this.selfMarkPatched = true;
      }

      if (this.installed) return true;
      const originalRender = Paper2.render.bind(Paper2);
      Paper2.render = (...args) => {
        const result = originalRender(...args);
        this.mountControls(true);
        return result;
      };

      this.compactStoredHistory();
      this.installed = true;
      this.mountControls(false);
      return true;
    },

    scheduleMount() {
      if (this.mountQueued) return;
      this.mountQueued = true;
      window.requestAnimationFrame(() => {
        this.mountQueued = false;
        this.install();
        this.mountControls(false);
      });
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
      if (button.disabled !== this.grading) button.disabled = this.grading;
      const label = this.grading ? 'AI Instructor is grading…' : 'Grade with AI Instructor';
      if (button.textContent !== label) button.textContent = label;
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

    renderGrading(grading, savedAttempt = null) {
      const result = document.getElementById('ess-ai-result');
      if (!result) return;
      const model = String(grading.meta?.model || '').trim();
      const rubricVersion = String(grading.meta?.rubricVersion || 'ess-paper2b-v1').trim();
      const historyCount = Array.isArray(savedAttempt?.aiHistory) ? savedAttempt.aiHistory.length : 0;
      const progressStatus = savedAttempt
        ? `AI score saved to Progress${historyCount ? ` · ${historyCount} previous AI grade${historyCount === 1 ? '' : 's'} kept` : ''}.`
        : 'AI score was not saved to Progress.';
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
          <div class="ess-ai-meta">Rubric ${this.escapeHtml(rubricVersion)}${model ? ` · ${this.escapeHtml(model)}` : ''} · Phase 8B training result · ${this.escapeHtml(progressStatus)}</div>
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
      const timeout = window.setTimeout(() => controller.abort(), 150000);

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
        const savedAttempt = this.saveProgress(grading, payload);
        this.renderGrading(grading, savedAttempt);
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
      this.install();
      this.mountControls(false);

      if (!this.observer) {
        this.observer = new MutationObserver(() => this.scheduleMount());
        this.observer.observe(document.documentElement, { childList: true, subtree: true });
      }

      window.addEventListener('load', () => this.scheduleMount(), { once: true });
    }
  };

  EssAIInstructor.boot();
})();
