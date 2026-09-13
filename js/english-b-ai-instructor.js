// English B HL Paper 1 AI Instructor frontend.
// Adds AI grading while preserving the existing self-mark workflow.
(() => {
  const EnglishBAIInstructor = window.EnglishBAIInstructor = {
    installed: false,
    grading: false,
    endpointKey: 'ib_ai_instructor_endpoint',
    progressStoreKey: 'ib_english_b_paper1_progress',
    observer: null,
    selfMarkPatched: false,

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
      const source = [
        payload?.task?.id || '',
        payload?.selectedTextType || '',
        payload?.answer || ''
      ].join('|');
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
        language: criterion(grading.language),
        message: criterion(grading.message),
        conceptualUnderstanding: criterion(grading.conceptualUnderstanding),
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
      const language = Number(scores.language);
      const message = Number(scores.message);
      const conceptualUnderstanding = Number(scores.conceptualUnderstanding);
      const score = Number(item?.score);
      if (![language, message, conceptualUnderstanding, score].every(Number.isFinite)) return null;
      return {
        gradedAt: item?.gradedAt || item?.updatedAt || item?.createdAt || new Date().toISOString(),
        score,
        maxMarks: Number(item?.maxMarks) || 30,
        scores: { language, message, conceptualUnderstanding }
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
      if (changed) {
        Storage.save(this.progressStoreKey, {
          ...saved,
          attempts
        });
      }
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
        || String(lastAttempt?.textType || '') !== String(payload.selectedTextType || '')
        || Number(lastAttempt?.wordCount) !== Number(payload.wordCount)
      ) return;
      const fingerprint = this.answerFingerprint(payload);
      if (lastAttempt?.answerFingerprint === fingerprint) return;
      attempts[lastIndex] = { ...lastAttempt, answerFingerprint: fingerprint };
      Storage.save(this.progressStoreKey, {
        ...saved,
        attempts
      });
    },

    saveProgress(grading, payload) {
      if (typeof Storage === 'undefined' || !payload?.task?.id) return null;
      const saved = Storage.load(this.progressStoreKey) || {};
      const attempts = Array.isArray(saved.attempts) ? [...saved.attempts] : [];
      const fingerprint = this.answerFingerprint(payload);
      const now = new Date().toISOString();
      const aiAttempt = {
        schemaVersion: 1,
        attemptId: `AI-${payload.task.id}-${Date.now()}`,
        questionId: payload.task.id,
        subject: 'English B HL',
        assessmentTarget: 'english-b-paper1-writing',
        chapter: payload.task.chapter || '',
        theme: payload.task.theme || '',
        textType: payload.selectedTextType,
        wordCount: Number(payload.wordCount) || 0,
        scores: {
          language: grading.language.score,
          message: grading.message.score,
          conceptualUnderstanding: grading.conceptualUnderstanding.score
        },
        score: grading.total,
        maxMarks: 30,
        gradingSource: 'ai-instructor',
        answerFingerprint: fingerprint,
        aiFeedback: this.feedbackSnapshot(grading),
        aiMeta: {
          provider: String(grading.meta?.provider || ''),
          model: String(grading.meta?.model || ''),
          rubricVersion: String(grading.meta?.rubricVersion || 'engb-paper1-v1')
        },
        aiHistory: [],
        firstGradedAt: now,
        createdAt: now,
        updatedAt: now
      };

      let replaceIndex = -1;
      for (let index = attempts.length - 1; index >= 0; index -= 1) {
        const attempt = attempts[index];
        if (
          attempt?.gradingSource === 'ai-instructor'
          && attempt?.questionId === payload.task.id
          && attempt?.answerFingerprint === fingerprint
        ) {
          replaceIndex = index;
          break;
        }
      }

      if (replaceIndex < 0 && Boolean(window.EnglishBPaper1?.attemptSaved) && attempts.length) {
        const lastIndex = attempts.length - 1;
        const lastAttempt = attempts[lastIndex];
        if (
          lastAttempt?.gradingSource !== 'ai-instructor'
          && lastAttempt?.questionId === payload.task.id
          && String(lastAttempt?.textType || '') === String(payload.selectedTextType || '')
          && lastAttempt?.answerFingerprint === fingerprint
        ) {
          replaceIndex = lastIndex;
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

      if (window.EnglishBPaper1) window.EnglishBPaper1.attemptSaved = true;
      const selfMarkButton = document.getElementById('engb-p1-save');
      const selfMarkStatus = document.getElementById('engb-p1-save-status');
      if (selfMarkButton) selfMarkButton.disabled = true;
      if (selfMarkStatus) selfMarkStatus.textContent = `${aiAttempt.score} / 30 AI score saved to Progress.`;
      if (typeof FinalExamProgressV2 !== 'undefined' && typeof FinalExamProgressV2.render === 'function') {
        FinalExamProgressV2.render();
      }
      return aiAttempt;
    },

    install() {
      if (this.installed) return true;
      if (typeof EnglishBPaper1 === 'undefined' || typeof EnglishBPaper1.renderSelectedTask !== 'function') return false;

      const originalRenderSelectedTask = EnglishBPaper1.renderSelectedTask.bind(EnglishBPaper1);
      EnglishBPaper1.renderSelectedTask = (...args) => {
        const result = originalRenderSelectedTask(...args);
        this.mountControls();
        return result;
      };

      if (!this.selfMarkPatched && typeof EnglishBPaper1.saveSelfMark === 'function') {
        const originalSaveSelfMark = EnglishBPaper1.saveSelfMark.bind(EnglishBPaper1);
        EnglishBPaper1.saveSelfMark = (...args) => {
          const payload = this.buildPayload();
          const result = originalSaveSelfMark(...args);
          if (payload && EnglishBPaper1.attemptSaved) this.tagLatestSelfMark(payload);
          return result;
        };
        this.selfMarkPatched = true;
      }

      this.compactStoredHistory();
      this.installed = true;
      this.mountControls();
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      return true;
    },

    mountControls() {
      const selected = document.getElementById('engb-p1-selected');
      const actions = selected?.querySelector('.engb-p1-actions');
      if (!selected || !actions) return;

      if (!document.getElementById('engb-ai-grade-button')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'engb-ai-grade-button';
        button.className = 'engb-ai-grade-button';
        button.textContent = 'Grade with AI Instructor';
        button.addEventListener('click', () => this.grade());
        actions.insertBefore(button, actions.firstChild);
      }

      if (!document.getElementById('engb-ai-result')) {
        const result = document.createElement('section');
        result.id = 'engb-ai-result';
        result.className = 'engb-ai-result';
        result.setAttribute('aria-live', 'polite');
        actions.insertAdjacentElement('afterend', result);
      }
    },

    setBusy(isBusy) {
      this.grading = Boolean(isBusy);
      const button = document.getElementById('engb-ai-grade-button');
      if (!button) return;
      button.disabled = this.grading;
      button.textContent = this.grading ? 'AI Instructor is grading…' : 'Grade with AI Instructor';
    },

    showMessage(title, message, kind = 'info') {
      const result = document.getElementById('engb-ai-result');
      if (!result) return;
      result.innerHTML = `
        <div class="engb-ai-message ${this.escapeHtml(kind)}">
          <strong>${this.escapeHtml(title)}</strong>
          <p>${this.escapeHtml(message)}</p>
        </div>`;
    },

    buildPayload() {
      if (typeof EnglishBPaper1 === 'undefined') return null;
      const task = typeof EnglishBPaper1.currentTask === 'function' ? EnglishBPaper1.currentTask() : null;
      const answer = document.getElementById('engb-p1-answer');
      const selectedTextType = String(EnglishBPaper1.selectedTextType || '').trim();
      const responseText = String(answer?.value || '').trim();
      if (!task || !answer) return null;

      return {
        task: {
          id: task.id || null,
          chapter: task.chapter || null,
          theme: task.theme || null,
          prompt: task.prompt || '',
          requirements: Array.isArray(task.requirements) ? task.requirements : [],
          audience: task.audience || '',
          purpose: task.purpose || '',
          register: task.register || '',
          bestTextType: task.bestTextType || '',
          textTypeRationale: task.textTypeRationale || ''
        },
        selectedTextType,
        answer: responseText,
        wordCount: typeof EnglishBPaper1.countWords === 'function'
          ? EnglishBPaper1.countWords(responseText)
          : responseText.split(/\s+/).filter(Boolean).length
      };
    },

    validateCriterion(value, max) {
      if (!value || typeof value !== 'object') return null;
      const score = Number(value.score);
      if (!Number.isInteger(score) || score < 0 || score > max) return null;
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
      const language = this.validateCriterion(grading.language, 12);
      const message = this.validateCriterion(grading.message, 12);
      const conceptualUnderstanding = this.validateCriterion(grading.conceptualUnderstanding, 6);
      if (!language || !message || !conceptualUnderstanding) return null;

      const topImprovements = Array.isArray(grading.topImprovements)
        ? grading.topImprovements.map(String).filter(Boolean).slice(0, 3)
        : [];
      const topImprovementsJa = Array.isArray(grading.topImprovementsJa)
        ? grading.topImprovementsJa.map(String).filter(Boolean).slice(0, 3)
        : [];
      return {
        language,
        message,
        conceptualUnderstanding,
        total: language.score + message.score + conceptualUnderstanding.score,
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
        <div class="engb-ai-list">
          <strong>${this.escapeHtml(title)}</strong>
          <ul>${items.map((item, index) => `
            <li>
              ${this.escapeHtml(item)}
              ${itemsJa[index] ? `<div class="muted">🇯🇵 ${this.escapeHtml(itemsJa[index])}</div>` : ''}
            </li>`).join('')}
          </ul>
        </div>`;
    },

    criterionHtml(label, criterion, max) {
      return `
        <article class="engb-ai-criterion">
          <div class="engb-ai-criterion-head">
            <strong>${this.escapeHtml(label)}</strong>
            <span>${criterion.score} / ${max}</span>
          </div>
          <p>${this.escapeHtml(criterion.rationale)}</p>
          ${criterion.rationaleJa ? `<p class="muted"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(criterion.rationaleJa)}</p>` : ''}
          ${criterion.explanationJa ? `<p class="muted"><strong>🇯🇵 簡単解説：</strong>${this.escapeHtml(criterion.explanationJa)}</p>` : ''}
          ${this.bilingualListHtml('Strengths', criterion.strengths, criterion.strengthsJa)}
          ${this.bilingualListHtml('Improve', criterion.improvements, criterion.improvementsJa)}
        </article>`;
    },

    historyDate(value) {
      const date = new Date(value || '');
      if (Number.isNaN(date.getTime())) return 'Previous grading';
      return date.toLocaleString();
    },

    historyHtml(savedAttempt) {
      const history = Array.isArray(savedAttempt?.aiHistory) ? [...savedAttempt.aiHistory].reverse() : [];
      if (!history.length) return '';
      return `
        <div class="engb-ai-priority">
          <details>
            <summary><strong>Previous AI Grades (${history.length})</strong></summary>
            <p class="muted">Re-grades of this exact answer. Final Exam Progress counts only the latest result.</p>
            <ol>${history.map(item => {
              const scores = item?.scores || {};
              return `<li>
                <strong>${this.escapeHtml(`${Number(item?.score) || 0} / ${Number(item?.maxMarks) || 30}`)}</strong>
                <div class="muted">${this.escapeHtml(this.historyDate(item?.gradedAt))} · Language ${Number(scores.language) || 0}/12 · Message ${Number(scores.message) || 0}/12 · Conceptual ${Number(scores.conceptualUnderstanding) || 0}/6</div>
              </li>`;
            }).join('')}</ol>
          </details>
        </div>`;
    },

    renderGrading(grading, savedAttempt = null) {
      const result = document.getElementById('engb-ai-result');
      if (!result) return;
      const model = String(grading.meta?.model || '').trim();
      const rubricVersion = String(grading.meta?.rubricVersion || 'engb-paper1-v1').trim();
      const progressNote = savedAttempt
        ? `AI score saved to Final Exam Progress · ${savedAttempt.score} / 30.`
        : 'AI score could not be saved to Progress; the grading result is still shown below.';
      result.innerHTML = `
        <section class="engb-ai-panel">
          <div class="engb-ai-header">
            <div>
              <p class="eyebrow">AI INSTRUCTOR</p>
              <h4>English B HL · Paper 1 feedback</h4>
              <p class="muted">Training assessment aligned to the Paper 1 criteria. This is not an official IB grade.</p>
              <p class="muted">英語の評価の直後に、日本語訳と短い解説を表示します。</p>
            </div>
            <div class="engb-ai-total"><strong>${grading.total}</strong><span>/ 30</span></div>
          </div>
          <div class="engb-ai-criteria">
            ${this.criterionHtml('Language', grading.language, 12)}
            ${this.criterionHtml('Message', grading.message, 12)}
            ${this.criterionHtml('Conceptual Understanding', grading.conceptualUnderstanding, 6)}
          </div>
          <div class="engb-ai-priority">
            <strong>Top 3 Improvements</strong>
            ${grading.topImprovements.length
              ? `<ol>${grading.topImprovements.map((item, index) => `
                <li>
                  ${this.escapeHtml(item)}
                  ${grading.topImprovementsJa[index] ? `<div class="muted">🇯🇵 ${this.escapeHtml(grading.topImprovementsJa[index])}</div>` : ''}
                </li>`).join('')}</ol>`
              : '<p class="muted">No priority list was returned.</p>'}
          </div>
          ${grading.nextStep ? `
            <div class="engb-ai-next">
              <strong>Next step</strong>
              <p>${this.escapeHtml(grading.nextStep)}</p>
              ${grading.nextStepJa ? `<p class="muted"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(grading.nextStepJa)}</p>` : ''}
            </div>` : ''}
          ${grading.overallComment ? `
            <div class="engb-ai-overall">
              <strong>Instructor comment</strong>
              <p>${this.escapeHtml(grading.overallComment)}</p>
              ${grading.overallCommentJa ? `<p class="muted"><strong>🇯🇵 日本語訳：</strong>${this.escapeHtml(grading.overallCommentJa)}</p>` : ''}
            </div>` : ''}
          ${this.historyHtml(savedAttempt)}
          <div class="engb-ai-meta">Rubric ${this.escapeHtml(rubricVersion)}${model ? ` · ${this.escapeHtml(model)}` : ''} · ${this.escapeHtml(progressNote)}</div>
        </section>`;
    },

    async grade() {
      if (this.grading) return;
      const payload = this.buildPayload();
      if (!payload) {
        this.showMessage('AI Instructor unavailable', 'Open an English B Paper 1 Writing task first.', 'error');
        return;
      }
      if (!payload.selectedTextType) {
        this.showMessage('Choose a text type', 'Select a text type before asking the AI Instructor to grade your response.', 'warning');
        return;
      }
      if (!payload.answer) {
        this.showMessage('Write an answer first', 'Enter your Paper 1 response before asking the AI Instructor to grade it.', 'warning');
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
      this.showMessage('AI Instructor', 'Reviewing your response against the Paper 1 criteria…');
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`${endpoint}/grade/english-b-paper1`, {
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
        if (!grading) throw new Error('AI Instructor returned an invalid grading result.');
        const savedAttempt = this.saveProgress(grading, payload);
        this.renderGrading(grading, savedAttempt);
      } catch (error) {
        const timedOut = error?.name === 'AbortError';
        this.showMessage(
          'AI grading could not be completed',
          timedOut
            ? 'The grading request timed out. Your answer is still on this page, so you can try again.'
            : 'The secure AI grading service is unavailable or returned an invalid response. Your existing self-mark remains available.',
          'error'
        );
        console.warn('English B AI Instructor request failed.', error);
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

  EnglishBAIInstructor.boot();
})();
