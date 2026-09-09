const CourseCoverage = {
  storageKey: 'ib_course_coverage',
  schemaVersion: 1,
  data: { schemaVersion: 1, subjects: {} },
  providers: {},
  editorOpen: {},
  installed: false,

  install() {
    if (this.installed) return;
    this.installed = true;

    this.registerDefaultProviders();
    this.ensureStyles();
    this.patchApp();
    this.load();
    this.migrateBiologyLegacyState();
    this.render();
  },

  registerProvider(subject, provider) {
    if (!subject || !provider || typeof provider.getItems !== 'function') return;
    this.providers[subject] = provider;
  },

  registerDefaultProviders() {
    this.registerProvider('Biology SL', {
      itemNoun: 'units',
      visible: state => state?.subject === 'Biology SL' && ['paper1', 'paper2'].includes(state?.practiceType),
      getItems: () => {
        if (typeof Paper1 === 'undefined' || typeof Paper1.getAvailableUnits !== 'function') return [];
        const themeNames = {
          A: 'Unity and diversity',
          B: 'Form and function',
          C: 'Interaction and interdependence',
          D: 'Continuity and change'
        };
        return Paper1.getAvailableUnits().map(unit => {
          const group = String(unit || '').charAt(0) || 'Other';
          return {
            id: String(unit),
            label: String(unit),
            group,
            groupLabel: themeNames[group] ? `Theme ${group}: ${themeNames[group]}` : group
          };
        });
      }
    });
  },

  ensureStyles() {
    if (document.getElementById('course-coverage-styles')) return;
    const link = document.createElement('link');
    link.id = 'course-coverage-styles';
    link.rel = 'stylesheet';
    link.href = 'css/course-coverage.css';
    document.head.appendChild(link);
  },

  patchApp() {
    if (typeof App === 'undefined' || App.__courseCoveragePatched) return;

    const originalLoadState = App.loadState;
    App.loadState = function(...args) {
      const result = originalLoadState.apply(this, args);
      CourseCoverage.load();
      CourseCoverage.migrateBiologyLegacyState();
      return result;
    };

    const originalApplyPracticeTypeUI = App.applyPracticeTypeUI;
    App.applyPracticeTypeUI = function(...args) {
      const result = originalApplyPracticeTypeUI.apply(this, args);
      CourseCoverage.render();
      return result;
    };

    const originalToggleUnit = App.toggleBiologyLearnedUnit;
    App.toggleBiologyLearnedUnit = function(...args) {
      const result = originalToggleUnit.apply(this, args);
      CourseCoverage.captureBiologyLegacyState();
      CourseCoverage.render();
      return result;
    };

    const originalToggleTheme = App.toggleBiologyLearnedTheme;
    App.toggleBiologyLearnedTheme = function(...args) {
      const result = originalToggleTheme.apply(this, args);
      CourseCoverage.captureBiologyLegacyState();
      CourseCoverage.render();
      return result;
    };

    App.__courseCoveragePatched = true;
  },

  load() {
    const saved = typeof Storage !== 'undefined' ? Storage.load(this.storageKey) : null;
    const subjects = saved && saved.subjects && typeof saved.subjects === 'object'
      ? saved.subjects
      : {};

    this.data = {
      schemaVersion: this.schemaVersion,
      subjects: Object.fromEntries(Object.entries(subjects).map(([subject, value]) => {
        const items = Array.isArray(value?.items)
          ? [...new Set(value.items.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()))]
          : [];
        return [subject, {
          items,
          updatedAt: typeof value?.updatedAt === 'string' ? value.updatedAt : null
        }];
      }))
    };
  },

  save() {
    if (typeof Storage !== 'undefined') Storage.save(this.storageKey, this.data);
  },

  hasSubject(subject) {
    return Object.prototype.hasOwnProperty.call(this.data.subjects || {}, subject);
  },

  getSelected(subject) {
    const items = this.data.subjects?.[subject]?.items;
    return Array.isArray(items) ? [...items] : [];
  },

  setSelected(subject, items, { syncLegacy = true } = {}) {
    if (!subject) return;
    const normalized = [...new Set((Array.isArray(items) ? items : [])
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim()))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    this.data.subjects[subject] = {
      items: normalized,
      updatedAt: new Date().toISOString()
    };
    this.save();

    if (syncLegacy) this.syncLegacyState(subject);
  },

  migrateBiologyLegacyState() {
    if (typeof App === 'undefined') return;
    const legacy = Array.isArray(App.state?.biologyLearnedUnits)
      ? [...App.state.biologyLearnedUnits]
      : [];

    if (!this.hasSubject('Biology SL')) {
      this.setSelected('Biology SL', legacy, { syncLegacy: false });
    }

    this.syncLegacyState('Biology SL');
  },

  captureBiologyLegacyState() {
    if (typeof App === 'undefined') return;
    const legacy = Array.isArray(App.state?.biologyLearnedUnits)
      ? [...App.state.biologyLearnedUnits]
      : [];
    this.setSelected('Biology SL', legacy, { syncLegacy: false });
  },

  syncLegacyState(subject) {
    if (subject !== 'Biology SL' || typeof App === 'undefined') return;
    App.state.biologyLearnedUnits = this.getSelected(subject);
    if (typeof App.saveState === 'function') App.saveState();
  },

  getProvider(subject) {
    return this.providers[subject] || null;
  },

  getAvailableItems(subject) {
    const provider = this.getProvider(subject);
    if (!provider) return [];
    const raw = provider.getItems();
    if (!Array.isArray(raw)) return [];

    const seen = new Set();
    return raw.map(item => {
      const normalized = typeof item === 'string'
        ? { id: item, label: item, group: 'All', groupLabel: 'All' }
        : item;
      if (!normalized || typeof normalized.id !== 'string' || !normalized.id.trim()) return null;
      const id = normalized.id.trim();
      if (seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        label: String(normalized.label || id),
        group: String(normalized.group || 'All'),
        groupLabel: String(normalized.groupLabel || normalized.group || 'All')
      };
    }).filter(Boolean);
  },

  isVisible(subject) {
    const provider = this.getProvider(subject);
    if (!provider || typeof App === 'undefined') return false;
    return typeof provider.visible === 'function' ? Boolean(provider.visible(App.state)) : true;
  },

  toggleEditor(subject) {
    this.editorOpen[subject] = !this.editorOpen[subject];
    this.render();
  },

  toggleItem(subject, itemId, checked) {
    const selected = new Set(this.getSelected(subject));
    if (checked) selected.add(itemId);
    else selected.delete(itemId);
    this.setSelected(subject, [...selected]);
    this.render();
  },

  toggleGroup(subject, group, checked) {
    const selected = new Set(this.getSelected(subject));
    this.getAvailableItems(subject)
      .filter(item => item.group === group)
      .forEach(item => {
        if (checked) selected.add(item.id);
        else selected.delete(item.id);
      });
    this.setSelected(subject, [...selected]);
    this.render();
  },

  ensurePanel() {
    let panel = document.getElementById('course-coverage-panel');
    if (panel) return panel;

    const legacyControl = document.getElementById('paper1-learned-units-control');
    const scopeControl = document.querySelector('.scope-control');
    const anchor = legacyControl || scopeControl;
    if (!anchor || !anchor.parentNode) return null;

    panel = document.createElement('section');
    panel.id = 'course-coverage-panel';
    panel.className = 'course-coverage-panel';
    anchor.parentNode.insertBefore(panel, anchor);
    return panel;
  },

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  render() {
    if (typeof App === 'undefined') return;
    const subject = App.state?.subject || null;
    const visible = Boolean(subject && this.isVisible(subject));
    const panel = this.ensurePanel();

    document.body.classList.toggle('course-coverage-ready', visible);
    if (!panel) return;
    panel.style.display = visible ? 'block' : 'none';
    if (!visible) return;

    const provider = this.getProvider(subject);
    const available = this.getAvailableItems(subject);
    const selected = new Set(this.getSelected(subject));
    const selectedAvailable = available.filter(item => selected.has(item.id));
    const noun = provider?.itemNoun || 'items';
    const isOpen = Boolean(this.editorOpen[subject]);

    const groups = [];
    const groupMap = new Map();
    available.forEach(item => {
      if (!groupMap.has(item.group)) {
        const group = { id: item.group, label: item.groupLabel, items: [] };
        groupMap.set(item.group, group);
        groups.push(group);
      }
      groupMap.get(item.group).items.push(item);
    });

    const editorHtml = available.length
      ? groups.map(group => {
          const selectedCount = group.items.filter(item => selected.has(item.id)).length;
          const allChecked = group.items.length > 0 && selectedCount === group.items.length;
          return `
            <details class="course-coverage-group" ${isOpen ? 'open' : ''}>
              <summary>
                <span><strong>${this.escapeHtml(group.label)}</strong><small>${selectedCount} / ${group.items.length} selected</small></span>
              </summary>
              <div class="course-coverage-group-body">
                <label class="course-coverage-item course-coverage-select-all">
                  <input type="checkbox" data-coverage-group="${this.escapeHtml(group.id)}" ${allChecked ? 'checked' : ''}>
                  <span><strong>Select all</strong></span>
                </label>
                ${group.items.map(item => `
                  <label class="course-coverage-item">
                    <input type="checkbox" data-coverage-item="${this.escapeHtml(item.id)}" ${selected.has(item.id) ? 'checked' : ''}>
                    <span>${this.escapeHtml(item.label)}</span>
                  </label>`).join('')}
              </div>
            </details>`;
        }).join('')
      : '<p class="muted course-coverage-loading">Coverage options are loading...</p>';

    panel.innerHTML = `
      <div class="course-coverage-summary-row">
        <div>
          <p class="eyebrow">COURSE COVERAGE</p>
          <h3>Learned Content</h3>
          <p class="course-coverage-summary"><strong>${selectedAvailable.length} / ${available.length || '—'}</strong> ${this.escapeHtml(noun)} learned</p>
          <p class="muted course-coverage-note">Only content already studied in class is eligible for Paper 1 / Paper 2 practice.</p>
        </div>
        <button type="button" id="course-coverage-toggle" class="course-coverage-toggle">${isOpen ? 'Done' : 'Edit Coverage'}</button>
      </div>
      <div class="course-coverage-editor" ${isOpen ? '' : 'hidden'}>
        ${editorHtml}
      </div>`;

    const toggle = document.getElementById('course-coverage-toggle');
    if (toggle) toggle.onclick = () => this.toggleEditor(subject);

    panel.querySelectorAll('input[data-coverage-item]').forEach(input => {
      input.onchange = () => this.toggleItem(subject, input.dataset.coverageItem, input.checked);
    });

    panel.querySelectorAll('input[data-coverage-group]').forEach(input => {
      input.onchange = () => this.toggleGroup(subject, input.dataset.coverageGroup, input.checked);
      const groupItems = available.filter(item => item.group === input.dataset.coverageGroup);
      const count = groupItems.filter(item => selected.has(item.id)).length;
      input.indeterminate = count > 0 && count < groupItems.length;
    });
  }
};

CourseCoverage.install();
