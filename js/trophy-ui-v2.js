(() => {
  const TrophyUIV2 = window.TrophyUIV2 = {
    installed: false,
    pagesPatched: false,
    achievementsPatched: false,
    activeFilter: 'all',
    selectedSubject: null,

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    progressData() {
      return typeof Progress !== 'undefined' ? (Progress.data || {}) : {};
    },

    subjects(progress = this.progressData()) {
      return Object.keys(progress.chapterStats || {});
    },

    globalCategory(definition) {
      return definition?.type === 'streak' ? 'streak' : 'general';
    },

    globalState(key, definition, progress = this.progressData()) {
      const unlocked = Boolean(Achievements.data?.[key]);
      const current = typeof Achievements.getProgress === 'function'
        ? Number(Achievements.getProgress(definition, progress) || 0)
        : 0;
      const target = Math.max(1, Number(definition?.target || 1));
      return {
        key,
        definition,
        unlocked,
        current,
        target,
        pct: unlocked ? 100 : Math.max(0, Math.min(100, Math.round(current / target * 100))),
        category: this.globalCategory(definition)
      };
    },

    chapterMilestoneState(subject, chapter, key, definition, progress = this.progressData()) {
      const current = Achievements.getChapterProgress(subject, chapter, progress);
      const unlocked = Boolean(current.achievements?.[key]);
      const questionsTarget = Math.max(1, Number(definition?.targetQuestions || 1));
      const accuracyTarget = Math.max(0, Number(definition?.targetAccuracy || 0));
      let pct;
      if (unlocked) {
        pct = 100;
      } else if (accuracyTarget > 0) {
        const questionPart = Math.min(Number(current.questions || 0) / questionsTarget, 1) * 50;
        const accuracyPart = Math.min(Number(current.accuracy || 0) / accuracyTarget, 1) * 50;
        pct = Math.round(questionPart + accuracyPart);
      } else {
        pct = Math.round(Math.min(Number(current.questions || 0) / questionsTarget, 1) * 100);
      }
      return {
        key,
        definition,
        current,
        unlocked,
        pct: Math.max(0, Math.min(100, pct))
      };
    },

    collectionSummary(progress = this.progressData()) {
      const globalEntries = Object.entries(Achievements.definitions || {});
      const chapterDefinitionKeys = Object.keys(Achievements.chapterDefinitions || {});
      let chapterTotal = 0;
      let chapterUnlocked = 0;

      Object.entries(progress.chapterStats || {}).forEach(([subject, chapters]) => {
        Object.keys(chapters || {}).forEach(chapter => {
          chapterTotal += chapterDefinitionKeys.length;
          const earned = Achievements.data?.chapterAchievements?.[subject]?.[chapter] || {};
          chapterDefinitionKeys.forEach(key => {
            if (earned[key]) chapterUnlocked += 1;
          });
        });
      });

      const globalUnlocked = globalEntries.filter(([key]) => Boolean(Achievements.data?.[key])).length;
      const total = globalEntries.length + chapterTotal;
      const unlocked = globalUnlocked + chapterUnlocked;
      const percent = total ? Math.round(unlocked / total * 100) : 0;
      const rank = typeof Achievements.getTrophyRank === 'function'
        ? Achievements.getTrophyRank(unlocked, total)
        : { title: 'Rookie', icon: '🌱', description: 'Start practicing to build your collection.' };

      return { total, unlocked, percent, rank };
    },

    restructure() {
      const page = document.getElementById('achievements-page');
      if (!page) return false;
      if (document.getElementById('trophy-ui-v2-root')) return true;

      page.classList.add('trophy-ui-v2-page');
      const root = document.createElement('section');
      root.id = 'trophy-ui-v2-root';
      root.innerHTML = `
        <header class="trophy-v2-hero">
          <div class="trophy-v2-hero-copy">
            <p class="eyebrow">ACHIEVEMENT COLLECTION</p>
            <h2>🏆 Trophy Room</h2>
            <p>Build a collection through consistent training and chapter mastery.</p>
          </div>
          <div class="trophy-v2-rank-card">
            <div id="trophy-v2-rank-icon" class="trophy-v2-rank-icon">🌱</div>
            <div class="trophy-v2-rank-copy">
              <span>CURRENT RANK</span>
              <strong id="trophy-v2-rank-title">Rookie</strong>
              <small id="trophy-v2-rank-description">Start practicing to build your collection.</small>
            </div>
            <div class="trophy-v2-collection-score">
              <strong id="trophy-v2-unlocked">0 / 0</strong>
              <span>Unlocked</span>
              <div class="trophy-v2-summary-track"><span id="trophy-v2-summary-bar"></span></div>
              <small id="trophy-v2-percent">0% Complete</small>
            </div>
          </div>
        </header>

        <nav id="trophy-v2-filters" class="trophy-v2-filters" aria-label="Trophy categories"></nav>

        <section class="trophy-v2-panel trophy-v2-next-panel">
          <div class="trophy-v2-section-heading">
            <div><p class="eyebrow">NEXT UP</p><h3>Closest unlocks</h3></div>
            <span>Based on current progress</span>
          </div>
          <div id="trophy-v2-next" class="trophy-v2-next-grid"></div>
        </section>

        <section id="trophy-v2-global-section" class="trophy-v2-panel">
          <div class="trophy-v2-section-heading">
            <div><p class="eyebrow">COLLECTION</p><h3 id="trophy-v2-global-title">Global Achievements</h3></div>
            <span id="trophy-v2-global-count">0 collected</span>
          </div>
          <div id="trophy-v2-global-grid" class="trophy-v2-global-grid"></div>
        </section>

        <section id="trophy-v2-exam-section" class="trophy-v2-panel trophy-v2-exam-panel">
          <div class="trophy-v2-section-heading">
            <div><p class="eyebrow">FINAL EXAM</p><h3>Final Exam Milestones</h3></div>
            <span>App readiness milestones · not IB grade boundaries</span>
          </div>
          <div id="trophy-v2-exam-content"></div>
        </section>

        <section id="trophy-v2-chapter-section" class="trophy-v2-panel trophy-v2-chapter-panel">
          <div class="trophy-v2-section-heading">
            <div><p class="eyebrow">CHAPTER MASTERY</p><h3>Chapter Achievements</h3></div>
            <span>Tap a chapter for details</span>
          </div>
          <div id="trophy-v2-subject-tabs" class="trophy-v2-subject-tabs" role="tablist" aria-label="Chapter trophy subjects"></div>
          <div id="trophy-v2-chapter-list" class="trophy-v2-chapter-list"></div>
        </section>`;

      page.insertBefore(root, page.firstChild);
      return true;
    },

    setFilter(filter) {
      if (!['all', 'general', 'streak', 'exam', 'chapter'].includes(filter)) return;
      this.activeFilter = filter;
      this.render();
    },

    renderFilters() {
      const nav = document.getElementById('trophy-v2-filters');
      if (!nav) return;
      const filters = [
        ['all', 'ALL'],
        ['general', 'GENERAL'],
        ['streak', 'STREAK'],
        ['exam', 'EXAM'],
        ['chapter', 'CHAPTER']
      ];
      nav.innerHTML = filters.map(([key, label]) => `
        <button type="button" class="${key === this.activeFilter ? 'active' : ''}" data-trophy-filter="${key}" aria-pressed="${key === this.activeFilter}">${label}</button>`).join('');
      nav.querySelectorAll('[data-trophy-filter]').forEach(button => {
        button.addEventListener('click', () => this.setFilter(button.dataset.trophyFilter));
      });
    },

    renderSummary(progress = this.progressData()) {
      const summary = this.collectionSummary(progress);
      const set = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      };
      set('trophy-v2-rank-icon', summary.rank.icon);
      set('trophy-v2-rank-title', summary.rank.title);
      set('trophy-v2-rank-description', summary.rank.description);
      set('trophy-v2-unlocked', `${summary.unlocked} / ${summary.total}`);
      set('trophy-v2-percent', `${summary.percent}% Complete`);
      const bar = document.getElementById('trophy-v2-summary-bar');
      if (bar) bar.style.width = `${summary.percent}%`;
    },

    nextCandidates(progress = this.progressData()) {
      const items = [];
      Object.entries(Achievements.definitions || {}).forEach(([key, definition]) => {
        const state = this.globalState(key, definition, progress);
        if (state.unlocked) return;
        items.push({
          kind: 'global',
          title: definition.title,
          subtitle: definition.description,
          pct: state.pct,
          meta: `${state.current} / ${state.target}`
        });
      });

      Object.entries(progress.chapterStats || {}).forEach(([subject, chapters]) => {
        Object.keys(chapters || {}).forEach(chapter => {
          Object.entries(Achievements.chapterDefinitions || {}).forEach(([key, definition]) => {
            const state = this.chapterMilestoneState(subject, chapter, key, definition, progress);
            if (state.unlocked) return;
            items.push({
              kind: 'chapter',
              title: definition.title,
              subtitle: `${subject} · ${chapter}`,
              pct: state.pct,
              meta: definition.targetAccuracy > 0
                ? `${state.current.questions}/${definition.targetQuestions} · ${state.current.accuracy}%`
                : `${state.current.questions} / ${definition.targetQuestions}`
            });
          });
        });
      });

      if (typeof FinalExamAchievements !== 'undefined' && FinalExamAchievements.installed && typeof FinalExamAchievements.nextCandidates === 'function') {
        items.push(...FinalExamAchievements.nextCandidates());
      }

      return items.sort((a, b) => b.pct - a.pct || a.title.localeCompare(b.title)).slice(0, 2);
    },

    renderNext(progress = this.progressData()) {
      const container = document.getElementById('trophy-v2-next');
      if (!container) return;
      const items = this.nextCandidates(progress);
      if (!items.length) {
        container.innerHTML = '<div class="trophy-v2-empty">No locked achievements are currently tracked. Your collection is complete for the available data.</div>';
        return;
      }
      container.innerHTML = items.map(item => `
        <article class="trophy-v2-next-card">
          <div class="trophy-v2-next-icon">🔒</div>
          <div class="trophy-v2-next-copy">
            <span>${this.escapeHtml(item.kind === 'chapter' ? 'CHAPTER' : item.kind === 'exam' ? 'EXAM' : 'GLOBAL')}</span>
            <strong>${this.escapeHtml(item.title)}</strong>
            <small>${this.escapeHtml(item.subtitle)}</small>
          </div>
          <div class="trophy-v2-next-metric"><strong>${item.pct}%</strong><small>${this.escapeHtml(item.meta)}</small></div>
          <div class="trophy-v2-progress-track"><span style="width:${item.pct}%"></span></div>
        </article>`).join('');
    },

    globalEntries(progress = this.progressData()) {
      const entries = Object.entries(Achievements.definitions || {})
        .map(([key, definition]) => this.globalState(key, definition, progress));
      if (this.activeFilter === 'general') return entries.filter(item => item.category === 'general');
      if (this.activeFilter === 'streak') return entries.filter(item => item.category === 'streak');
      return entries;
    },

    renderGlobals(progress = this.progressData()) {
      const section = document.getElementById('trophy-v2-global-section');
      const grid = document.getElementById('trophy-v2-global-grid');
      const count = document.getElementById('trophy-v2-global-count');
      const title = document.getElementById('trophy-v2-global-title');
      if (!section || !grid || !count || !title) return;

      const show = ['all', 'general', 'streak'].includes(this.activeFilter);
      section.hidden = !show;
      if (!show) return;

      const entries = this.globalEntries(progress);
      const unlocked = entries.filter(item => item.unlocked).length;
      title.textContent = this.activeFilter === 'streak' ? 'Streak Achievements'
        : this.activeFilter === 'general' ? 'General Achievements'
          : 'Global Achievements';
      count.textContent = `${unlocked} / ${entries.length} collected`;

      grid.innerHTML = entries.map(item => `
        <details class="trophy-v2-global-card ${item.unlocked ? 'unlocked' : 'locked'}">
          <summary>
            <span class="trophy-v2-card-icon">${item.unlocked ? '🏆' : '🔒'}</span>
            <span class="trophy-v2-card-copy">
              <strong>${this.escapeHtml(item.definition.title)}</strong>
              <small>${item.unlocked ? 'Unlocked' : `${item.pct}% complete`}</small>
            </span>
            <span class="trophy-v2-card-chevron">⌄</span>
          </summary>
          <div class="trophy-v2-card-detail">
            <p>${this.escapeHtml(item.definition.description)}</p>
            <div class="trophy-v2-progress-track"><span style="width:${item.pct}%"></span></div>
            <small>${item.unlocked ? 'Completed' : `${item.current} / ${item.target}`}</small>
          </div>
        </details>`).join('') || '<div class="trophy-v2-empty">No achievements in this category yet.</div>';
    },

    renderExam() {
      const section = document.getElementById('trophy-v2-exam-section');
      const container = document.getElementById('trophy-v2-exam-content');
      if (!section || !container) return;
      const show = this.activeFilter === 'all' || this.activeFilter === 'exam';
      section.hidden = !show;
      if (!show) return;

      if (typeof FinalExamAchievements === 'undefined' || !FinalExamAchievements.installed || typeof FinalExamAchievements.render !== 'function') {
        container.innerHTML = '<div class="trophy-v2-empty">Final Exam milestone data is not available yet. Existing achievement progress remains unchanged.</div>';
        return;
      }
      FinalExamAchievements.render(container);
    },

    renderSubjectTabs(progress = this.progressData()) {
      const area = document.getElementById('trophy-v2-subject-tabs');
      if (!area) return;
      const subjects = this.subjects(progress);
      if (!this.selectedSubject || !subjects.includes(this.selectedSubject)) this.selectedSubject = subjects[0] || null;

      area.innerHTML = subjects.length
        ? subjects.map(subject => `
            <button type="button" class="${subject === this.selectedSubject ? 'active' : ''}" data-trophy-subject="${this.escapeHtml(subject)}" aria-pressed="${subject === this.selectedSubject}">${this.escapeHtml(subject)}</button>`).join('')
        : '<span class="trophy-v2-empty-inline">No chapter data yet.</span>';

      area.querySelectorAll('[data-trophy-subject]').forEach(button => {
        button.addEventListener('click', () => {
          this.selectedSubject = button.dataset.trophySubject;
          this.renderChapters(progress);
          this.renderSubjectTabs(progress);
        });
      });
    },

    chapterRow(subject, chapter, progress = this.progressData()) {
      const current = Achievements.getChapterProgress(subject, chapter, progress);
      const milestones = Object.entries(Achievements.chapterDefinitions || {})
        .map(([key, definition]) => this.chapterMilestoneState(subject, chapter, key, definition, progress));
      const unlocked = milestones.filter(item => item.unlocked).length;
      const icons = milestones.map(item => `<span title="${this.escapeHtml(item.definition.title)}" class="${item.unlocked ? 'unlocked' : 'locked'}">${item.unlocked ? '🏆' : '🔒'}</span>`).join('');

      return `
        <details class="trophy-v2-chapter-row">
          <summary>
            <span class="trophy-v2-chapter-copy">
              <strong>${this.escapeHtml(chapter)}</strong>
              <small>${current.correct || 0} / ${current.questions || 0} correct</small>
            </span>
            <span class="trophy-v2-chapter-icons" aria-label="${unlocked} of ${milestones.length} chapter trophies unlocked">${icons}</span>
            <span class="trophy-v2-chapter-metric"><strong>${unlocked} / ${milestones.length}</strong><small>${current.accuracy}%</small></span>
            <span class="trophy-v2-card-chevron">⌄</span>
          </summary>
          <div class="trophy-v2-chapter-detail">
            ${milestones.map(item => {
              const def = item.definition;
              const meta = def.targetAccuracy > 0
                ? `${item.current.questions}/${def.targetQuestions} questions · ${item.current.accuracy}% / ${def.targetAccuracy}% accuracy`
                : `${item.current.questions} / ${def.targetQuestions} questions`;
              return `
                <div class="trophy-v2-milestone ${item.unlocked ? 'unlocked' : 'locked'}">
                  <span>${item.unlocked ? '🏆' : '🔒'}</span>
                  <div><strong>${this.escapeHtml(def.title)}</strong><small>${this.escapeHtml(meta)}</small></div>
                  <strong>${item.unlocked ? 'DONE' : `${item.pct}%`}</strong>
                </div>`;
            }).join('')}
          </div>
        </details>`;
    },

    renderChapters(progress = this.progressData()) {
      const section = document.getElementById('trophy-v2-chapter-section');
      const container = document.getElementById('trophy-v2-chapter-list');
      if (!section || !container) return;
      const show = this.activeFilter === 'all' || this.activeFilter === 'chapter';
      section.hidden = !show;
      if (!show) return;

      this.renderSubjectTabs(progress);
      if (!this.selectedSubject) {
        container.innerHTML = '<div class="trophy-v2-empty">Complete chapter practice to start building chapter trophies.</div>';
        return;
      }

      const chapters = progress.chapterStats?.[this.selectedSubject] || {};
      container.innerHTML = Object.keys(chapters)
        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
        .map(chapter => this.chapterRow(this.selectedSubject, chapter, progress))
        .join('') || '<div class="trophy-v2-empty">No chapter progress for this subject yet.</div>';
    },

    render() {
      if (!this.restructure()) return false;
      const progress = this.progressData();
      this.renderSummary(progress);
      this.renderFilters();
      this.renderNext(progress);
      this.renderGlobals(progress);
      this.renderExam();
      this.renderChapters(progress);
      return true;
    },

    patchAchievements() {
      if (this.achievementsPatched || typeof Achievements === 'undefined' || typeof Achievements.render !== 'function') return;
      const original = Achievements.render.bind(Achievements);
      const self = this;
      Achievements.render = function(...args) {
        const result = original(...args);
        window.setTimeout(() => self.render(), 0);
        return result;
      };
      this.achievementsPatched = true;
    },

    patchPages() {
      if (this.pagesPatched || typeof Pages === 'undefined') return;
      const original = Pages.show.bind(Pages);
      const self = this;
      Pages.show = function(page) {
        const result = original(page);
        if (page === 'achievements') window.setTimeout(() => self.render(), 0);
        return result;
      };
      this.pagesPatched = true;
    },

    install() {
      if (this.installed) return true;
      if (
        typeof Achievements === 'undefined'
        || typeof Progress === 'undefined'
        || typeof Pages === 'undefined'
        || !document.getElementById('achievements-page')
      ) return false;

      if (!this.restructure()) return false;
      this.patchAchievements();
      this.patchPages();
      this.installed = true;
      this.render();
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 400) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Trophy UI v2 could not initialize. Existing Trophy Room remains available.');
        }
      }, 50);
    }
  };

  TrophyUIV2.boot();
})();
