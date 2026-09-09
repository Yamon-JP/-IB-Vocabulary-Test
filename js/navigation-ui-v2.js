(() => {
  const NavigationUIV2 = window.NavigationUIV2 = {
    installed: false,
    pagesPatched: false,

    navItems: [
      { key: 'home', label: 'Home', icon: '⌂' },
      { key: 'train', label: 'Train', icon: '▶' },
      { key: 'statistics', label: 'Progress', icon: '▥' },
      { key: 'achievements', label: 'Trophies', icon: '🏆' },
      { key: 'settings', label: 'Settings', icon: '⚙' }
    ],

    activeFullMock() {
      return [
        window.BiologyPaper1FullMock,
        window.BiologyPaper2FullMock,
        window.EssPaper1FullMock,
        window.EssPaper2FullMock,
        window.MathAISLFullMock
      ].find(module => Boolean(module?.active)) || null;
    },

    activeKey(page = typeof Pages !== 'undefined' ? Pages.current : 'home') {
      if (page === 'selection' || page === 'practice') return 'train';
      if (page === 'statistics') return 'statistics';
      if (page === 'achievements') return 'achievements';
      if (page === 'settings') return 'settings';
      return 'home';
    },

    renderNav() {
      const nav = document.querySelector('.bottom-nav.navigation');
      if (!nav) return false;

      nav.classList.add('navigation-ui-v2');
      nav.innerHTML = this.navItems.map(item => `
        <button type="button" class="navigation-v2-item" data-nav-key="${item.key}" aria-label="${item.label}">
          <span class="navigation-v2-icon" aria-hidden="true">${item.icon}</span>
          <span class="navigation-v2-label">${item.label}</span>
        </button>`).join('');

      nav.querySelectorAll('[data-nav-key]').forEach(button => {
        button.addEventListener('click', () => this.navigate(button.dataset.navKey));
      });

      this.updateActive();
      return true;
    },

    navigate(key) {
      if (typeof Pages === 'undefined') return;

      if (key === 'train') {
        this.openTrain();
        return;
      }

      const target = ({
        home: 'home',
        statistics: 'statistics',
        achievements: 'achievements',
        settings: 'settings'
      })[key];

      if (target) Pages.show(target);
    },

    openTrain() {
      const activeMock = this.activeFullMock();
      if (activeMock) {
        Pages.show('practice');
        if (typeof App !== 'undefined' && typeof App.updatePracticeHeader === 'function') App.updatePracticeHeader();
        return;
      }

      if (typeof App !== 'undefined' && App.state?.subject) {
        if (typeof App.backToSelection === 'function') {
          App.backToSelection();
          return;
        }
        Pages.show('selection');
        return;
      }

      Pages.show('home');
      window.setTimeout(() => {
        const subjectSection = document.querySelector('#home-page .subject-section');
        if (!subjectSection) return;
        subjectSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
          document.querySelector('#subject-list .subject-card:not(:disabled)')?.focus();
        }, 300);
      }, 0);
    },

    updateActive(page = typeof Pages !== 'undefined' ? Pages.current : 'home') {
      const nav = document.querySelector('.bottom-nav.navigation');
      if (!nav) return;
      const active = this.activeKey(page);

      nav.querySelectorAll('[data-nav-key]').forEach(button => {
        const selected = button.dataset.navKey === active;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-current', selected ? 'page' : 'false');
      });
    },

    patchPages() {
      if (this.pagesPatched || typeof Pages === 'undefined') return;
      const original = Pages.show.bind(Pages);
      const self = this;

      Pages.show = function(page) {
        const result = original(page);
        window.setTimeout(() => self.updateActive(page), 0);
        return result;
      };

      this.pagesPatched = true;
    },

    install() {
      if (this.installed) return true;
      if (
        typeof Pages === 'undefined'
        || typeof App === 'undefined'
        || !document.querySelector('.bottom-nav.navigation')
      ) return false;

      if (!this.renderNav()) return false;
      this.patchPages();
      this.installed = true;
      this.updateActive();
      return true;
    },

    boot() {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (this.install() || attempts >= 400) {
          window.clearInterval(timer);
          if (!this.installed) console.warn('Navigation UI v2 could not initialize. Existing navigation remains available.');
        }
      }, 50);
    }
  };

  NavigationUIV2.boot();
})();
